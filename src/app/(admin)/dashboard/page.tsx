"use client";

import { useEffect, useState, useMemo } from "react";
import { 
  FileText, 
  Users, 
  MessageSquare, 
  Heart,
  MessageCircle
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";

import { subscribeToAllPosts } from "@/lib/posts";
import { subscribeToAllUsers } from "@/lib/users";
import { subscribeToAllComments } from "@/lib/comments";
import { formatRelativeTime } from "@/lib/utils";

import type { Post } from "@/types/post";
import type { UserProfile } from "@/types/user";
import type { Comment } from "@/types/comment";

export default function DashboardPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Data fetching
  useEffect(() => {
    let postsLoaded = false;
    let usersLoaded = false;
    let commentsLoaded = false;

    const checkLoading = () => {
      if (postsLoaded && usersLoaded && commentsLoaded) {
        setIsLoading(false);
      }
    };

    const unsubPosts = subscribeToAllPosts((data) => {
      setPosts(data);
      postsLoaded = true;
      checkLoading();
    });

    const unsubUsers = subscribeToAllUsers((data) => {
      setUsers(data);
      usersLoaded = true;
      checkLoading();
    });

    const unsubComments = subscribeToAllComments((data) => {
      setComments(data);
      commentsLoaded = true;
      checkLoading();
    });

    return () => {
      unsubPosts();
      unsubUsers();
      unsubComments();
    };
  }, []);

  // --- Derived Metrics ---
  const { publishedPosts, draftPosts, totalLikes } = useMemo(() => {
    let published = 0;
    let draft = 0;
    let likes = 0;
    posts.forEach(p => {
      if (p.published) published++;
      else draft++;
      likes += p.likeCount || 0;
    });
    return { publishedPosts: published, draftPosts: draft, totalLikes: likes };
  }, [posts]);

  const adminUsers = useMemo(() => {
    return users.filter(u => u.role === "admin").length;
  }, [users]);

  // --- Chart Data ---
  const weeklyData = useMemo(() => {
    // Generate the last 8 weeks buckets
    const weeks: { label: string; startTimestamp: number; count: number }[] = [];
    const now = new Date();
    // Normalize to start of current week (Sunday)
    now.setHours(0, 0, 0, 0);
    now.setDate(now.getDate() - now.getDay());

    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
      const label = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      weeks.push({
        label,
        startTimestamp: weekStart.getTime(),
        count: 0
      });
    }

    // Assign posts to buckets
    posts.forEach(post => {
      if (!post.createdAt) return;
      const date = post.createdAt.toDate ? post.createdAt.toDate() : new Date(post.createdAt);
      const time = date.getTime();
      
      // Find the appropriate bucket (start from most recent to oldest)
      for (let i = weeks.length - 1; i >= 0; i--) {
        if (time >= weeks[i].startTimestamp) {
          weeks[i].count++;
          break;
        }
      }
    });

    return weeks;
  }, [posts]);

  // --- Recent Activity Feed ---
  const recentActivity = useMemo(() => {
    type ActivityItem = 
      | { type: "post"; id: string; date: Date; title: string; subtitle: string }
      | { type: "comment"; id: string; date: Date; title: string; subtitle: string };

    const activity: ActivityItem[] = [];

    posts.forEach(p => {
      if (!p.createdAt) return;
      activity.push({
        type: "post",
        id: `post-${p.id}`,
        date: p.createdAt.toDate ? p.createdAt.toDate() : new Date(p.createdAt),
        title: `New post: ${p.title}`,
        subtitle: p.published ? "Published" : "Draft saved"
      });
    });

    comments.forEach(c => {
      if (!c.createdAt) return;
      // Resolve username locally to save reads
      const user = users.find(u => u.uid === c.userId);
      const userName = user?.name || "Someone";
      
      activity.push({
        type: "comment",
        id: `comment-${c.id}`,
        date: c.createdAt.toDate ? c.createdAt.toDate() : new Date(c.createdAt),
        title: `${userName} commented on ${c.postTitle || "a post"}`,
        subtitle: c.text
      });
    });

    return activity.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 10);
  }, [posts, comments, users]);

  // --- Rendering ---
  
  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse pb-12">
        <div className="h-10 w-48 bg-surface-container rounded-lg"></div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-surface-container rounded-[16px] border border-outline-variant"></div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 h-[400px] bg-surface-container rounded-[16px] border border-outline-variant"></div>
          <div className="h-[400px] bg-surface-container rounded-[16px] border border-outline-variant"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <h1 className="text-3xl font-bold tracking-tight text-on-surface">Dashboard</h1>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <div className="bg-surface-container rounded-[16px] p-6 border border-outline-variant flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary-container/20 rounded-lg text-primary-container">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-on-surface font-semibold">Total Posts</h3>
          </div>
          <div>
            <div className="text-4xl font-bold text-on-surface mb-1">{posts.length}</div>
            <p className="text-sm text-on-surface-variant">{publishedPosts} published, {draftPosts} drafts</p>
          </div>
        </div>

        <div className="bg-surface-container rounded-[16px] p-6 border border-outline-variant flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-tertiary/20 rounded-lg text-tertiary">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-on-surface font-semibold">Total Users</h3>
          </div>
          <div>
            <div className="text-4xl font-bold text-on-surface mb-1">{users.length}</div>
            <p className="text-sm text-on-surface-variant">{adminUsers} active admins</p>
          </div>
        </div>

        <div className="bg-surface-container rounded-[16px] p-6 border border-outline-variant flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-success/20 rounded-lg text-success">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="text-on-surface font-semibold">Comments</h3>
          </div>
          <div>
            <div className="text-4xl font-bold text-on-surface mb-1">{comments.length}</div>
            <p className="text-sm text-on-surface-variant">Across all posts</p>
          </div>
        </div>

        <div className="bg-surface-container rounded-[16px] p-6 border border-outline-variant flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-error/20 rounded-lg text-error">
              <Heart className="w-6 h-6" />
            </div>
            <h3 className="text-on-surface font-semibold">Total Likes</h3>
          </div>
          <div>
            <div className="text-4xl font-bold text-on-surface mb-1">{totalLikes}</div>
            <p className="text-sm text-on-surface-variant">Across all posts</p>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Chart */}
        <div className="lg:col-span-2 bg-surface-container rounded-[16px] p-6 border border-outline-variant">
          <h2 className="text-xl font-semibold text-on-surface mb-6">Posts per week</h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#464555" vertical={false} />
                <XAxis 
                  dataKey="label" 
                  stroke="#c7c4d8" 
                  fontSize={12} 
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                />
                <YAxis 
                  stroke="#c7c4d8" 
                  fontSize={12} 
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip 
                  cursor={{ fill: '#232a3a' }}
                  contentStyle={{ backgroundColor: '#191f2f', borderColor: '#464555', color: '#dce2f7', borderRadius: '8px' }}
                  itemStyle={{ color: '#4f46e5' }}
                />
                <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="bg-surface-container rounded-[16px] p-6 border border-outline-variant flex flex-col">
          <h2 className="text-xl font-semibold text-on-surface mb-6">Recent Activity</h2>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-6">
            {recentActivity.length === 0 ? (
              <p className="text-sm text-on-surface-variant italic text-center py-8">No recent activity found.</p>
            ) : (
              recentActivity.map((item) => (
                <div key={item.id} className="flex gap-4 items-start">
                  <div className={`p-2 rounded-full shrink-0 ${
                    item.type === 'post' 
                      ? 'bg-primary-container/20 text-primary-container' 
                      : 'bg-success/20 text-success'
                  }`}>
                    {item.type === 'post' ? <FileText className="w-4 h-4" /> : <MessageCircle className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-on-surface truncate">{item.title}</p>
                    <p className="text-xs text-on-surface-variant mt-0.5 truncate">{item.subtitle}</p>
                  </div>
                  <div className="text-xs text-on-surface-variant whitespace-nowrap pt-0.5">
                    {formatRelativeTime(item.date)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
