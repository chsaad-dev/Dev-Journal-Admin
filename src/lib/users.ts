import { db } from "@/lib/firebase";
import { UserProfile } from "@/types/user";
import {
  collection,
  getDocs,
  query,
  orderBy,
  updateDoc,
  doc,
  onSnapshot
} from "firebase/firestore";

const USERS_COLLECTION = "users";

export async function getAllUsers(): Promise<UserProfile[]> {
  const usersQuery = query(collection(db, USERS_COLLECTION), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(usersQuery);
  return snapshot.docs.map((doc) => ({
    uid: doc.id,
    ...doc.data(),
  })) as UserProfile[];
}

export function subscribeToAllUsers(callback: (users: UserProfile[]) => void) {
  const usersQuery = query(collection(db, USERS_COLLECTION), orderBy("createdAt", "desc"));

  return onSnapshot(usersQuery, (snapshot) => {
    const users = snapshot.docs.map((doc) => ({
      uid: doc.id,
      ...doc.data(),
    })) as UserProfile[];
    callback(users);
  });
}

export async function updateUserRole(uid: string, role: "admin" | "reader"): Promise<void> {
  const userRef = doc(db, USERS_COLLECTION, uid);
  await updateDoc(userRef, { role });
}

export async function setUserSuspended(uid: string, suspended: boolean): Promise<void> {
  const userRef = doc(db, USERS_COLLECTION, uid);
  await updateDoc(userRef, { suspended });
}
