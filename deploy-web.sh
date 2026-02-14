#!/bin/bash
BUCKET_NAME="$(cd terraform && terraform output -raw s3_bucket_name)"

echo "📦 S3にアップロード中..."
aws s3 cp web/index.html "s3://${BUCKET_NAME}/index.html" --content-type "text/html; charset=utf-8"
aws s3 cp web/style.css "s3://${BUCKET_NAME}/style.css" --content-type "text/css"
aws s3 cp web/script.js "s3://${BUCKET_NAME}/script.js" --content-type "application/javascript"

echo "✅ アップロード完了"
echo "🌐 URL: $(cd terraform && terraform output -raw web_url)"