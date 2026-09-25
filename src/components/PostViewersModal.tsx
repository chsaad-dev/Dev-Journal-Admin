"use client";

import { useEffect, useState, useMemo } from "react";
import { X, Eye, Search, User, Clock, AlertCircle } from "lucide-react";
import { getPostViewers } from "@/lib/posts";
import { Post, PostViewer } from "@/types/post";

interface PostViewersModalProps {
  post: Post | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function PostViewersModal({ post, isOpen, onClose }: PostViewersModalProps) {
  const [viewers, setViewers] = useState<PostViewer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (isOpen && post) {
      setIsLoading(true);
      setSearchQuery("");
      getPostViewers(post.id)
        .then((data) => setViewers(data))
        .catch((err) => console.error("Error loading viewers:", err))
        .finally(() => setIsLoading(false));
    } else {
      setViewers([]);
    }
  }, [isOpen, post]);

  const filteredViewers = useMemo(() => {
    if (!searchQuery.trim()) return viewers;
    const q = searchQuery.toLowerCase();
    return viewers.filter(
      (v) =>
        v.name.toLowerCase().includes(q) ||
        (v.email && v.email.toLowerCase().includes(q)) ||
        v.uid.toLowerCase().includes(q)
    );
  }, [viewers, searchQuery]);

  if (!isOpen || !post) return null;

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "Unknown date";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div 
        className="bg-surface-container border border-outline-variant rounded-[var(--radius-card)] max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-outline-variant flex items-center justify-between bg-surface-container-high/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-primary-container)]/10 text-[var(--color-tertiary)] flex items-center justify-center border border-[var(--color-primary-container)]/20">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
                <span>Post Readers</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-surface-container-high border border-outline-variant text-on-surface-variant font-mono">
                  {post.viewCount || viewers.length} total
                </span>
              </h3>
              <p className="text-xs text-on-surface-variant truncate max-w-sm">
                {post.title}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-outline-variant bg-surface-container">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
            <input
              type="text"
              placeholder="Search readers by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface-container-high border border-outline-variant rounded-lg pl-9 pr-4 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-[var(--color-primary-container)] transition-colors"
            />
          </div>
        </div>

        {/* Viewers List */}
        <div className="flex-1 overflow-y-auto divide-y divide-outline-variant/60 p-2">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="w-10 h-10 rounded-full bg-surface-container-high" />
                  <div className="flex-1 space-y-1.5">
                    <div className="w-32 h-4 bg-surface-container-high rounded" />
                    <div className="w-48 h-3 bg-surface-container-high rounded" />
                  </div>
                  <div className="w-20 h-3 bg-surface-container-high rounded" />
                </div>
              ))}
            </div>
          ) : filteredViewers.length === 0 ? (
            <div className="py-16 px-4 text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center mb-3">
                <AlertCircle className="w-6 h-6 text-on-surface-variant/60" />
              </div>
              <p className="text-sm font-medium text-on-surface">
                {searchQuery ? "No matching readers found" : "No readers recorded yet"}
              </p>
              <p className="text-xs text-on-surface-variant mt-1">
                {searchQuery ? "Try a different search query" : "Views will appear here when users read this post on the Android app."}
              </p>
            </div>
          ) : (
            filteredViewers.map((viewer) => (
              <div
                key={viewer.uid}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-surface-container-high/60 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {viewer.photoUrl ? (
                    <img
                      src={viewer.photoUrl}
                      alt={viewer.name}
                      className="w-10 h-10 rounded-full object-cover bg-surface-container-high border border-outline-variant flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[var(--color-primary-container)]/10 text-[var(--color-tertiary)] border border-[var(--color-primary-container)]/20 flex items-center justify-center flex-shrink-0 font-medium text-sm">
                      {viewer.name ? viewer.name.charAt(0).toUpperCase() : <User className="w-5 h-5" />}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-on-surface truncate">
                      {viewer.name}
                    </p>
                    <p className="text-xs text-on-surface-variant truncate font-mono">
                      {viewer.email || viewer.uid}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-on-surface-variant/80 pl-2 flex-shrink-0">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{formatDate(viewer.viewedAt)}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-outline-variant bg-surface-container-high/30 flex items-center justify-between text-xs text-on-surface-variant">
          <span>Unique Viewers: {viewers.length}</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-medium rounded-lg transition-colors border border-outline-variant"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
