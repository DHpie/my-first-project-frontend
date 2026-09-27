export type NotificationType = 'LIKE' | 'COMMENT' | 'REPLY';

export interface Notification {
  id: string;
  type: NotificationType;
  actorAvatar: string | null;
  actorNickname: string;
  actionText: string;
  contentSnippet: string;
  timestamp: string;
  isRead: boolean;
  isContentDeleted: boolean;
  targetId: number;
}

export interface NotificationListResponse {
  notifications: Notification[];
  hasMore: boolean;
  totalElements: number;
}

export interface UnreadCountResponse {
  count: number;
}

// WebSocket 推送的消息即为 NotificationResponse，无额外包装

