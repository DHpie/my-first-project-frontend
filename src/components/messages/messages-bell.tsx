'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { MessageCircle } from 'lucide-react';
import { cn } from 'cn';
import { useAuth } from '@/lib/use-auth';
import { useMessageWs } from '@/lib/use-message-ws';
import { getUnreadConversationCount } from '@/api/messages';
import type { WebSocketMessagePayload } from '@/types/message';

/**
 * Header 消息图标组件。
 * 展示未读会话计数 badge，点击跳转到 /messages。
 * 未登录时不渲染。
 */
export default function MessagesBell() {
  const { isLoggedIn } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [badgePulse, setBadgePulse] = useState(false);

  // 拉取未读计数
  const fetchUnread = useCallback(() => {
    getUnreadConversationCount()
      .then((data) => setUnreadCount(data.count))
      .catch(() => {/* 静默失败 */});
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      fetchUnread();
    }
  }, [isLoggedIn, fetchUnread]);

  // WebSocket 收到新消息时更新 badge
  const handleWsMessage = useCallback((payload: WebSocketMessagePayload) => {
    // 新消息到达时 +1 并触发弹跳动画
    setUnreadCount((prev) => prev + 1);
    setBadgePulse(true);
    setTimeout(() => setBadgePulse(false), 200);
  }, []);

  useMessageWs({
    onMessage: handleWsMessage,
    enabled: isLoggedIn,
  });

  if (!isLoggedIn) return null;

  const displayCount = unreadCount > 99 ? '99+' : String(unreadCount);

  return (
    <Link
      href="/messages"
      className="relative inline-flex items-center justify-center text-muted-foreground transition-colors duration-200 hover:text-foreground"
      aria-label={`Messages, ${unreadCount} unread conversations`}
    >
      <MessageCircle className="size-5" />
      {unreadCount > 0 && (
        <span
          className={cn(
            'absolute -top-1.5 -right-1.5 flex items-center justify-center rounded-full bg-primary font-bold text-primary-foreground ring-2 ring-background',
            'min-w-[18px] h-[18px] text-[10px]',
            badgePulse && 'scale-110 transition-transform duration-200',
          )}
          aria-label={`${unreadCount} unread messages`}
        >
          {displayCount}
        </span>
      )}
    </Link>
  );
}
