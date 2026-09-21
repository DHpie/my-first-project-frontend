import request from "./request";
import type { Result } from "@/types/user";

export interface Destination {
  id: number;
  cityName: string;
  slug: string;
  highlight: string;
  coverImageUrl: string;
  popularityTag: string;
}

export async function getFeaturedDestinations(
  signal?: AbortSignal
): Promise<Destination[]> {
  const response = await request.get<Result<Destination[]>>(
    "/api/destinations/featured",
    { signal }
  );
  return response.data.data;
}
