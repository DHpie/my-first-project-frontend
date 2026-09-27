import request from './request';
import type { Result } from '../types/user';
import type {
  NotificationListResponse,
  UnreadCountResponse,
} from '../types/notification';

// TODO: 待实现认证系统后替换为动态用户 ID
const CURRENT_USER_ID = '1';

/** 所有通知 API 请求需携带 X-User-Id header（临时认证方案） */
const userHeader = { headers: { 'X-User-Id': CURRENT_USER_ID } };

export async function getNotifications(
  page: number,
  size: number,
  signal?: AbortSignal
): Promise<NotificationListResponse> {
  const response = await request.get<Result<NotificationListResponse>>(
    '/api/notifications',
    { params: { page, size }, signal, ...userHeader }
  );
  return response.data.data;
}

export async function markAsRead(id: string): Promise<void> {
  await request.put<Result<void>>(`/api/notifications/${id}/read`, null, userHeader);
}

export async function markAllAsRead(): Promise<void> {
  await request.put<Result<void>>('/api/notifications/read-all', null, userHeader);
}

export async function getUnreadCount(): Promise<number> {
  const response = await request.get<Result<UnreadCountResponse>>(
    '/api/notifications/unread-count',
    userHeader
  );
  return response.data.data.count;
}
