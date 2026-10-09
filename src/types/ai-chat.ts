export interface AiChatStreamRequest {
  message: string;
  conversationId: number | null;
}

export interface AiChatHistoryResponse {
  conversationId: number | null;
  messages: AiChatMessage[];
  hasMore: boolean;
}

export interface AiChatMessage {
  id: number;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface SourceRef {
  type: "DESTINATION" | "POST";
  name: string;
  id: number;
}

export interface SseChunkData {
  content: string;
  done?: boolean;
  conversationId?: number;
  sources?: SourceRef[];
  error?: string;
}
