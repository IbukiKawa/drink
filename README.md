# 「奢り自販機マッチングアプリ」をLambda×DynamoDBで作ってみた

社内の福利厚生「奢り自販機」の相手を自動マッチングするサーバーレスアプリケーション。

## 構成図

```
[Teams] → [API Gateway] → [Lambda] → [DynamoDB]
                             ↓
          [EventBridge] → [Lambda] → [Teams通知]
          (月水金 8:00)
```

## 技術スタック

| カテゴリ | 技術 |
|---------|------|
| インフラ構築 | Terraform |
| コンピュート | AWS Lambda (Node.js 20 / TypeScript) |
| データベース | Amazon DynamoDB |
| API | Amazon API Gateway (HTTP API) |
| スケジューラ | Amazon EventBridge Scheduler |

## セットアップ

### 1. Lambda関数のビルド

```bash
cd lambda
npm install
npm run build
```

### 2. Terraformでデプロイ

```bash
cd terraform
terraform init
terraform plan
terraform apply
```

### 3. 動作確認

デプロイ後に表示される API endpoint に対してリクエストを送信：

```bash
# ユーザー登録
curl -X POST https://<api-endpoint>/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "tanaka@example.com",
    "name": "田中太郎",
    "department": "技術部",
    "joinYear": 2025,
    "gender": "male",
    "floor": 5
  }'

# 希望登録
curl -X POST https://<api-endpoint>/schedules \
  -H "Content-Type: application/json" \
  -d '{
    "email": "tanaka@example.com",
    "date": "2026-02-09",
    "timeSlots": ["10:00", "15:00"]
  }'

# マッチング結果取得
curl "https://<api-endpoint>/matches?email=tanaka@example.com&date=2026-02-09"
```

## プロジェクト構成

```
ogori-vending/
├── terraform/
│   ├── main.tf            # プロバイダー設定
│   ├── variables.tf       # 変数定義
│   ├── dynamodb.tf        # DynamoDBテーブル定義
│   ├── lambda.tf          # Lambda関数 + IAMロール
│   ├── api_gateway.tf     # API Gateway (HTTP API)
│   └── eventbridge.tf     # EventBridge Scheduler
├── lambda/
│   ├── src/
│   │   ├── registerUser.ts     # ユーザー登録
│   │   ├── submitSchedule.ts   # 希望時間登録
│   │   ├── runMatching.ts      # マッチング実行（バッチ）
│   │   ├── getMatchResult.ts   # マッチング結果取得
│   │   └── lib/
│   │       ├── dynamodb.ts     # DynamoDB クライアント
│   │       ├── types.ts        # 型定義・定数
│   │       └── response.ts     # レスポンスヘルパー
│   ├── build.mjs          # esbuild ビルドスクリプト
│   ├── package.json
│   └── tsconfig.json
└── README.md
```