resource "aws_dynamodb_table" "matches_table" {
  name         = "matches"
  hash_key     = "Date"
  range_key    = "TimeSlotMatchId"
  billing_mode = "PAY_PER_REQUEST"

  attribute {
    name = "Date"
    type = "S"
  }
  attribute {
    name = "TimeSlotMatchId"
    type = "S"
  }
  attribute {
    name = "User1Email"
    type = "S"
  }
  attribute {
    name = "User2Email"
    type = "S"
  }
  global_secondary_index {
    name            = "matchingUser1EmailIndex"
    hash_key        = "User1Email"
    range_key       = "Date"
    projection_type = "ALL"
  }
  global_secondary_index {
    name            = "matchingUser2EmailIndex"
    hash_key        = "User2Email"
    range_key       = "Date"
    projection_type = "ALL"

  }
}
