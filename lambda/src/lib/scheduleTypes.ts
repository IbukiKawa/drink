export interface ScheduleEntity {
  Date: string;
  TimeSlotEmail: string; // SK: "10:00#tanaka@example.com"
  Email: string;
  TimeSlot: string;
  Status: "pending" | "matched" | "unmatched";
}

export interface SubmitScheduleRequest {
  email: string;
  date: string;
  timeSlots: string[];
}
