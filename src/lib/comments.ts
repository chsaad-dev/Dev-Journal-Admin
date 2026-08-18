import { db } from "@/lib/firebase";
import { Comment } from "@/types/comment";
import {
  collectionGroup,
  getDocs,
  query,
  orderBy,
  doc,
  deleteDoc,
  updateDoc,
  increment,
  onSnapshot
} from "firebase/firestore";

const COMMENTS_GROUP = "comments";
const POSTS_COLLECTION = "posts";

export function subscribeToAllComments(callback: (comments: Comment[]) => void) {
  const commentsQuery = query(collectionGroup(db, COMMENTS_GROUP), orderBy("createdAt", "desc"));

  return onSnapshot(commentsQuery, (snapshot) => {
    const comments = snapshot.docs.map((document) => {

      const postRef = document.ref.parent.parent;
      const postId = postRef?.id;

      return {
        id: document.id,
        postId,
        ...document.data(),
      } as Comment;
    });

    callback(comments);
  });
}

export async function getAllComments(): Promise<Comment[]> {
  const commentsQuery = query(collectionGroup(db, COMMENTS_GROUP), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(commentsQuery);

  return snapshot.docs.map((document) => {
    const postRef = document.ref.parent.parent;
    const postId = postRef?.id;

    return {
      id: document.id,
      postId,
      ...document.data(),
    } as Comment;
  });
}

export async function deleteComment(postId: string, commentId: string): Promise<void> {
  const commentRef = doc(db, POSTS_COLLECTION, postId, COMMENTS_GROUP, commentId);
  const postRef = doc(db, POSTS_COLLECTION, postId);

  await deleteDoc(commentRef);

  await updateDoc(postRef, {
    commentCount: increment(-1)
  });
}
