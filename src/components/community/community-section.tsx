"use client";

import { useEffect, useState, useCallback, type ReactNode } from "react";
import { getFeaturedPosts, type CommunityPost } from "@/api/posts";
import PostCard from "./post-card";

const MAX_POSTS = 4;

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-muted" />
        <div className="h-4 w-20 rounded bg-muted" />
      </div>
      <div className="mb-2 h-5 w-3/4 rounded bg-muted" />
      <div className="mb-1 h-3 w-full rounded bg-muted" />
      <div className="mb-3 h-3 w-2/3 rounded bg-muted" />
      <div className="h-4 w-12 rounded bg-muted" />
    </div>
  );
}

export default function CommunitySection() {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const data = await Promise.race([
        getFeaturedPosts(),
        new Promise<never>((_, reject) => {
          controller.signal.addEventListener("abort", () =>
            reject(new Error("Request timeout"))
          );
          clearTimeout(timeoutId);
        }),
      ]);

      clearTimeout(timeoutId);
      setPosts(data.slice(0, MAX_POSTS));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const renderContent = (): ReactNode => {
    if (loading) {
      return (
        <div className="space-y-4 md:grid md:grid-cols-3 md:gap-6 md:space-y-0 lg:grid-cols-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="mb-4 text-muted-foreground">
            Failed to load community posts
          </p>
          <button
            onClick={fetchPosts}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      );
    }

    if (posts.length === 0) {
      return (
        <div className="flex items-center justify-center py-12 text-center">
          <p className="text-muted-foreground">
            No community posts available yet
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4 md:grid md:grid-cols-3 md:gap-6 md:space-y-0 lg:grid-cols-4">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    );
  };

  return (
    <section aria-label="Community highlights" className="py-8 md:py-12">
      <h2 className="mb-6 text-2xl font-bold text-foreground">
        Community Highlights
      </h2>
      {renderContent()}
    </section>
  );
}
