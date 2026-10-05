import { Metadata } from "next";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { getPostById } from "@/lib/posts";
import { getUserById } from "@/lib/users";
import { 
  Heart, 
  MessageSquare, 
  Eye, 
  Clock, 
  Calendar, 
  Smartphone, 
  ExternalLink,
  BookOpen,
  ArrowLeft
} from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const post = await getPostById(id);

  if (!post || !post.published) {
    return {
      title: "Post Not Found — DevJournal",
      description: "The requested post could not be found or has not been published.",
    };
  }

  const cleanDescription = (post.excerpt || post.content.slice(0, 160))
    .replace(/[#*`_\[\]]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  return {
    title: `${post.title} — DevJournal`,
    description: cleanDescription,
    openGraph: {
      title: post.title,
      description: cleanDescription,
      url: `https://devjournal-web.vercel.app/posts/${id}`,
      siteName: "DevJournal",
      images: post.coverImageUrl ? [{ url: post.coverImageUrl }] : [],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: cleanDescription,
      images: post.coverImageUrl ? [post.coverImageUrl] : [],
    },
  };
}

export default async function PublicPostPage({ params }: Props) {
  const { id } = await params;
  const post = await getPostById(id);

  // Published posts only — if published == false or doesn't exist, show clean not-found state without leaking drafts
  if (!post || !post.published) {
    return (
      <div className="min-h-screen bg-background text-on-surface flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-surface-container-high border border-outline-variant flex items-center justify-center mb-6">
          <BookOpen className="w-8 h-8 text-on-surface-variant opacity-60" />
        </div>
        <h1 className="text-2xl font-bold font-mono text-on-surface mb-2">
          Post Not Found
        </h1>
        <p className="text-on-surface-variant max-w-md mb-8 text-sm">
          This article does not exist, has been deleted by the author, or is currently unpublished.
        </p>
        <a
          href="https://play.google.com/store/apps/details?id=com.devjournal" // TODO: Replace with published Play Store URL
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary-container text-white text-sm font-semibold hover:bg-primary-container/90 transition-colors"
        >
          <Smartphone className="w-4 h-4" /> Download DevJournal App
        </a>
      </div>
    );
  }

  // Fetch author details
  const author = post.authorId ? await getUserById(post.authorId) : null;
  const authorName = author?.name || (post.authorId ? `Developer (${post.authorId.slice(0, 6)})` : "DevJournal Author");
  const authorPhoto = author?.photoUrl || "";

  // Format date
  let publishedDate = "Recently";
  if (post.createdAt) {
    try {
      const date = post.createdAt.toDate ? post.createdAt.toDate() : new Date(post.createdAt);
      publishedDate = date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      publishedDate = "Recently";
    }
  }

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col font-sans">
      {/* Top Banner: App Download CTA */}
      <aside aria-label="DevJournal App Banner" className="bg-surface-container-high/80 border-b border-outline-variant px-4 py-2.5 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-tertiary shrink-0" />
            <span className="text-on-surface">
              Read and interact with this post in the <strong>DevJournal</strong> app
            </span>
          </div>
          <a
            href="https://play.google.com/store/apps/details?id=com.devjournal" // TODO: Replace with published Play Store URL
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-primary-container text-white text-xs font-semibold hover:bg-primary-container/90 transition-colors shrink-0 shadow-sm"
          >
            Open in App <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </aside>

      {/* Main Header */}
      <header className="border-b border-outline-variant bg-surface-container/40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold font-mono tracking-tighter text-tertiary">
              DevJournal
            </span>
            <span className="hidden sm:inline-block text-xs uppercase tracking-widest text-on-surface-variant font-mono px-2 py-0.5 rounded border border-outline-variant bg-surface-container">
              Public Reader
            </span>
          </div>

          <a
            href="https://play.google.com/store/apps/details?id=com.devjournal" // TODO: Replace with published Play Store URL
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-on-surface-variant hover:text-tertiary transition-colors flex items-center gap-1 font-mono"
          >
            Get Android App <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <article>
          {/* Cover Image */}
          {post.coverImageUrl && (
            <div className="relative w-full aspect-[21/9] max-h-[460px] rounded-[var(--radius-card)] overflow-hidden border border-outline-variant mb-8 bg-surface-container shadow-lg">
              <img
                src={post.coverImageUrl}
                alt={post.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-on-surface leading-[1.15] mb-6">
            {post.title}
          </h1>

          {/* Author & Publication Metadata */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-outline-variant text-sm">
            <div className="flex items-center gap-3">
              {authorPhoto ? (
                <img
                  src={authorPhoto}
                  alt={authorName}
                  className="w-11 h-11 rounded-full object-cover border border-outline-variant"
                />
              ) : (
                <div className="w-11 h-11 rounded-full bg-primary-container/20 border border-outline-variant flex items-center justify-center text-primary-container font-mono font-bold">
                  {authorName.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <p className="font-semibold text-on-surface leading-tight">
                  {authorName}
                </p>
                <div className="flex items-center gap-3 text-xs text-on-surface-variant mt-1">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 opacity-70" />
                    {publishedDate}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 opacity-70" />
                    {post.readTimeMinutes || 1} min read
                  </span>
                </div>
              </div>
            </div>

            {/* Read-Only Social Stats */}
            <div className="flex items-center gap-3 bg-surface-container px-3.5 py-1.5 rounded-full border border-outline-variant text-xs text-on-surface-variant">
              <span className="flex items-center gap-1.5" title="Likes">
                <Heart className="w-3.5 h-3.5 text-error" />
                <span className="font-mono">{post.likeCount || 0}</span>
              </span>
              <span className="opacity-30">•</span>
              <span className="flex items-center gap-1.5" title="Comments">
                <MessageSquare className="w-3.5 h-3.5 text-tertiary" />
                <span className="font-mono">{post.commentCount || 0}</span>
              </span>
              <span className="opacity-30">•</span>
              <span className="flex items-center gap-1.5" title="Views">
                <Eye className="w-3.5 h-3.5 text-on-surface-variant" />
                <span className="font-mono">{post.viewCount || 0}</span>
              </span>
            </div>
          </div>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-6">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 rounded-md text-xs font-mono bg-surface-container-high text-tertiary border border-outline-variant"
                >
                  {tag.startsWith("#") ? tag : `#${tag}`}
                </span>
              ))}
            </div>
          )}

          {/* Markdown Content */}
          <div className="pt-8 pb-12">
            <div className="prose prose-invert prose-headings:text-on-surface prose-headings:font-bold prose-p:text-on-surface-variant prose-p:leading-relaxed prose-a:text-tertiary hover:prose-a:underline prose-strong:text-on-surface prose-code:text-tertiary prose-code:bg-surface-container-high prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:font-mono prose-pre:bg-surface-container-high prose-pre:border prose-pre:border-outline-variant prose-pre:rounded-[var(--radius-card)] prose-blockquote:border-tertiary prose-blockquote:text-on-surface-variant max-w-none text-base">
              <ReactMarkdown>{post.content}</ReactMarkdown>
            </div>
          </div>
        </article>

        {/* Bottom Callout / App Conversion Card */}
        <section aria-label="Join DevJournal Callout" className="bg-surface-container border border-outline-variant rounded-[var(--radius-card)] p-6 sm:p-8 mt-4 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md">
          <div className="space-y-2">
            <h2 className="text-lg sm:text-xl font-bold text-on-surface">
              Join the conversation on DevJournal
            </h2>
            <p className="text-sm text-on-surface-variant max-w-md">
              Download the Android app to like this post, participate in comment discussions, bookmark articles offline, and publish your own engineering logs.
            </p>
          </div>
          <a
            href="https://play.google.com/store/apps/details?id=com.devjournal" // TODO: Replace with published Play Store URL
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary-container text-white text-sm font-semibold hover:bg-primary-container/90 transition-all shadow-md shrink-0"
          >
            <Smartphone className="w-4 h-4" /> Download App
          </a>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-outline-variant bg-surface-container/20 py-8 px-4 text-center text-xs text-on-surface-variant font-mono">
        <p>© {new Date().getFullYear()} DevJournal. All rights reserved.</p>
      </footer>
    </div>
  );
}
