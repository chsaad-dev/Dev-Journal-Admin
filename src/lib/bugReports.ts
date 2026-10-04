import { db } from "@/lib/firebase";
import { BugReport, BugReportStatus } from "@/types/bugReport";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp
} from "firebase/firestore";

const BUG_REPORTS_COLLECTION = "bugReports";

export function subscribeToAllBugReports(callback: (reports: BugReport[]) => void) {
  const bugReportsQuery = query(
    collection(db, BUG_REPORTS_COLLECTION),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(
    bugReportsQuery,
    (snapshot) => {
      const reports = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as BugReport[];
      callback(reports);
    },
    (error) => {
      console.error("Error subscribing to bug reports:", error);
      callback([]);
    }
  );
}

export async function updateBugReportStatus(
  reportId: string,
  status: BugReportStatus,
  adminNotes?: string
): Promise<void> {
  const reportRef = doc(db, BUG_REPORTS_COLLECTION, reportId);
  const updateData: Record<string, unknown> = {
    status,
  };

  if (status === "resolved") {
    updateData.resolvedAt = serverTimestamp();
  } else {
    updateData.resolvedAt = null;
  }

  if (adminNotes !== undefined) {
    updateData.adminNotes = adminNotes;
  }

  await updateDoc(reportRef, updateData);
}
