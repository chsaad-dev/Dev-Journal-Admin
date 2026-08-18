"use client";

import { useState, useRef, KeyboardEvent } from "react";
import { Post } from "@/types/post";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { ArrowLeft, Image as ImageIcon, Loader2, X } from "lucide-react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { auth } from "@/lib/firebase";

interface PostEditorProps {
  initialPost?: Post;
  onSave: (postData: Partial<Post>) => Promise<void>;
}

export default function PostEditor({ initialPost, onSave }: PostEditorProps) {
  const [title, setTitle] = useState(initialPost?.title || "");
  const [excerpt, setExcerpt] = useState(initialPost?.excerpt || "");
  const [content, setContent] = useState(initialPost?.content || "");
  const [tags, setTags] = useState<string[]>(initialPost?.tags || []);
  const [tagInput, setTagInput] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState(initialPost?.coverImageUrl || "");
  const [published, setPublished] = useState(initialPost?.published || false);
  
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTagInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "," || e.key === "Enter") {
      e.preventDefault();
      const newTag = tagInput.trim().toLowerCase();
      if (newTag && !tags.includes(newTag)) {
        setTags([...tags, newTag]);
      }
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);
    try {
      const { url } = await uploadToCloudinary(file);
      setCoverImageUrl(url);
    } catch (err: any) {
      setError(err.message || "Failed to upload image.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    setError(null);
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    if (!content.trim()) {
      setError("Content is required");
      return;
    }

    setIsSaving(true);
    try {
      const authorId = auth.currentUser?.uid || initialPost?.authorId || "unknown";
      await onSave({
        title: title.trim(),
        excerpt: excerpt.trim(),
        content: content.trim(),
        tags,
        coverImageUrl,
        published,
        authorId, // Ensure authorId is set if new
      });
    } catch (err: any) {
      setError(err.message || "Failed to save post");
      setIsSaving(false); // only reset on error, if success it redirects
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Top Bar */}
      <div className="flex items-center justify-between border-b border-outline-variant pb-6">
        <div className="flex items-center gap-4">
          <Link
            href="/posts"
            className="p-2 hover:bg-surface-container-high rounded-lg text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-on-surface">
            {initialPost ? "Edit Post" : "New Post"}
          </h1>
        </div>
        
        <div className="flex items-center gap-4">
          {error && <span className="text-error text-sm font-medium">{error}</span>}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center px-6 py-2.5 bg-primary-container hover:bg-[#4338ca] text-on-surface font-medium rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isSaving ? "Saving..." : "Save Post"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Metadata & Settings */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Cover Image */}
          <div className="bg-surface-container border border-outline-variant rounded-[var(--radius-card)] p-5">
            <h3 className="text-sm font-medium text-on-surface-variant mb-3">Cover Image</h3>
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="relative w-full aspect-video rounded-lg border-2 border-dashed border-outline-variant hover:border-primary-container bg-surface-container-high flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-colors group"
            >
              {coverImageUrl ? (
                <>
                  <img src={coverImageUrl} alt="Cover" className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <span className="text-white text-sm font-medium">Change Image</span>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center text-on-surface-variant">
                  <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                  <span className="text-sm">Click to upload image</span>
                </div>
              )}

              {isUploading && (
                <div className="absolute inset-0 bg-surface-container/80 flex items-center justify-center backdrop-blur-sm">
                  <Loader2 className="w-6 h-6 text-primary-container animate-spin" />
                </div>
              )}
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageUpload} 
              accept="image/*" 
              className="hidden" 
            />
          </div>

          {/* Title & Excerpt */}
          <div className="bg-surface-container border border-outline-variant rounded-[var(--radius-card)] p-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-on-surface-variant mb-1">Title <span className="text-error">*</span></label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter a compelling title..."
                className="w-full bg-surface-container-high border border-outline-variant rounded-lg px-4 py-2 text-on-surface font-medium text-lg focus:outline-none focus:border-primary-container transition-colors placeholder:text-on-surface-variant/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-on-surface-variant mb-1">Excerpt</label>
              <textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="Brief summary of the post..."
                rows={3}
                className="w-full bg-surface-container-high border border-outline-variant rounded-lg px-4 py-2 text-on-surface text-sm focus:outline-none focus:border-primary-container transition-colors resize-none placeholder:text-on-surface-variant/50"
              />
            </div>
          </div>

          {/* Tags & Published */}
          <div className="bg-surface-container border border-outline-variant rounded-[var(--radius-card)] p-5 space-y-6">
            <div>
              <label className="block text-sm font-medium text-on-surface-variant mb-1">Tags (comma or enter to add)</label>
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagInputKeyDown}
                placeholder="e.g. android, kotlin, UI..."
                className="w-full bg-surface-container-high border border-outline-variant rounded-lg px-4 py-2 text-on-surface text-sm focus:outline-none focus:border-primary-container transition-colors placeholder:text-on-surface-variant/50"
              />
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {tags.map((tag) => (
                    <span 
                      key={tag} 
                      onClick={() => removeTag(tag)}
                      className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-surface-container-high text-on-surface border border-outline-variant cursor-pointer hover:bg-error-container hover:text-error hover:border-error-container transition-colors group"
                    >
                      {tag}
                      <X className="w-3 h-3 ml-1 opacity-50 group-hover:opacity-100" />
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-outline-variant pt-4">
              <span className="text-sm font-medium text-on-surface-variant">Published</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={published}
                  onChange={(e) => setPublished(e.target.checked)}
                />
                <div className="w-11 h-6 bg-surface-container-high border border-outline-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-on-surface-variant after:border-on-surface-variant after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-success-container peer-checked:after:bg-success peer-checked:border-success-container"></div>
              </label>
            </div>
          </div>

        </div>

        {/* Right Column: Markdown Editor & Preview */}
        <div className="lg:col-span-2 flex flex-col lg:flex-row gap-4 bg-surface-container border border-outline-variant rounded-[var(--radius-card)] overflow-hidden h-[800px]">
          {/* Editor */}
          <div className="flex-1 flex flex-col border-b lg:border-b-0 lg:border-r border-outline-variant overflow-hidden">
            <div className="bg-surface-container-high px-4 py-2 border-b border-outline-variant text-xs font-medium text-on-surface-variant uppercase tracking-wider">
              Markdown
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your post content here using Markdown..."
              className="flex-1 w-full bg-transparent p-4 text-on-surface font-mono text-sm focus:outline-none resize-none placeholder:text-on-surface-variant/30"
            />
          </div>

          {/* Preview */}
          <div className="flex-1 flex flex-col overflow-hidden bg-background">
            <div className="bg-surface-container-high px-4 py-2 border-b border-outline-variant text-xs font-medium text-on-surface-variant uppercase tracking-wider">
              Preview
            </div>
            <div className="flex-1 overflow-y-auto p-6 prose prose-invert prose-headings:text-on-surface prose-p:text-on-surface-variant prose-a:text-tertiary prose-strong:text-on-surface max-w-none">
              {content ? (
                <ReactMarkdown>
                  {content}
                </ReactMarkdown>
              ) : (
                <p className="text-on-surface-variant/30 italic mt-0">Preview will appear here...</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
