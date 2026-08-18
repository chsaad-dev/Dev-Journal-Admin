import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  serverTimestamp,
  onSnapshot
} from "firebase/firestore";

export interface BroadcastHistory {
  id: string;
  title: string;
  body: string;
  sentAt: any;
  sentBy: string;
}

const BROADCASTS_COLLECTION = "broadcasts";

/**
 * Log a sent broadcast to Firestore
 */
export async function logBroadcast(title: string, body: string, adminUid: string): Promise<string> {
  const docRef = await addDoc(collection(db, BROADCASTS_COLLECTION), {
    title,
    body,
    sentBy: adminUid,
    sentAt: serverTimestamp(),
  });
  return docRef.id;
}

/**
 * Subscribe to the 5 most recent broadcasts
 */
export function subscribeToRecentBroadcasts(callback: (broadcasts: BroadcastHistory[]) => void) {
  const q = query(
    collection(db, BROADCASTS_COLLECTION),
    orderBy("sentAt", "desc"),
    limit(5)
  );

  return onSnapshot(q, (snapshot) => {
    const broadcasts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as BroadcastHistory[];
    callback(broadcasts);
  });
}
