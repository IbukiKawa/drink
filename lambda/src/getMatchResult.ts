import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { QueryCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "./lib/dynamodb";

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  try {
    const email = event.queryStringParameters?.email;
    const date = event.queryStringParameters?.date;

    // バリデーション
    if (!email || !date) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "メールアドレスと日付は必須です" }),
      };
    }

    // ユーザー登録済みチェック
    const user = await docClient.send(
      new GetCommand({
        TableName: process.env.USERS_TABLE,
        Key: { Email: email },
      })
    );

    if (!user.Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          matched: false,
          message: "ユーザーが見つかりません。先にユーザー登録を行ってください",
        }),
      };
    }

    // User1EmailIndex で検索
    const asUser1 = await docClient.send(
      new QueryCommand({
        TableName: process.env.MATCHES_TABLE,
        IndexName: "matchingUser1EmailIndex",
        KeyConditionExpression: "User1Email = :email AND #date = :date",
        ExpressionAttributeNames: { "#date": "Date" },
        ExpressionAttributeValues: { ":email": email, ":date": date },
      })
    );

    // User2EmailIndex で検索
    const asUser2 = await docClient.send(
      new QueryCommand({
        TableName: process.env.MATCHES_TABLE,
        IndexName: "matchingUser2EmailIndex",
        KeyConditionExpression: "User2Email = :email AND #date = :date",
        ExpressionAttributeNames: { "#date": "Date" },
        ExpressionAttributeValues: { ":email": email, ":date": date },
      })
    );

    // 両方の結果をマージ
    const allMatches = [...(asUser1.Items || []), ...(asUser2.Items || [])];

    if (allMatches.length === 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          matched: false,
          message: "本日のマッチング結果はまだありません。マッチングが実行されていないか、相手が見つかりませんでした",
        }),
      };
    }

    // パートナー情報取得
    const match = allMatches[0];
    const partnerEmail =
      match.User1Email === email ? match.User2Email : match.User1Email;

    const partner = await docClient.send(
      new GetCommand({
        TableName: process.env.USERS_TABLE,
        Key: { Email: partnerEmail },
      })
    );

    if (!partner.Item) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          matched: true,
          message: "マッチング相手の情報が見つかりませんでした",
          timeSlot: match.TimeSlot,
        }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        matched: true,
        message: "マッチングが成立しました！",
        date: date,
        timeSlot: match.TimeSlot,
        partner: {
          name: partner.Item.Name,
          department: partner.Item.Department,
          floor: partner.Item.Floor,
        },
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