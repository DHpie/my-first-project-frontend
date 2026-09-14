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

export async function getFeaturedDestinations(): Promise<Destination[]> {
  const response = await request.get<Result<Destination[]>>(
    "/api/destinations/featured"
  );
  return response.data.data;
}
