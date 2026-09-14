"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { User } from "lucide-react";
import { Heart } from "lucide-react";
import type { CommunityPost } from "@/api/posts";
import { truncateExcerpt, formatLikeCount } from "@/lib/format";

interface PostCardProps {
  post: CommunityPost;
}

export default function PostCard({ post }: PostCardProps) {
  const [avatarFailed, setAvatarFailed] = useState(false);

  return (
    <Link
      href={`/community/posts/${post.id}`}
      className="block rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow duration-200 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 outline-none"
      aria-label={`Read post: ${post.title}`}
    >
      {/* Author Info */}
      <div className="mb-3 flex items-center gap-3">
        <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-muted">
          {!avatarFailed ? (
            <Image
              src={post.authorAvatarUrl}
              alt={post.authorName}
              width={40}
              height={40}
              className="rounded-full object-cover"
              onError={() => setAvatarFailed(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center rounded-full bg-muted">
              <User className="h-5 w-5 text-muted-foreground" />
            </div>
          )}
        </div>
        <span className="text-sm font-medium text-card-foreground">
          {post.authorName}
        </span>
      </div>

      {/* Title */}
      <h3 className="mb-2 text-base font-semibold text-card-foreground line-clamp-2">
        {post.title}
      </h3>

      {/* Excerpt (truncated) */}
      <p className="mb-3 text-sm text-muted-foreground">
        {truncateExcerpt(post.excerpt, 120)}
      </p>

      {/* Like Count */}
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Heart className="h-4 w-4" />
        <span>{formatLikeCount(post.likeCount)}</span>
      </div>
    </Link>
  );
}
