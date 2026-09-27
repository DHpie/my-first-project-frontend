/** 会话列表项 */
export interface Conversation {
  conversationId: string;
  otherUserId: string;
  otherUserAvatar: string | null;
  otherUserNickname: string;
  lastMessageSnippet: string;
  lastMessageTime: string;
  unreadCount: number;
}

/** 单条消息 */
export interface Message {
  id: string;
  content: string;
  timestamp: string;
  isMine: boolean;
}

/** 会话列表分页响应 */
export interface ConversationListResponse {
  conversations: Conversation[];
  hasMore: boolean;
}

/** 消息列表分页响应 */
export interface MessageListResponse {
  messages: Message[];
  hasMore: boolean;
}

/** 未读会话计数响应 */
export interface UnreadConversationCountResponse {
  count: number;
}

/** 用户搜索结果 */
export interface UserSearchResult {
  id: string;
  nickname: string;
  avatarUrl: string | null;
}

/** WebSocket 推送的消息载荷 */
export interface WebSocketMessagePayload {
  conversationId: string;
  messageId: string;
  content: string;
  senderId: string;
  timestamp: string;
}

/** 前端乐观消息（用于乐观更新） */
export interface OptimisticMessage {
  tempId: string;
  content: string;
  status: 'sending' | 'sent' | 'failed';
  timestamp: string;
  isMine: boolean;
}

/** 屏蔽用户信息 */
export interface BlockedUser {
  id: string;
  nickname: string;
  avatarUrl: string | null;
}
