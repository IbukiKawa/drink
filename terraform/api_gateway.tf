resource "aws_apigatewayv2_api" "api_gateway" {
  name          = "drink-http-api"
  protocol_type = "HTTP"

}

resource "aws_apigatewayv2_integration" "integration_lambda_user" {
  api_id                 = aws_apigatewayv2_api.api_gateway.id
  integration_type       = "AWS_PROXY"
  integration_method     = "POST"
  integration_uri        = aws_lambda_function.lambda_register_user.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "route_lambda_user" {
  api_id    = aws_apigatewayv2_api.api_gateway.id
  route_key = "POST /users"
  target    = "integrations/${aws_apigatewayv2_integration.integration_lambda_user.id}"
}

resource "aws_apigatewayv2_integration" "integration_lambda_schedule" {
  api_id                 = aws_apigatewayv2_api.api_gateway.id
  integration_type       = "AWS_PROXY"
  integration_method     = "POST"
  integration_uri        = aws_lambda_function.lambda_submit_schedule.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "route_lambda_schedule" {
  api_id    = aws_apigatewayv2_api.api_gateway.id
  route_key = "POST /schedules"
  target    = "integrations/${aws_apigatewayv2_integration.integration_lambda_schedule.id}"
}

resource "aws_apigatewayv2_integration" "integration_lambda_match_result" {
  api_id                 = aws_apigatewayv2_api.api_gateway.id
  integration_type       = "AWS_PROXY"
  integration_method     = "POST"
  integration_uri        = aws_lambda_function.lambda_get_match_result.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "route_lambda_match_result" {
  api_id    = aws_apigatewayv2_api.api_gateway.id
  route_key = "GET /matches"
  target    = "integrations/${aws_apigatewayv2_integration.integration_lambda_match_result.id}"
}

resource "aws_lambda_permission" "allow_api_register_user" {
  statement_id  = "AllowAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.lambda_register_user.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.api_gateway.execution_arn}/*/*"

}

resource "aws_lambda_permission" "allow_api_schedule" {
  statement_id  = "AllowAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.lambda_submit_schedule.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.api_gateway.execution_arn}/*/*"

}

resource "aws_lambda_permission" "allow_api_get_match_result" {
  statement_id  = "AllowAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.lambda_get_match_result.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.api_gateway.execution_arn}/*/*"

}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.api_gateway.id
  name        = "$default"
  auto_deploy = true
}

output "api_endpoint" {
  value = aws_apigatewayv2_api.api_gateway.api_endpoint
}
