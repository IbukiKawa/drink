import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { docClient } from "./lib/dynamodb";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { UserEntity } from "./lib/userTypes";

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  try {
    const body = JSON.parse(event.body || "{}");
    const required = ["email", "name", "department", "joinYear", "gender", "floor"];
    const missing = required.filter((key) => !body[key]);
    if (missing.length > 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: `必須項目が不足してます: ${missing.join(",")}` }),
      };
    }

    const user: UserEntity = {
      Email: body.email,
      Name: body.name,
      Department: body.department,
      JoinYear: body.joinYear,
      Gender: body.gender,
      Floor: body.floor,
      CreatedAt: new Date().toISOString(),
    };

    try {
      await docClient.send(
        new PutCommand({
          TableName: process.env.USERS_TABLE,
          Item: user,
          ConditionExpression: "attribute_not_exists(Email)",
        })
      );
    } catch (error: any) {
      if (error.name === "ConditionalCheckFailedException") {
        return {
          statusCode: 409,
          body: JSON.stringify({ error: "このメールアドレスは既に登録されています" }),
        };
      }
      throw error;
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "登録完了", email: user.Email }),
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "サーバーエラーが発生しました" }),
    };
  }
};