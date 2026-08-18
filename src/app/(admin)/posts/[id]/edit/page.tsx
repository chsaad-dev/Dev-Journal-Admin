"use client";

import { useEffect, useState, use } from "react";
import PostEditor from "@/components/PostEditor";
import { getPostById, updatePost } from "@/lib/posts";
import { useRouter } from "next/navigation";
import { Post } from "@/types/post";
import { Loader2 } from "lucide-react";
import Link from "next/link";

export default function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPost() {
      try {
        const data = await getPostById(id);
        setPost(data);
      } catch (error) {
        console.error("Failed to fetch post:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchPost();
  }, [id]);

  const handleSave = async (postData: Partial<Post>) => {
    await updatePost(id, postData);
    router.push("/posts");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 text-primary-container animate-spin" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <h2 className="text-2xl font-bold text-on-surface">Post not found</h2>
        <p className="text-on-surface-variant">The post you are trying to edit does not exist or has been deleted.</p>
        <Link 
          href="/posts"
          className="px-4 py-2 bg-primary-container hover:bg-[#4338ca] text-on-surface rounded-lg transition-colors"
        >
          Back to Posts
        </Link>
      </div>
    );
  }

  return <PostEditor initialPost={post} onSave={handleSave} />;
}
