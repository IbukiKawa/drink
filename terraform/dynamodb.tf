resource "aws_dynamodb_table" "user_table" {
  name         = "users"
  hash_key     = "Email"
  billing_mode = "PAY_PER_REQUEST"

  attribute {
    name = "Email"
    type = "S"
  }
}

resource "aws_dynamodb_table" "schedules_table" {
  name         = "schedules"
  hash_key     = "Date"
  range_key    = "TimeSlotEmail"
  billing_mode = "PAY_PER_REQUEST"

  attribute {
    name = "Date"
    type = "S"
  }
  attribute {
    name = "TimeSlotEmail"
    type = "S"
  }
}

