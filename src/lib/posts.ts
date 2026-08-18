import { db } from "@/lib/firebase";
import { Post } from "@/types/post";
import {
  collection,
  getDocs,
  getDoc,
  query,
  orderBy,
  updateDoc,
  doc,
  deleteDoc,
  addDoc,
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

import { deleteFromCloudinary } from "./cloudinary";

/**
 * Delete a post, its comments subcollection, and its cover image from Cloudinary
 */
export async function deletePost(postId: string): Promise<void> {
  const batch = writeBatch(db);
  const postRef = doc(db, POSTS_COLLECTION, postId);
  
  // 0. Fetch post to get coverImageUrl for deletion
  const postSnap = await getDoc(postRef);
  if (postSnap.exists()) {
    const postData = postSnap.data() as Post;
    if (postData.coverImageUrl) {
      await deleteFromCloudinary(postData.coverImageUrl);
    }
  }
  
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

/**
 * Fetch a single post by ID
 */
export async function getPostById(postId: string): Promise<Post | null> {
  const postRef = doc(db, POSTS_COLLECTION, postId);
  const snapshot = await getDoc(postRef);
  
  if (!snapshot.exists()) {
    return null;
  }
  
  return {
    id: snapshot.id,
    ...snapshot.data()
  } as Post;
}

/**
 * Generate a URL-friendly slug from a title
 */
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove non-alphanumeric chars
    .replace(/[\s_-]+/g, "-") // Replace spaces/underscores with hyphens
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
}

/**
 * Calculate read time based on word count (approx 200 words per min)
 */
function calculateReadTime(content: string): number {
  if (!content) return 1;
  const wordCount = content.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(wordCount / 200));
}

/**
 * Create a new post
 */
export async function createPost(post: Partial<Post>): Promise<string> {
  const slug = post.title ? generateSlug(post.title) : "untitled";
  const readTimeMinutes = post.content ? calculateReadTime(post.content) : 1;
  
  const newPostData = {
    ...post,
    slug,
    readTimeMinutes,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    likeCount: 0,
    commentCount: 0,
  };

  const docRef = await addDoc(collection(db, POSTS_COLLECTION), newPostData);
  return docRef.id;
}

/**
 * Update an existing post
 */
export async function updatePost(postId: string, post: Partial<Post>): Promise<void> {
  const postRef = doc(db, POSTS_COLLECTION, postId);
  
  const updates: any = {
    ...post,
    updatedAt: serverTimestamp(),
  };

  if (post.title) {
    updates.slug = generateSlug(post.title);
  }
  if (post.content !== undefined) {
    updates.readTimeMinutes = calculateReadTime(post.content);
  }

  await updateDoc(postRef, updates);
}
