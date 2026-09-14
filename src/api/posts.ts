import request from "./request";
import type { Result } from "@/types/user";

export interface CommunityPost {
  id: number;
  authorName: string;
  authorAvatarUrl: string;
  title: string;
  excerpt: string;
  likeCount: number;
}

export async function getFeaturedPosts(): Promise<CommunityPost[]> {
  const response = await request.get<Result<CommunityPost[]>>(
    "/api/posts/featured"
  );
  return response.data.data;
}
