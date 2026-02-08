import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { docClient } from "./lib/dynamodb";
import { GetCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";

const MATCHES_TABLE = process.env.MATCHES_TABLE!;
const USERS_TABLE = process.env.USERS_TABLE!;

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  try {
    const email = event.queryStringParameters?.email;
    const date = event.queryStringParameters?.date;

    if (!email || !date) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "emailとdateパラメータが必要です。" }),
      };
    }
    const asUser1 = await docClient.send(
      new QueryCommand({
        TableName: MATCHES_TABLE,
        IndexName: "User1EmailIndex",
        KeyConditionExpression: "User1Email = :email AND #date = :date",
        ExpressionAttributeNames: { "#date": "Date" },
        ExpressionAttributeValues: {
          ":email": email,
          ":date": date,
        },
      }),
    );

    const asUser2 = await docClient.send(
      new QueryCommand({
        TableName: MATCHES_TABLE,
        IndexName: "User2EmailIndex",
        KeyConditionExpression: "User2Email = :email AND #date = :date",
        ExpressionAttributeNames: { "#date": "Date" },
        ExpressionAttributeValues: {
          ":email": email,
          ":date": date,
        },
      }),
    );

    const allMatches = [...(asUser1.Items || []), ...(asUser2.Items || [])];
    if (allMatches.length === 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          matched: false,
          message: "",
        }),
      };
    }
    const match = allMatches[0];
    const partnerEmail = match.User1Email === email ? match.User2Email : match.User1Email;

    const partner = await docClient.send(
      new GetCommand({
        TableName: USERS_TABLE,
        Key: { Email: partnerEmail },
      }),
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        matched: true,
        date: date,
        timeSLot: match.TImeSlot,
        partner: partner.Item
          ? {
              name: partner.Item.Name,
              department: partner.Item.Department,
              floor: partner.Item.Floor,
            }
          : { name: "不明", department: "不明", floor: null },
      }),
    };
  } catch (error) {
    console.error("Error", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "サーバーエラーが発生しました" }),
    };
  }
};
