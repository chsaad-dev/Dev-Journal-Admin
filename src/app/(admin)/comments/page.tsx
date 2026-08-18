"use client";

import { useEffect, useState, useMemo } from "react";
import { Comment } from "@/types/comment";
import { Post } from "@/types/post";
import { UserProfile } from "@/types/user";
import { subscribeToAllComments, deleteComment } from "@/lib/comments";
import { subscribeToAllPosts } from "@/lib/posts";
import { subscribeToAllUsers } from "@/lib/users";
import { Search, MessageSquare, Trash2, User as UserPlaceholder, ChevronDown, ChevronUp } from "lucide-react";
import ConfirmModal from "@/components/ConfirmModal";
import Link from "next/link";

function CommentRow({
  comment,
  onDelete
}: {
  comment: Comment,
  onDelete: (comment: Comment) => void
}) {
  const [expanded, setExpanded] = useState(false);

  const textThreshold = 80;
  const isLong = comment.text.length > textThreshold;
  const displayText = expanded ? comment.text : comment.text.slice(0, textThreshold) + (isLong ? "..." : "");

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <tr className="hover:bg-surface-container-high transition-colors group">
      <td className="px-6 py-4 align-top">
        <div className="flex items-center gap-3">
          {comment.userPhotoUrl ? (
            <img src={comment.userPhotoUrl} alt="" className="w-8 h-8 rounded-full object-cover bg-surface-container-high" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center border border-outline-variant">
              <UserPlaceholder className="w-4 h-4 text-on-surface-variant" />
            </div>
          )}
          <div className="flex flex-col truncate max-w-[150px]">
            <span className="font-medium text-on-surface truncate">{comment.userName || "Unknown User"}</span>
            <span className="text-xs text-on-surface-variant font-mono truncate">{comment.userId.substring(0, 8)}...</span>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 align-top whitespace-normal">
        <div className="max-w-md">
          <p className="text-sm text-on-surface-variant break-words">{displayText}</p>
          {isLong && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-xs font-medium text-tertiary mt-1 hover:underline flex items-center"
            >
              {expanded ? "Show less" : "Show more"}
              {expanded ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
            </button>
          )}
        </div>
      </td>
      <td className="px-6 py-4 align-top">
        {comment.postId ? (
          <Link
            href={`/posts/${comment.postId}/edit`}
            className="text-sm text-on-surface hover:text-tertiary truncate max-w-[200px] block transition-colors font-medium"
          >
            {comment.postTitle || "Untitled Post"}
          </Link>
        ) : (
          <span className="text-sm text-on-surface-variant italic">Orphaned Comment</span>
        )}
      </td>
      <td className="px-6 py-4 align-top text-on-surface-variant text-sm">
        {formatDate(comment.createdAt)}
      </td>
      <td className="px-6 py-4 align-top text-right">
        <button
          onClick={() => onDelete(comment)}
          title="Delete Comment"
          className="p-2 hover:bg-error-container text-on-surface-variant hover:text-error rounded transition-colors opacity-0 group-hover:opacity-100"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </td>
    </tr>
  );
}

export default function CommentsPage() {
  const [rawComments, setRawComments] = useState<Comment[] | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [deletingComment, setDeletingComment] = useState<Comment | null>(null);

  useEffect(() => {
    const unsubComments = subscribeToAllComments(setRawComments);
    const unsubPosts = subscribeToAllPosts(setPosts);
    const unsubUsers = subscribeToAllUsers(setUsers);

    return () => {
      unsubComments();
      unsubPosts();
      unsubUsers();
    };
  }, []);

  const joinedComments = useMemo(() => {
    if (!rawComments) return null;

    const postMap = new Map(posts.map(p => [p.id, p]));
    const userMap = new Map(users.map(u => [u.uid, u]));

    return rawComments.map(comment => {
      const post = comment.postId ? postMap.get(comment.postId) : null;
      const user = userMap.get(comment.userId);

      return {
        ...comment,
        postTitle: post?.title,
        userName: user?.name,
        userPhotoUrl: user?.photoUrl,
      };
    });
  }, [rawComments, posts, users]);

  const filteredComments = useMemo(() => {
    if (!joinedComments) return null;
    if (!searchQuery) return joinedComments;

    const lowerQuery = searchQuery.toLowerCase();
    return joinedComments.filter(comment =>
      comment.text.toLowerCase().includes(lowerQuery)
    );
  }, [joinedComments, searchQuery]);

  const handleDeleteConfirm = async () => {
    if (!deletingComment || !deletingComment.postId) return;
    try {
      await deleteComment(deletingComment.postId, deletingComment.id);
    } catch (error) {
      console.error("Failed to delete comment:", error);
    } finally {
      setDeletingComment(null);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center gap-3">
        <h1 className="text-3xl font-bold tracking-tight text-on-surface">Comments</h1>
        {rawComments && (
          <span className="px-2.5 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant text-sm font-medium border border-outline-variant">
            {rawComments.length}
          </span>
        )}
      </div>

      {/* Filters & Search */}
      <div className="flex justify-end">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
          <input
            type="text"
            placeholder="Search comments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-container border border-outline-variant rounded-lg pl-10 pr-4 py-2 text-sm text-on-surface focus:outline-none focus:border-primary-container transition-colors"
          />
        </div>
      </div>

      {/* Table Area */}
      <div className="bg-surface-container border border-outline-variant rounded-[var(--radius-card)] overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-surface-container-high border-b border-outline-variant text-on-surface-variant">
              <tr>
                <th className="px-6 py-4 font-medium w-1/5">Author</th>
                <th className="px-6 py-4 font-medium w-2/5">Comment</th>
                <th className="px-6 py-4 font-medium w-1/5">Post</th>
                <th className="px-6 py-4 font-medium w-1/5">Posted</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">

              {/* Loading State */}
              {!filteredComments && (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="flex items-center gap-4"><div className="w-8 h-8 bg-surface-container-high rounded-full"></div><div className="w-24 h-4 bg-surface-container-high rounded"></div></div></td>
                    <td className="px-6 py-4"><div className="w-full max-w-sm h-4 bg-surface-container-high rounded"></div></td>
                    <td className="px-6 py-4"><div className="w-32 h-4 bg-surface-container-high rounded"></div></td>
                    <td className="px-6 py-4"><div className="w-24 h-4 bg-surface-container-high rounded"></div></td>
                    <td className="px-6 py-4"><div className="w-8 h-8 bg-surface-container-high rounded ml-auto"></div></td>
                  </tr>
                ))
              )}

              {/* Empty State */}
              {filteredComments && filteredComments.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-24 text-center">
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <div className="w-16 h-16 bg-surface-container-high rounded-full flex items-center justify-center">
                        <MessageSquare className="w-8 h-8 text-on-surface-variant" />
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-on-surface">No comments found</h3>
                        <p className="text-on-surface-variant text-sm mt-1">
                          No comments match your search criteria.
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}

              {/* Data Rows */}
              {filteredComments && filteredComments.map((comment) => (
                <CommentRow
                  key={comment.id}
                  comment={comment}
                  onDelete={setDeletingComment}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmModal
        isOpen={!!deletingComment}
        title="Delete Comment"
        message="Are you sure you want to delete this comment? This action cannot be undone."
        confirmText="Delete"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingComment(null)}
      />

    </div>
  );
}
