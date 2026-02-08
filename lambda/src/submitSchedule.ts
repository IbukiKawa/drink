import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { docClient } from "./lib/dynamodb";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import dayjs from "dayjs";

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
    try {
        const body = JSON.parse(event.body || "{}");
        if(!body.email || !body.date || !body.timeSlots){
            return {
                statusCode: 400,
                body: JSON.stringify({error: `必須項目が不足しています`})
            }
        }
        const targetDate = dayjs(body.date);
        const dayOfWeek = targetDate.day();
        if(![1, 3, 5].includes(dayOfWeek)){
            return{
                statusCode: 400,
                body: JSON.stringify({error: "奢り自販機は月・水・金のみ利用可能です"}),
            }
        }
        if (dayjs(body.date).isBefore(dayjs(), "day")) {
            return {
              statusCode: 400,
              body: JSON.stringify({ error: "過去の日付は指定できません" }),
            };
          }
        for (const timeSlot of body.timeSlots){
            await docClient.send(
                new PutCommand({
                    TableName: process.env.SCHEDULES_TABLE,
                    Item: {
                        Date: body.date,
                        TimeSlotEmail: `${timeSlot}#${body.email}`,
                        Email: body.email,
                        TimeSlot: timeSlot,
                        Status: "pending",
                    }
                })
            )
        }
        return {
            statusCode: 200,
            body: JSON.stringify({message: `スケジュールが登録されました`})
        }
    }catch(error){
        console.error("Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "サーバーエラーが発生しました" }),
    };
    }
}