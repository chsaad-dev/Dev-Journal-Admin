import { Timestamp } from "firebase/firestore";

export type BugReportStatus = "open" | "in_progress" | "resolved" | "wont_fix";

export interface BugReport {
  id: string;
  userId: string;
  userEmail: string;
  title: string;
  description: string;
  screenshotUrl?: string;
  deviceInfo: string;
  appVersion: string;
  status: BugReportStatus;
  createdAt: Timestamp | null;
  resolvedAt?: Timestamp | null;
  adminNotes?: string;
}
