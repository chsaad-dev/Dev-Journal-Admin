import { db } from "@/lib/firebase";
import { Post, PostViewer } from "@/types/post";
import {
  collection,
  getDocs,
  getDoc,
  query,
  where,
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

/**
 * Fetch all users who have viewed/read a post
 */
export async function getPostViewers(postId: string): Promise<PostViewer[]> {
  try {
    const viewsRef = collection(db, POSTS_COLLECTION, postId, "views");
    const snapshot = await getDocs(viewsRef);

    const viewers: PostViewer[] = await Promise.all(
      snapshot.docs.map(async (viewDoc) => {
        const data = viewDoc.data();
        const uid = viewDoc.id;

        // If name already saved directly in view document
        if (data.userName) {
          return {
            uid,
            name: data.userName,
            photoUrl: data.userPhotoUrl || "",
            email: data.userEmail || "",
            viewedAt: data.viewedAt,
          };
        }

        // Fallback: fetch from users collection
        try {
          const userSnap = await getDoc(doc(db, "users", uid));
          if (userSnap.exists()) {
            const userData = userSnap.data();
            return {
              uid,
              name: userData.name || "Anonymous Reader",
              photoUrl: userData.photoUrl || userData.avatarUrl || "",
              email: userData.email || "",
              viewedAt: data.viewedAt,
            };
          }
        } catch {
          // ignore error fetching user doc
        }

        return {
          uid,
          name: "Anonymous Reader",
          photoUrl: "",
          email: "",
          viewedAt: data.viewedAt,
        };
      })
    );

    // Sort by most recent view first
    return viewers.sort((a, b) => {
      const timeA = a.viewedAt?.toMillis ? a.viewedAt.toMillis() : (a.viewedAt ? new Date(a.viewedAt).getTime() : 0);
      const timeB = b.viewedAt?.toMillis ? b.viewedAt.toMillis() : (b.viewedAt ? new Date(b.viewedAt).getTime() : 0);
      return timeB - timeA;
    });
  } catch (error) {
    console.error("Error fetching post viewers:", error);
    return [];
  }
}

/**
 * Fetch all posts by a specific author
 */
export async function getPostsByAuthor(authorId: string): Promise<Post[]> {
  try {
    const postsQuery = query(
      collection(db, POSTS_COLLECTION),
      where("authorId", "==", authorId)
    );
    const snapshot = await getDocs(postsQuery);
    const posts = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Post[];
    return posts.sort((a, b) => {
      const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
      const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
      return timeB - timeA;
    });
  } catch (error) {
    console.error("Error fetching posts by author:", error);
    return [];
  }
}
