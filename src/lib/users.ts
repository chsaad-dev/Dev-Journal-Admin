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
  const usersQuery = query(collection(db, USERS_COLLECTION));
  const snapshot = await getDocs(usersQuery);
  const users = snapshot.docs.map((doc) => ({
    uid: doc.id,
    ...doc.data(),
  })) as UserProfile[];
  
  return users.sort((a, b) => {
    const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
    const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
    return timeB - timeA;
  });
}

export function subscribeToAllUsers(callback: (users: UserProfile[]) => void) {
  const usersQuery = query(collection(db, USERS_COLLECTION));

  return onSnapshot(usersQuery, (snapshot) => {
    const users = snapshot.docs.map((doc) => ({
      uid: doc.id,
      ...doc.data(),
    })) as UserProfile[];
    
    users.sort((a, b) => {
      const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
      const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
      return timeB - timeA;
    });
    
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
