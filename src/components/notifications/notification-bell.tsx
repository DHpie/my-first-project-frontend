'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getUnreadCount } from '@/api/notifications';
import { useNotificationWs } from '@/lib/use-notification-ws';
import { getCurrentUserUuid } from '@/lib/auth';
import NotificationPanel, { type NotificationPanelHandle } from './notification-panel';
import type { Notification } from '@/types/notification';

/**
 * 模拟登录 token：从 localStorage 获取当前用户 UUID。
 * 项目暂无真实认证机制，待后续实现后对接。
 */
function useAuthToken(): string | null {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const uuid = getCurrentUserUuid();
    setToken(uuid);
  }, []);

  return token;
}

export default function NotificationBell() {
  const token = useAuthToken();
  const [panelOpen, setPanelOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [bouncing, setBouncing] = useState(false);

  const bellButtonRef = useRef<HTMLButtonElement>(null);
  const bellContainerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<NotificationPanelHandle>(null);

  // WebSocket 收到新通知
  const handleNewNotification = useCallback((notification: Notification) => {
    if (panelOpen) {
      // 面板打开时：插入列表顶部
      panelRef.current?.addNotification(notification);
    } else {
      // 面板关闭时：badge +1 + 弹跳动画
      setBouncing(true);
      setTimeout(() => setBouncing(false), 200);
    }
    setUnreadCount((prev) => prev + 1);
  }, [panelOpen]);

  // WebSocket 重连成功：拉取断线期间的通知
  const handleReconnected = useCallback(() => {
    getUnreadCount()
      .then((count) => setUnreadCount(count))
      .catch(() => {/* 静默失败 */});
  }, []);

  const { status: wsStatus, refresh: wsRefresh } = useNotificationWs(
    token,
    handleNewNotification,
    handleReconnected,
  );

  // 初始加载未读计数
  useEffect(() => {
    if (!token) return;
    getUnreadCount()
      .then((count) => setUnreadCount(count))
      .catch(() => {/* 静默失败 */});
  }, [token]);

  // 点击面板外部关闭
  useEffect(() => {
    if (!panelOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (bellContainerRef.current && !bellContainerRef.current.contains(e.target as Node)) {
        setPanelOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [panelOpen]);

  // 未登录不渲染
  if (!token) return null;

  const togglePanel = () => setPanelOpen((prev) => !prev);

  const badgeText = unreadCount > 99 ? '99+' : String(unreadCount);

  return (
    <div ref={bellContainerRef} className="relative">
      {/* 铃铛按钮 */}
      <button
        ref={bellButtonRef}
        type="button"
        onClick={togglePanel}
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
        aria-haspopup="true"
        aria-expanded={panelOpen}
        className={cn(
          'relative flex items-center justify-center p-2 rounded-lg transition-colors duration-200',
          'hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring',
          panelOpen ? 'text-primary' : 'text-muted-foreground',
        )}
      >
        <Bell className="size-5 md:size-[20px]" />
        {/* 未读 badge */}
        {unreadCount > 0 && (
          <span
            className={cn(
              'absolute -top-1.5 -right-1.5 flex items-center justify-center',
              'min-w-[18px] h-[18px] rounded-full',
              'bg-primary text-primary-foreground text-[10px] font-bold leading-none',
              'ring-2 ring-background',
              'px-1',
              bouncing && 'animate-[badge-bounce_200ms_ease-out]',
            )}
          >
            {badgeText}
          </span>
        )}
      </button>

      {/* 通知面板 */}
      <NotificationPanel
        ref={panelRef}
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        wsStatus={wsStatus}
        unreadCount={unreadCount}
        onUnreadCountChange={setUnreadCount}
        bellButtonRef={bellButtonRef}
        onMarkAllRead={() => setBouncing(false)}
        wsRefresh={wsRefresh}
      />
    </div>
  );
}
