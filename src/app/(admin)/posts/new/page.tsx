"use client";

import PostEditor from "@/components/PostEditor";
import { createPost } from "@/lib/posts";
import { useRouter } from "next/navigation";

export default function NewPostPage() {
  const router = useRouter();

  const handleSave = async (postData: any) => {
    await createPost(postData);
    router.push("/posts");
  };

  return <PostEditor onSave={handleSave} />;
}
