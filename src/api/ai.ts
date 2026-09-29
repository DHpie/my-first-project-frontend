import request from "./request";
import type { Result } from "@/types/user";
import type { AiChatHistoryResponse, SseChunkData } from "@/types/ai-chat";

export interface ChatResponse {
  reply: string;
}

/** @deprecated Use streamChat instead */
export async function chat(message: string): Promise<ChatResponse> {
  const response = await request.post<Result<ChatResponse>>(
    "/api/ai/chat",
    { message }
  );
  return response.data.data;
}

function getUserId(): string {
  return localStorage.getItem("user_uuid") || "1";
}

export async function* streamChat(
  message: string,
  conversationId: number | null,
  signal: AbortSignal
): AsyncGenerator<SseChunkData> {
  const response = await fetch("/api/ai/chat/stream", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-User-Id": getUserId(),
    },
    body: JSON.stringify({ message, conversationId }),
    signal,
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (line.startsWith("data:")) {
        const jsonStr = line.slice(5).trim();
        if (!jsonStr) continue;
        try {
          const data: SseChunkData = JSON.parse(jsonStr);
          yield data;
        } catch {
          // 跳过格式错误的 JSON 行
        }
      }
    }
  }
}

export async function getChatHistory(): Promise<AiChatHistoryResponse> {
  const response = await fetch("/api/ai/chat/history", {
    headers: { "X-User-Id": getUserId() },
  });
  const result = await response.json();
  return result.data;
}

export async function archiveConversation(): Promise<void> {
  await fetch("/api/ai/chat/conversation", {
    method: "DELETE",
    headers: { "X-User-Id": getUserId() },
  });
}
