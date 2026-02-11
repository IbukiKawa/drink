data "archive_file" "lambda_register_user" {
  type        = "zip"
  source_file = "${path.module}/../lambda/dist/registerUser.js"
  output_path = "${path.module}/../lambda/dist/registerUser.zip"

}

resource "aws_lambda_function" "lambda_register_user" {
  filename         = data.archive_file.lambda_register_user.output_path
  function_name    = "register_user_lambda_function"
  role             = aws_iam_role.lambda_role.arn
  handler          = "registerUser.handler"
  runtime          = "nodejs20.x"
  source_code_hash = data.archive_file.lambda_register_user.output_base64sha256

  environment {
    variables = {
      USERS_TABLE = aws_dynamodb_table.user_table.name
    }
  }
}

data "archive_file" "lambda_submit_schedule" {
  type        = "zip"
  source_file = "${path.module}/../lambda/dist/submitSchedule.js"
  output_path = "${path.module}/../lambda/dist/submitSchedule.zip"
}

resource "aws_lambda_function" "lambda_submit_schedule" {
  filename         = data.archive_file.lambda_submit_schedule.output_path
  function_name    = "submit_schedule_lambda_function"
  role             = aws_iam_role.lambda_role.arn
  handler          = "submitSchedule.handler"
  runtime          = "nodejs20.x"
  source_code_hash = data.archive_file.lambda_submit_schedule.output_base64sha256

  environment {
    variables = {
      SCHEDULES_TABLE = aws_dynamodb_table.schedules_table.name
    }
  }
}

data "archive_file" "lambda_run_matching" {
  type        = "zip"
  source_file = "${path.module}/../lambda/dist/runMatching.js"
  output_path = "${path.module}/../lambda/dist/runMatching.zip"
}

resource "aws_lambda_function" "lambda_run_matching" {
  filename         = data.archive_file.lambda_run_matching.output_path
  function_name    = "run_matching_lambda_function"
  role             = aws_iam_role.lambda_role.arn
  handler          = "runMatching.handler"
  runtime          = "nodejs20.x"
  source_code_hash = data.archive_file.lambda_run_matching.output_base64sha256

  environment {
    variables = {
      USERS_TABLE     = aws_dynamodb_table.user_table.name
      SCHEDULES_TABLE = aws_dynamodb_table.schedules_table.name
      MATCHES_TABLE   = aws_dynamodb_table.matches_table.name
    }
  }
}

data "archive_file" "lambda_get_match_result" {
  type        = "zip"
  source_file = "${path.module}/../lambda/dist/getMatchResult.js"
  output_path = "${path.module}/../lambda/dist/getMatchResult.zip"
}

resource "aws_lambda_function" "lambda_get_match_result" {
  filename         = data.archive_file.lambda_get_match_result.output_path
  function_name    = "get_match_result_lambda_function"
  role             = aws_iam_role.lambda_role.arn
  handler          = "getMatchResult.handler"
  runtime          = "nodejs20.x"
  source_code_hash = data.archive_file.lambda_get_match_result.output_base64sha256

  environment {
    variables = {
      USERS_TABLE   = aws_dynamodb_table.user_table.name
      MATCHES_TABLE = aws_dynamodb_table.matches_table.name
    }
  }
}

