resource "aws_s3_bucket" "web" {
  bucket = "drink-matching-web-${data.aws_caller_identity.current.account_id}"
}

resource "aws_s3_bucket_public_access_block" "web" {
  bucket                  = aws_s3_bucket.web.id
  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_policy" "web" {
  bucket     = aws_s3_bucket.web.id
  depends_on = [aws_s3_bucket_public_access_block.web]
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = "*"
      Action    = "s3:GetObject"
      Resource  = "${aws_s3_bucket.web.arn}/*"
    }]
  })
}

data "aws_caller_identity" "current" {}

output "web_url" {
  value = "https://${aws_s3_bucket.web.bucket}.s3.ap-northeast-1.amazonaws.com/index.html"
}

output "s3_bucket_name" {
  value = aws_s3_bucket.web.bucket
}
