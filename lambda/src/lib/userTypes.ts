// DB用（DynamoDBの属性名に合わせる）
export interface UserEntity {
  Email: string;
  Name: string;
  Department: Department;
  JoinYear: number;
  Gender: Gender;
  Floor: number;
  CreatedAt: string;
}

// API用（リクエストボディ）
export interface RegisterUserRequest {
  email: string;
  name: string;
  department: Department;
  joinYear: number;
  gender: Gender;
  floor: number;
}

export const DEPARTMENT = [
  "金融",
  "製造",
  "エンタープライズ1",
  "エンタープライズ2",
  "エンタープライズ3",
  "Xイノベーション",
] as const;
export type Department = (typeof DEPARTMENT)[number];

export const GENDER = ["男", "女"] as const;
export type Gender = (typeof GENDER)[number];
