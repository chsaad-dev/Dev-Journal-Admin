"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { UserProfile } from "@/types/user";
import { Post } from "@/types/post";
import { getUserById, getUserFollowers, getUserFollowing } from "@/lib/users";
import { getPostsByAuthor } from "@/lib/posts";
import {
  ArrowLeft,
  Shield,
  Ban,
  CheckCircle2,
  User as UserPlaceholder,
  Users,
  UserPlus,
  Mail,
  Calendar,
  FileText,
  Eye,
  Heart,
  MessageSquare,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

type TabType = "followers" | "following" | "posts";

export default function UserDetailPage() {
  const params = useParams();
  const uid = params.uid as string;

  const [user, setUser] = useState<UserProfile | null>(null);
  const [followers, setFollowers] = useState<UserProfile[]>([]);
  const [following, setFollowing] = useState<UserProfile[]>([]);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>("followers");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingList, setIsLoadingList] = useState(false);

  useEffect(() => {
    loadUserData();
  }, [uid]);

  useEffect(() => {
    if (user && activeTab !== "posts") {
      loadFollowList(activeTab);
    }
  }, [activeTab, user]);

  const loadUserData = async () => {
    setIsLoading(true);
    try {
      const [userData, postsData] = await Promise.all([
        getUserById(uid),
        getPostsByAuthor(uid),
      ]);
      setUser(userData);
      setUserPosts(postsData);
    } catch (error) {
      console.error("Failed to load user or posts", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadFollowList = async (tab: TabType) => {
    setIsLoadingList(true);
    try {
      if (tab === "followers") {
        const data = await getUserFollowers(uid);
        setFollowers(data);
      } else if (tab === "following") {
        const data = await getUserFollowing(uid);
        setFollowing(data);
      }
    } catch (error) {
      console.error(`Failed to load ${tab}`, error);
    } finally {
      setIsLoadingList(false);
    }
  };

  const { totalViews, totalLikes } = useMemo(() => {
    let views = 0;
    let likes = 0;
    userPosts.forEach((p) => {
      views += p.viewCount || 0;
      likes += p.likeCount || 0;
    });
    return { totalViews: views, totalLikes: likes };
  }, [userPosts]);

  const formatDate = (timestamp: { toDate?: () => Date } | Date | string | null | undefined) => {
    if (!timestamp) return "N/A";
    const date = typeof timestamp === "object" && "toDate" in timestamp && typeof timestamp.toDate === "function"
      ? timestamp.toDate()
      : new Date(timestamp as string | Date);
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto pb-12">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-32 bg-surface-container-high rounded" />
          <div className="bg-surface-container border border-outline-variant rounded-xl p-8">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-surface-container-high rounded-full" />
              <div className="space-y-3 flex-1">
                <div className="h-6 w-48 bg-surface-container-high rounded" />
                <div className="h-4 w-64 bg-surface-container-high rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto pb-12">
        <Link
          href="/users"
          className="inline-flex items-center gap-2 text-on-surface-variant hover:text-on-surface transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Users
        </Link>
        <div className="bg-surface-container border border-outline-variant rounded-xl p-12 text-center">
          <UserPlaceholder className="w-12 h-12 text-on-surface-variant mx-auto mb-4" />
          <h2 className="text-lg font-medium text-on-surface">User not found</h2>
          <p className="text-on-surface-variant text-sm mt-1">
            This user may have been deleted or the ID is invalid.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Back Link */}
      <Link
        href="/users"
        className="inline-flex items-center gap-2 text-on-surface-variant hover:text-on-surface transition-colors text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Users
      </Link>

      {/* User Profile Card */}
      <div className="bg-surface-container border border-outline-variant rounded-xl overflow-hidden shadow-sm">
        <div className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Avatar */}
            {user.photoUrl ? (
              <img
                src={user.photoUrl}
                alt={user.name || "User avatar"}
                className="w-20 h-20 rounded-full object-cover bg-surface-container-high ring-4 ring-surface-container-high"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-surface-container-high flex items-center justify-center border-2 border-outline-variant">
                <UserPlaceholder className="w-10 h-10 text-on-surface-variant" />
              </div>
            )}

            {/* Info */}
            <div className="flex-1 text-center sm:text-left space-y-3">
              <div>
                <h1 className="text-2xl font-bold text-on-surface">
                  {user.name || "Unknown User"}
                </h1>
                <div className="flex items-center justify-center sm:justify-start gap-2 mt-1 text-on-surface-variant text-sm">
                  <Mail className="w-3.5 h-3.5" />
                  {user.email || "No email"}
                </div>
              </div>

              {/* Badges */}
              <div className="flex items-center justify-center sm:justify-start gap-2">
                {user.role === "admin" ? (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-primary-container text-on-surface">
                    <Shield className="w-3 h-3 mr-1" /> Admin
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-surface-container-high text-on-surface-variant border border-outline-variant">
                    Reader
                  </span>
                )}
                {user.suspended ? (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-error-container text-error border border-error/20">
                    <Ban className="w-3 h-3 mr-1" /> Suspended
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-success-container text-success border border-success/20">
                    <CheckCircle2 className="w-3 h-3 mr-1" /> Active
                  </span>
                )}
              </div>

              {user.bio && (
                <p className="text-on-surface-variant text-sm max-w-xl">{user.bio}</p>
              )}
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mt-6 pt-6 border-t border-outline-variant">
            <button
              onClick={() => setActiveTab("followers")}
              className={`p-3 rounded-lg text-center transition-colors ${
                activeTab === "followers"
                  ? "bg-surface-container-high text-on-surface shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/50"
              }`}
            >
              <div className="text-xl font-bold text-on-surface">{user.followerCount || 0}</div>
              <div className="text-xs font-medium flex items-center justify-center gap-1 mt-0.5">
                <Users className="w-3.5 h-3.5 text-primary-container" /> Followers
              </div>
            </button>

            <button
              onClick={() => setActiveTab("following")}
              className={`p-3 rounded-lg text-center transition-colors ${
                activeTab === "following"
                  ? "bg-surface-container-high text-on-surface shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/50"
              }`}
            >
              <div className="text-xl font-bold text-on-surface">{user.followingCount || 0}</div>
              <div className="text-xs font-medium flex items-center justify-center gap-1 mt-0.5">
                <UserPlus className="w-3.5 h-3.5 text-tertiary" /> Following
              </div>
            </button>

            <button
              onClick={() => setActiveTab("posts")}
              className={`p-3 rounded-lg text-center transition-colors ${
                activeTab === "posts"
                  ? "bg-surface-container-high text-on-surface shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/50"
              }`}
            >
              <div className="text-xl font-bold text-on-surface">{userPosts.length}</div>
              <div className="text-xs font-medium flex items-center justify-center gap-1 mt-0.5">
                <FileText className="w-3.5 h-3.5 text-primary-container" /> Articles
              </div>
            </button>

            <div className="p-3 rounded-lg text-center bg-surface-container/50 border border-outline-variant/30">
              <div className="text-xl font-bold text-on-surface">{totalViews.toLocaleString()}</div>
              <div className="text-xs font-medium text-on-surface-variant flex items-center justify-center gap-1 mt-0.5">
                <Eye className="w-3.5 h-3.5 text-tertiary" /> Total Views
              </div>
            </div>

            <div className="p-3 rounded-lg text-center bg-surface-container/50 border border-outline-variant/30 col-span-2 sm:col-span-1">
              <div className="text-xl font-bold text-on-surface">{totalLikes.toLocaleString()}</div>
              <div className="text-xs font-medium text-on-surface-variant flex items-center justify-center gap-1 mt-0.5">
                <Heart className="w-3.5 h-3.5 text-error" /> Total Likes
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Area */}
      <div className="bg-surface-container border border-outline-variant rounded-xl overflow-hidden shadow-sm">
        <div className="flex border-b border-outline-variant">
          <button
            onClick={() => setActiveTab("followers")}
            className={`flex-1 px-6 py-3.5 text-sm font-medium transition-colors ${
              activeTab === "followers"
                ? "text-on-surface border-b-2 border-primary-container bg-surface-container-high"
                : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/60"
            }`}
          >
            Followers ({user.followerCount || 0})
          </button>
          <button
            onClick={() => setActiveTab("following")}
            className={`flex-1 px-6 py-3.5 text-sm font-medium transition-colors ${
              activeTab === "following"
                ? "text-on-surface border-b-2 border-primary-container bg-surface-container-high"
                : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/60"
            }`}
          >
            Following ({user.followingCount || 0})
          </button>
          <button
            onClick={() => setActiveTab("posts")}
            className={`flex-1 px-6 py-3.5 text-sm font-medium transition-colors ${
              activeTab === "posts"
                ? "text-on-surface border-b-2 border-primary-container bg-surface-container-high"
                : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/60"
            }`}
          >
            Articles ({userPosts.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className="divide-y divide-outline-variant">
          {activeTab === "posts" ? (
            /* Posts Tab Content */
            userPosts.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <FileText className="w-10 h-10 text-on-surface-variant/40 mx-auto mb-3" />
                <p className="text-on-surface-variant text-sm">No articles published by this user yet.</p>
              </div>
            ) : (
              userPosts.map((post) => (
                <div
                  key={post.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-4 hover:bg-surface-container-high transition-colors"
                >
                  <div className="flex items-start gap-4 min-w-0">
                    {post.coverImageUrl ? (
                      <img
                        src={post.coverImageUrl}
                        alt=""
                        className="w-14 h-14 rounded-lg object-cover bg-surface-container-high shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-lg bg-surface-container-high flex items-center justify-center shrink-0 border border-outline-variant">
                        <FileText className="w-6 h-6 text-on-surface-variant" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-on-surface truncate">{post.title}</span>
                        {post.published ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-success-container text-success">
                            Published
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-surface-container-high text-on-surface-variant border border-outline-variant">
                            Draft
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-on-surface-variant mt-1 line-clamp-1">
                        {post.excerpt || post.content?.slice(0, 100) || "No excerpt"}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-on-surface-variant">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5" /> {post.viewCount || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="w-3.5 h-3.5" /> {post.likeCount || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3.5 h-3.5" /> {post.commentCount || 0}
                        </span>
                        <span>•</span>
                        <span>{formatDate(post.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <Link
                      href={`/posts/${post.id}/edit`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-surface-container-high hover:bg-surface-container-highest text-on-surface border border-outline-variant transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Edit Post
                    </Link>
                  </div>
                </div>
              ))
            )
          ) : (
            /* Followers / Following Tab Content */
            isLoadingList ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-6 py-4 animate-pulse">
                  <div className="w-10 h-10 bg-surface-container-high rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="w-32 h-4 bg-surface-container-high rounded" />
                    <div className="w-48 h-3 bg-surface-container-high rounded" />
                  </div>
                  <div className="w-20 h-4 bg-surface-container-high rounded" />
                </div>
              ))
            ) : (activeTab === "followers" ? followers : following).length === 0 ? (
              <div className="px-6 py-16 text-center">
                <Users className="w-10 h-10 text-on-surface-variant/40 mx-auto mb-3" />
                <p className="text-on-surface-variant text-sm">
                  {activeTab === "followers"
                    ? "No followers yet"
                    : "Not following anyone yet"}
                </p>
              </div>
            ) : (
              (activeTab === "followers" ? followers : following).map((profile) => (
                <Link
                  key={profile.uid}
                  href={`/users/${profile.uid}`}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-surface-container-high transition-colors"
                >
                  {profile.photoUrl ? (
                    <img
                      src={profile.photoUrl}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover bg-surface-container-high"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center border border-outline-variant">
                      <UserPlaceholder className="w-5 h-5 text-on-surface-variant" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-on-surface truncate">
                      {profile.name || "Unknown User"}
                    </div>
                    <div className="text-xs text-on-surface-variant truncate">
                      {profile.email || "No email"}
                    </div>
                  </div>
                  <div className="text-xs text-on-surface-variant flex items-center gap-1 shrink-0">
                    <Users className="w-3.5 h-3.5" />
                    {profile.followerCount || 0} followers
                  </div>
                </Link>
              ))
            )
          )}
        </div>
      </div>
    </div>
  );
}
