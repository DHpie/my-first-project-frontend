import request from "./request";
import type { Result } from "@/types/user";

export interface ChatResponse {
  reply: string;
}

export async function chat(message: string): Promise<ChatResponse> {
  const response = await request.post<Result<ChatResponse>>(
    "/api/ai/chat",
    { message }
  );
  return response.data.data;
}
