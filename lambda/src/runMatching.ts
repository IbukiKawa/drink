// src/runMatching.ts
import { QueryCommand, PutCommand, UpdateCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "./lib/dynamodb";
import { MatchCandidate } from "./lib/matchingTypes";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { UserEntity } from "./lib/userTypes";
const USERS_TABLE = process.env.USERS_TABLE!;
const SCHEDULES_TABLE = process.env.SCHEDULES_TABLE!;
const MATCHES_TABLE = process.env.MATCHES_TABLE!;

// ============================================
// スコア計算（年次・階・性別で相性を数値化）
// ============================================
const calculateScore = (a: MatchCandidate, b: MatchCandidate): number => {
  let score: number = 0;
  const yearDiff = Math.abs(a.joinYear - b.joinYear);
  if (yearDiff === 0) {
    score += 5;
  } else if (yearDiff === 1) {
    score += 2;
  } else if (yearDiff === 2) {
    score += 1;
  }
  if (a.floor === b.floor) {
    score += 2;
  }
  if (a.gender === b.gender) {
    score += 2;
  }
  if (a.department === b.department) {
    score += 3;
  }
  return score;
};

// ============================================
// 候補者リストからベストなペアを作る
// ============================================
const matchCandidates = (candidates: MatchCandidate[]): [MatchCandidate, MatchCandidate][] => {
  const pairs: [MatchCandidate, MatchCandidate][] = [];
  const scorePairs: { a: MatchCandidate; b: MatchCandidate; score: number }[] = [];

  for (let i = 0; i < candidates.length; i++) {
    for (let j = i + 1; j < candidates.length; j++) {
      scorePairs.push({
        a: candidates[i],
        b: candidates[j],
        score: calculateScore(candidates[i], candidates[j]),
      });
    }
  }
  scorePairs.sort((x, y) => y.score - x.score);

  const matched = new Set<string>();

  for (const pair of scorePairs) {
    if (!matched.has(pair.a.email) && !matched.has(pair.b.email)) {
      pairs.push([pair.a, pair.b]);
      matched.add(pair.a.email);
      matched.add(pair.b.email);
    }
  }
  return pairs;
};

// ============================================
// メインハンドラー
// ============================================
export const handler = async (): Promise<void> => {
  try {
    // Step 1: 今日の日付を取得（JST）
    dayjs.extend(utc);
    dayjs.extend(timezone);
    const today = dayjs().tz("Asia/Tokyo").format("YYYY-MM-DD");

    // Step 2: Schedulesテーブルから今日の希望者を全員取得
    const result = await docClient.send(
      new QueryCommand({
        TableName: SCHEDULES_TABLE,
        KeyConditionExpression: "#date = :date",
        ExpressionAttributeValues: {
          ":date": today,
        },
        ExpressionAttributeNames: {
          "#date": "Date",
        },
      }),
    );

    // Step 3: 希望者のユーザー情報をUsersテーブルから取得
    const emails = [...new Set(result.Items?.map((item) => item.Email as string) || [])];
    const userMap = new Map<string, UserEntity>();

    for (const email of emails) {
      const user = await docClient.send(
        new GetCommand({
          TableName: USERS_TABLE,
          Key: {
            Email: email,
          },
        }),
      );
      if (user.Item) {
        userMap.set(email, user.Item as UserEntity);
      }
    }

    // Step 4: 時間枠ごとにグループ分け
    const slotCandidates = new Map<string, MatchCandidate[]>();
    if (result.Items) {
      for (const timeSlot of result.Items) {
        const user = userMap.get(timeSlot.Email as string);
        if (!user) continue;
        const time = timeSlot.TimeSlot as string;
        if (!slotCandidates.has(time)) {
          slotCandidates.set(time, []);
        }
        slotCandidates.get(time)!.push({
          email: user.Email,
          joinYear: user.JoinYear,
          gender: user.Gender,
          floor: user.Floor,
          timeSlot: time,
          department: user.Department,
        });
      }
    }
    // Step 5: 時間枠ごとにマッチング実行
    const matchedEmails = new Set<string>();
    const allParts: { pair: [MatchCandidate, MatchCandidate]; timeSlot: string }[] = [];

    const sortedSlots = [...slotCandidates.keys()].sort();

    for (const timeSlot of sortedSlots) {
      const candidates = slotCandidates.get(timeSlot)!.filter((c) => !matchedEmails.has(c.email));

      if (candidates.length < 2) {
        console.log("同時刻にペアが見つかりませんでした");
        continue;
      }
      const pairs = matchCandidates(candidates);

      for (const pair of pairs) {
        matchedEmails.add(pair[0].email);
        matchedEmails.add(pair[1].email);
        allParts.push({ pair, timeSlot });
      }
    }
    // Step 6: マッチング結果をMatchesテーブルに保存
    const generateMatchId = (): string => {
      return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    };
    for (const { pair, timeSlot } of allParts) {
      await docClient.send(
        new PutCommand({
          TableName: MATCHES_TABLE,
          Item: {
            Date: today,
            TimeSlotMatchId: `${timeSlot}#${generateMatchId()}`,
            User1Email: pair[0].email,
            User2Email: pair[1].email,
            TimeSlot: timeSlot,
            CreatedAt: new Date().toISOString(),
          },
        }),
      );
    }

    // Step 7: Schedulesのステータスを更新（matched / unmatched）
    for (const { pair, timeSlot } of allParts) {
      await docClient.send(
        new UpdateCommand({
          TableName: SCHEDULES_TABLE,
          Key: {
            Date: today,
            TimeSlotEmail: `${timeSlot}#${pair[0].email}`,
          },
          UpdateExpression: "SET #status = :status",
          ExpressionAttributeNames: { "#status": "Status" },
          ExpressionAttributeValues: { ":status": "matched" },
        }),
      );
      await docClient.send(
        new UpdateCommand({
          TableName: SCHEDULES_TABLE,
          Key: {
            Date: today,
            TimeSlotEmail: `${timeSlot}#${pair[1].email}`,
          },
          UpdateExpression: "SET #status = :status",
          ExpressionAttributeNames: { "#status": "Status" },
          ExpressionAttributeValues: { ":status": "matched" },
        }),
      );
    }
    for (const schedule of result.Items || []) {
      if (!matchedEmails.has(schedule.Email as string)) {
        await docClient.send(
          new UpdateCommand({
            TableName: SCHEDULES_TABLE,
            Key: {
              Date: today,
              TimeSlotEmail: schedule.TimeSlotEmail as string,
            },
            UpdateExpression: "SET #status = :status",
            ExpressionAttributeNames: { "#status": "Status" },
            ExpressionAttributeValues: { ":status": "unmatched" },
          }),
        );
      }
    }
    console.log("マッチング完了");
  } catch (error) {
    console.error("マッチングエラー:", error);
    throw error;
  }
};
