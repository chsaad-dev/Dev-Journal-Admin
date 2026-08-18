"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { subscribeToAllPosts, togglePublished, deletePost } from "@/lib/posts";
import { Post } from "@/types/post";
import { Search, Plus, Edit2, Trash2, FileText, CheckCircle2, Circle } from "lucide-react";

type FilterStatus = "All" | "Published" | "Draft";

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<FilterStatus>("All");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToAllPosts((data) => {
      setPosts(data);
    });
    return () => unsubscribe();
  }, []);

  const filteredPosts = useMemo(() => {
    if (!posts) return null;
    return posts.filter((post) => {
      const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter =
        filter === "All"
          ? true
          : filter === "Published"
          ? post.published
          : !post.published;
      return matchesSearch && matchesFilter;
    });
  }, [posts, searchQuery, filter]);

  const handleDeleteConfirm = async () => {
    if (deletingId) {
      await deletePost(deletingId);
      setDeletingId(null);
    }
  };

  const handleTogglePublish = async (post: Post) => {
    await togglePublished(post.id, !post.published);
  };

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
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-on-surface">Posts</h1>
        <Link
          href="/posts/new"
          className="flex items-center px-4 py-2 bg-[var(--color-primary-container)] hover:bg-[#4338ca] text-on-surface font-medium rounded-lg transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5 mr-2" />
          New Post
        </Link>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex bg-surface-container border border-outline-variant rounded-lg p-1">
          {(["All", "Published", "Draft"] as FilterStatus[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                filter === f
                  ? "bg-[var(--color-primary-container)] text-on-surface shadow"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
          <input
            type="text"
            placeholder="Search posts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-container border border-outline-variant rounded-lg pl-10 pr-4 py-2 text-sm text-on-surface focus:outline-none focus:border-[var(--color-primary-container)] transition-colors"
          />
        </div>
      </div>

      {/* Table Area */}
      <div className="bg-surface-container border border-outline-variant rounded-[var(--radius-card)] overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-surface-container-high border-b border-outline-variant text-on-surface-variant">
              <tr>
                <th className="px-6 py-4 font-medium">Post</th>
                <th className="px-6 py-4 font-medium">Author</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Tags</th>
                <th className="px-6 py-4 font-medium">Engagement</th>
                <th className="px-6 py-4 font-medium">Created</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {/* Loading State */}
              {!filteredPosts && (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="flex items-center gap-4"><div className="w-10 h-10 bg-surface-container-high rounded-lg"></div><div className="w-48 h-4 bg-surface-container-high rounded"></div></div></td>
                    <td className="px-6 py-4"><div className="w-24 h-4 bg-surface-container-high rounded"></div></td>
                    <td className="px-6 py-4"><div className="w-20 h-5 bg-surface-container-high rounded-full"></div></td>
                    <td className="px-6 py-4"><div className="w-32 h-4 bg-surface-container-high rounded"></div></td>
                    <td className="px-6 py-4"><div className="w-16 h-4 bg-surface-container-high rounded"></div></td>
                    <td className="px-6 py-4"><div className="w-24 h-4 bg-surface-container-high rounded"></div></td>
                    <td className="px-6 py-4"><div className="w-16 h-4 bg-surface-container-high rounded ml-auto"></div></td>
                  </tr>
                ))
              )}

              {/* Empty State */}
              {filteredPosts && filteredPosts.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-24 text-center">
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <div className="w-16 h-16 bg-surface-container-high rounded-full flex items-center justify-center">
                        <FileText className="w-8 h-8 text-on-surface-variant" />
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-on-surface">No posts found</h3>
                        <p className="text-on-surface-variant text-sm mt-1">
                          {posts?.length === 0 ? "You haven't written anything yet." : "No posts match your filters."}
                        </p>
                      </div>
                      {posts?.length === 0 && (
                        <Link
                          href="/posts/new"
                          className="px-4 py-2 mt-2 inline-block bg-[var(--color-primary-container)] hover:bg-[#4338ca] text-on-surface text-sm font-medium rounded-lg transition-colors"
                        >
                          Create your first post
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              )}

              {/* Data Rows */}
              {filteredPosts && filteredPosts.map((post) => (
                <tr key={post.id} className="hover:bg-surface-container-high transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      {post.coverImageUrl ? (
                        <img src={post.coverImageUrl} alt="" className="w-10 h-10 rounded-lg object-cover bg-surface-container-high" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center border border-outline-variant">
                          <FileText className="w-4 h-4 text-on-surface-variant" />
                        </div>
                      )}
                      <div className="flex flex-col truncate max-w-[200px] lg:max-w-[300px]">
                        <Link href={`/posts/${post.id}/edit`} className="font-medium text-on-surface hover:text-[var(--color-tertiary)] truncate transition-colors">
                          {post.title || "Untitled Post"}
                        </Link>
                        <span className="text-xs text-on-surface-variant truncate">{post.slug || "no-slug"}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-on-surface-variant font-mono text-xs">{post.authorId.substring(0,8)}...</span>
                  </td>
                  <td className="px-6 py-4">
                    {post.published ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-success-container text-success border border-success/20">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Published
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-surface-container-high text-on-surface-variant border border-outline-variant">
                        <Circle className="w-3 h-3 mr-1" /> Draft
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {post.tags.slice(0, 2).map((tag, i) => (
                        <span key={i} className="px-2 py-0.5 bg-surface-container-high border border-outline-variant rounded text-xs text-on-surface-variant">
                          {tag}
                        </span>
                      ))}
                      {post.tags.length > 2 && (
                        <span className="px-2 py-0.5 bg-surface-container-high border border-outline-variant rounded text-xs text-on-surface-variant">
                          +{post.tags.length - 2}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-on-surface-variant text-xs">
                    <div>{post.likeCount} likes</div>
                    <div>{post.commentCount} comments</div>
                  </td>
                  <td className="px-6 py-4 text-on-surface-variant">
                    {formatDate(post.createdAt)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleTogglePublish(post)}
                        title={post.published ? "Unpublish" : "Publish"}
                        className="p-2 hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface rounded transition-colors"
                      >
                        {post.published ? <Circle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                      </button>
                      <Link 
                        href={`/posts/${post.id}/edit`}
                        title="Edit"
                        className="p-2 hover:bg-surface-container-high text-on-surface-variant hover:text-[var(--color-tertiary)] rounded transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Link>
                      <button 
                        onClick={() => setDeletingId(post.id)}
                        title="Delete"
                        className="p-2 hover:bg-error-container text-on-surface-variant hover:text-error rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-surface-container border border-outline-variant rounded-[var(--radius-card)] p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-semibold text-on-surface mb-2">Delete Post</h3>
            <p className="text-on-surface-variant text-sm mb-6">
              Are you sure you want to delete this post? This action cannot be undone and will permanently remove all associated comments.
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteConfirm}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-error-container text-error hover:bg-error hover:text-on-surface border border-error-container transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
