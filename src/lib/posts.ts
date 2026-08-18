import { db } from "@/lib/firebase";
import { Post } from "@/types/post";
import {
  collection,
  getDocs,
  query,
  orderBy,
  updateDoc,
  doc,
  deleteDoc,
  serverTimestamp,
  onSnapshot,
  writeBatch
} from "firebase/firestore";

const POSTS_COLLECTION = "posts";

/**
 * Fetch all posts (drafts and published) ordered by creation date
 */
export async function getAllPosts(): Promise<Post[]> {
  const postsQuery = query(collection(db, POSTS_COLLECTION), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(postsQuery);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Post[];
}

/**
 * Real-time listener for all posts
 */
export function subscribeToAllPosts(callback: (posts: Post[]) => void) {
  const postsQuery = query(collection(db, POSTS_COLLECTION), orderBy("createdAt", "desc"));
  
  return onSnapshot(postsQuery, (snapshot) => {
    const posts = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Post[];
    callback(posts);
  });
}

/**
 * Toggle the published status of a post
 */
export async function togglePublished(postId: string, published: boolean): Promise<void> {
  const postRef = doc(db, POSTS_COLLECTION, postId);
  await updateDoc(postRef, {
    published,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Delete a post and its comments subcollection via a batched write
 */
export async function deletePost(postId: string): Promise<void> {
  const batch = writeBatch(db);
  const postRef = doc(db, POSTS_COLLECTION, postId);
  
  // 1. Delete comments subcollection documents
  const commentsQuery = query(collection(postRef, "comments"));
  const commentsSnapshot = await getDocs(commentsQuery);
  commentsSnapshot.docs.forEach((commentDoc) => {
    batch.delete(commentDoc.ref);
  });

  // 2. Delete the main post document
  batch.delete(postRef);
  
  // 3. Commit the batch
  await batch.commit();
}
