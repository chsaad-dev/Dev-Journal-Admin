import { db } from "@/lib/firebase";
import { UserProfile } from "@/types/user";
import {
  collection,
  getDocs,
  getDoc,
  query,
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

export async function updateOwnProfile(uid: string, data: { name?: string; bio?: string; photoUrl?: string }): Promise<void> {
  const userRef = doc(db, USERS_COLLECTION, uid);
  await updateDoc(userRef, data);
}

export async function getUserById(uid: string): Promise<UserProfile | null> {
  try {
    const userDoc = await getDoc(doc(db, USERS_COLLECTION, uid));
    if (!userDoc.exists()) return null;
    return { uid: userDoc.id, ...userDoc.data() } as UserProfile;
  } catch (error) {
    return null;
  }
}

export async function getUserFollowers(uid: string): Promise<UserProfile[]> {
  return fetchRelatedUsers(uid, "followers");
}

export async function getUserFollowing(uid: string): Promise<UserProfile[]> {
  return fetchRelatedUsers(uid, "following");
}

async function fetchRelatedUsers(uid: string, subcollection: string): Promise<UserProfile[]> {
  const snapshot = await getDocs(
    collection(db, USERS_COLLECTION, uid, subcollection)
  );

  const relatedUids = snapshot.docs.map((d) => d.id);
  if (relatedUids.length === 0) return [];

  // Fetch each user profile concurrently in parallel
  const profiles = await Promise.all(
    relatedUids.map(async (relatedUid) => {
      const userDoc = await getDoc(doc(db, USERS_COLLECTION, relatedUid));
      if (userDoc.exists()) {
        return { uid: userDoc.id, ...userDoc.data() } as UserProfile;
      }
      return null;
    })
  );
  return profiles.filter((p): p is UserProfile => p !== null);
}
