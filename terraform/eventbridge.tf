resource "aws_scheduler_schedule" "matching_schedule" {
  name       = "matching_schedule"
  group_name = "default"
  flexible_time_window {
    mode = "OFF"
  }
  schedule_expression          = "cron(0 8 ? * MON,WED,FRI *)"
  schedule_expression_timezone = "Asia/Tokyo"
  state                        = "DISABLED"
  target {
    arn      = aws_lambda_function.lambda_run_matching.arn
    role_arn = aws_iam_role.eventbridge_role.arn
  }
}

resource "aws_lambda_permission" "allow_api_matching" {
  statement_id  = "AllowEventbridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.lambda_run_matching.function_name
  principal     = "scheduler.amazonaws.com"
}

resource "aws_iam_role" "eventbridge_role" {
  name = "drink-eventbridge-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "scheduler.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "eventbridge-lambda" {
  name = "drink-eventbridge-lambda"
  role = aws_iam_role.eventbridge_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = "lambda:InvokeFunction"
        Resource = "${aws_lambda_function.lambda_run_matching.arn}"
      }
    ]
  })
}
