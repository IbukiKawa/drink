import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { PutCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "./lib/dynamodb";
import dayjs from "dayjs";

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  try {
    const body = JSON.parse(event.body || "{}");

    // バリデーション
    if (!body.email || !body.date || !body.timeSlots) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "メールアドレス、日付、時間帯は必須です" }),
      };
    }

    // 時間帯の配列チェック
    if (!Array.isArray(body.timeSlots) || body.timeSlots.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "1つ以上の時間帯を選択してください" }),
      };
    }

    // ユーザー登録済みチェック
    const user = await docClient.send(
      new GetCommand({
        TableName: process.env.USERS_TABLE,
        Key: { Email: body.email },
      })
    );

    if (!user.Item) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: "ユーザー登録がまだ完了していません。先にユーザー登録を行ってください" }),
      };
    }

    // 曜日チェック（月・水・金のみ）
    const targetDate = dayjs(body.date);
    const dayOfWeek = targetDate.day();
    if (![1, 3, 5].includes(dayOfWeek)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "参加日は月曜・水曜・金曜のみ選択できます" }),
      };
    }

    // 過去日チェック
    if (dayjs(body.date).isBefore(dayjs(), "day")) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "過去の日付は選択できません" }),
      };
    }

    // 時間枠ごとにレコード作成
    for (const timeSlot of body.timeSlots) {
      await docClient.send(
        new PutCommand({
          TableName: process.env.SCHEDULES_TABLE,
          Item: {
            Date: body.date,
            TimeSlotEmail: `${timeSlot}#${body.email}`,
            Email: body.email,
            TimeSlot: timeSlot,
            Status: "pending",
          },
        })
      );
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: `${body.timeSlots.length}件の時間帯でスケジュールを登録しました`,
        date: body.date,
        timeSlots: body.timeSlots,
      }),
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "サーバーエラーが発生しました" }),
    };
  }
};