import request from './request';
import type { Result } from '@/types/user';
import type {
  ConversationListResponse,
  Conversation,
  MessageListResponse,
  UnreadConversationCountResponse,
  UserSearchResult,
  BlockedUser,
  Message,
} from '@/types/message';

// TODO: 待实现认证系统后替换为动态用户 ID
const CURRENT_USER_ID = '1';

/** 所有会话/消息 API 请求需携带 X-User-Id header（临时认证方案） */
const userHeader = { headers: { 'X-User-Id': CURRENT_USER_ID } };

/** 分页获取当前用户会话列表 */
export async function getConversations(
  page: number,
  size: number,
  signal?: AbortSignal,
): Promise<ConversationListResponse> {
  const response = await request.get<Result<Conversation[]>>(
    '/api/conversations',
    { params: { page, size }, signal, ...userHeader },
  );
  const list = response.data.data ?? [];
  // 后端当前返回扁平数组，前端统一为 ConversationListResponse 结构
  return { conversations: list, hasMore: false };
}

/** 获取单个会话详情（含对方用户信息） */
export async function getConversation(
  conversationId: string,
  signal?: AbortSignal,
): Promise<Conversation> {
  const response = await request.get<Result<Conversation>>(
    `/api/conversations/${conversationId}`,
    { signal, ...userHeader },
  );
  return response.data.data;
}

/** 创建新会话（或返回已有会话） */
export async function createConversation(
  otherUserId: string,
  signal?: AbortSignal,
): Promise<{ conversationId: string }> {
  const response = await request.post<Result<{ conversationId: string }>>(
    '/api/conversations',
    { otherUserId },
    { signal, ...userHeader },
  );
  return response.data.data;
}

/** 分页获取会话消息列表 */
export async function getMessages(
  conversationId: string,
  page: number,
  size: number,
  signal?: AbortSignal,
): Promise<MessageListResponse> {
  const response = await request.get<Result<Message[]>>(
    `/api/conversations/${conversationId}/messages`,
    { params: { page, size }, signal, ...userHeader },
  );
  const list = (response.data.data ?? []).map((m: any) => ({
    ...m,
    isMine: m.mine ?? m.isMine ?? false,
  }));
  // 后端当前返回扁平数组，前端统一为 MessageListResponse 结构
  return { messages: list, hasMore: false };
}

/** 发送文字消息 */
export async function sendMessage(
  conversationId: string,
  content: string,
  signal?: AbortSignal,
): Promise<Message> {
  const response = await request.post<Result<Message>>(
    `/api/conversations/${conversationId}/messages`,
    { content },
    { signal, ...userHeader },
  );
  return response.data.data;
}

/** 标记会话所有消息已读 */
export async function markConversationRead(
  conversationId: string,
  signal?: AbortSignal,
): Promise<void> {
  await request.put<Result<void>>(
    `/api/conversations/${conversationId}/read`,
    {},
    { signal, ...userHeader },
  );
}

/** 获取未读会话总数 */
export async function getUnreadConversationCount(
  signal?: AbortSignal,
): Promise<UnreadConversationCountResponse> {
  const response = await request.get<Result<UnreadConversationCountResponse>>(
    '/api/conversations/unread-count',
    { signal, ...userHeader },
  );
  return response.data.data;
}

/** 按昵称搜索用户（≥2 字符，最多 10 条，排除自己） */
export async function searchUsers(
  nickname: string,
  signal?: AbortSignal,
): Promise<UserSearchResult[]> {
  const response = await request.get<Result<UserSearchResult[]>>('/api/users/search', {
    params: { nickname },
    signal,
    ...userHeader,
  });
  return response.data.data;
}

/** 屏蔽指定用户 */
export async function blockUser(
  userId: string,
  signal?: AbortSignal,
): Promise<void> {
  await request.post<Result<void>>(`/api/users/${userId}/block`, {}, { signal, ...userHeader });
}

/** 取消屏蔽 */
export async function unblockUser(
  userId: string,
  signal?: AbortSignal,
): Promise<void> {
  await request.delete<Result<void>>(`/api/users/${userId}/block`, { signal, ...userHeader });
}

/** 获取屏蔽列表 */
export async function getBlockedUsers(
  signal?: AbortSignal,
): Promise<BlockedUser[]> {
  const response = await request.get<Result<BlockedUser[]>>(
    '/api/users/blocked',
    { signal, ...userHeader },
  );
  const list = response.data.data ?? [];
  // 后端 id 为 Long，前端统一为 string
  return list.map((u: any) => ({
    ...u,
    id: String(u.id),
    avatarUrl: u.avatarUrl ?? null,
  }));
}

/** 检查与目标用户的屏蔽关系，返回 "none" | "blocked-by-me" | "blocked-by-other" */
export async function getBlockStatus(
  userId: string,
  signal?: AbortSignal,
): Promise<{ status: 'none' | 'blocked-by-me' | 'blocked-by-other' }> {
  const response = await request.get<Result<{ status: string }>>(
    `/api/users/${userId}/block-status`,
    { signal, ...userHeader },
  );
  return response.data.data as { status: 'none' | 'blocked-by-me' | 'blocked-by-other' };
}
