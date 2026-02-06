import { Department, Gender } from "./userTypes";
export interface MatchEntity {
  Date: string;
  TimeSlotMatchId: string; // SK: "10:00#abc123"
  User1Email: string;
  User2Email: string;
  TimeSlot: string;
  CreatedAt: string;
}

export interface MatchCandidate {
  email: string;
  department: Department;
  joinYear: number;
  gender: Gender;
  floor: number;
  timeSlot: string;
}

export const VALID_TIME_SLOTS = [
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
] as const;
