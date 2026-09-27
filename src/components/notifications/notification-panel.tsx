'use client';

import { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Bell, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { getNotifications, markAsRead, markAllAsRead } from '@/api/notifications';
import NotificationItem from './notification-item';
import type { Notification } from '@/types/notification';

type PanelState = 'loading' | 'error' | 'empty' | 'data';
type WsStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting' | 'lost';

const PAGE_SIZE = 20;

export interface NotificationPanelHandle {
  addNotification: (notification: Notification) => void;
}

interface NotificationPanelProps {
  open: boolean;
  onClose: () => void;
  wsStatus: WsStatus;
  unreadCount: number;
  onUnreadCountChange: (count: number) => void;
  bellButtonRef: React.RefObject<HTMLButtonElement | null>;
  onMarkAllRead: () => void;
  wsRefresh: () => void;
}

const NotificationPanel = forwardRef<NotificationPanelHandle, NotificationPanelProps>(
  function NotificationPanel(props, ref) {
  const { open, onClose, wsStatus, unreadCount, onUnreadCountChange, bellButtonRef, onMarkAllRead, wsRefresh } = props;
  const [panelState, setPanelState] = useState<PanelState>('loading');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState(false);
  const [markingAllRead, setMarkingAllRead] = useState(false);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());

  const panelRef = useRef<HTMLDivElement>(null);
  const prevWsStatusRef = useRef<WsStatus>(wsStatus);
  const router = useRouter();

  // 首次加载通知列表
  const loadNotifications = useCallback(async () => {
    setPanelState('loading');
    try {
      const data = await getNotifications(0, PAGE_SIZE);
      setNotifications(data.notifications);
      setHasMore(data.hasMore);
      setPanelState(data.notifications.length === 0 ? 'empty' : 'data');
      setLoadMoreError(false);
    } catch {
      setPanelState('error');
    }
  }, []);

  // 面板打开时加载数据
  useEffect(() => {
    if (open) {
      loadNotifications();
    }
  }, [open, loadNotifications]);

  // Escape 关闭面板
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  // 关闭时焦点回到铃铛按钮
  useEffect(() => {
    if (!open) {
      bellButtonRef.current?.focus();
    }
  }, [open, bellButtonRef]);

  // 监听 WebSocket 状态变化：重连成功后刷新列表
  useEffect(() => {
    const prevStatus = prevWsStatusRef.current;
    prevWsStatusRef.current = wsStatus;

    if (prevStatus === 'reconnecting' && wsStatus === 'connected' && open) {
      loadNotifications();
    }
  }, [wsStatus, open, loadNotifications]);

  // 处理新通知到达（从 WebSocket 推送）
  const addNotification = useCallback((notification: Notification) => {
    setNotifications((prev) => [notification, ...prev]);
    setNewIds((prev) => new Set(prev).add(notification.id));
    setPanelState((prev) => (prev === 'empty' ? 'data' : prev));
    // 200ms 后移除 new 标记
    setTimeout(() => {
      setNewIds((prev) => {
        const next = new Set(prev);
        next.delete(notification.id);
        return next;
      });
    }, 300);
  }, []);

  // 通过 ref 暴露方法给父组件
  useImperativeHandle(ref, () => ({ addNotification }), [addNotification]);

  // 点击通知
  const handleNotificationClick = useCallback(async (notification: Notification) => {
    try {
      await markAsRead(notification.id);

      // 更新本地列表状态
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n))
      );

      if (notification.isContentDeleted) {
        // 内容已删除：toast 提示，不跳转
        toast.info('This content is no longer available', { duration: 3000 });
      } else {
        // 内容存在：关闭面板 + 跳转
        onClose();
        router.push(`/posts/${notification.targetId}`);
      }

      // 如果该通知未读，badge -1
      if (!notification.isRead) {
        onUnreadCountChange(Math.max(0, unreadCount - 1));
      }
    } catch {
      toast.error('Failed to update notification', { duration: Infinity });
    }
  }, [onClose, router, onUnreadCountChange, unreadCount]);
  const handleMarkAllRead = useCallback(async () => {
    setMarkingAllRead(true);
    try {
      await markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      onUnreadCountChange(0);
      onMarkAllRead();
      toast.success('All notifications marked as read', { duration: 3000 });
    } catch {
      toast.error('Failed to mark all as read', { duration: Infinity });
    } finally {
      setMarkingAllRead(false);
    }
  }, [onUnreadCountChange, onMarkAllRead]);

  // Load more
  const handleLoadMore = useCallback(async () => {
    setLoadingMore(true);
    setLoadMoreError(false);
    try {
      const nextPage = Math.ceil(notifications.length / PAGE_SIZE);
      const data = await getNotifications(nextPage, PAGE_SIZE);
      setNotifications((prev) => [...prev, ...data.notifications]);
      setHasMore(data.hasMore);
    } catch {
      setLoadMoreError(true);
    } finally {
      setLoadingMore(false);
    }
  }, [notifications.length]);

  // Mark all as read

  if (!open) return null;

  const hasUnread = unreadCount > 0;
  // WebSocket 未连接且首次数据尚未返回时显示 connecting 状态
  const isConnecting = wsStatus !== 'connected' && panelState === 'loading';

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-label="Notifications panel"
      className={cn(
        'absolute right-0 mt-2 z-50',
        'w-[calc(100vw-32px)] max-w-[360px] md:w-[360px]',
        'max-h-[480px] rounded-lg border bg-popover shadow-lg',
        'flex flex-col',
        'animate-[fade-slide-up_150ms_ease-out]',
      )}
    >
      {/* PanelHeader */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h2 className="text-sm font-semibold text-foreground">Notifications</h2>
        {hasUnread && panelState === 'data' && (
          <button
            type="button"
            aria-label="Mark all notifications as read"
            onClick={handleMarkAllRead}
            disabled={markingAllRead}
            className="flex items-center gap-1 text-xs text-primary hover:underline disabled:opacity-50"
          >
            {markingAllRead && <Loader2 className="h-3 w-3 animate-spin" />}
            Mark all as read
          </button>
        )}
      </div>

      {/* 列表区域 */}
      <div className="overflow-y-auto flex-1" role="list" aria-label="Notification list">
        {/* connecting 状态 */}
        {isConnecting && (
          <div className="flex flex-col gap-2 p-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 rounded-md bg-muted animate-pulse" />
            ))}
          </div>
        )}

        {/* loading 状态（5 行 Skeleton） */}
        {!isConnecting && panelState === 'loading' && (
          <div className="flex flex-col gap-2 p-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-1 py-2">
                <div className="h-8 w-8 rounded-full bg-muted animate-pulse shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-3/4 rounded bg-muted animate-pulse" />
                  <div className="h-2.5 w-1/2 rounded bg-muted animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* error 状态 */}
        {panelState === 'error' && (
          <div className="flex flex-col items-center justify-center py-10 px-4">
            <AlertCircle className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm font-medium text-foreground">Something went wrong</p>
            <p className="text-xs text-muted-foreground mt-1">Could not load notifications</p>
            <button
              type="button"
              onClick={loadNotifications}
              className="mt-4 inline-flex items-center rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* empty 状态 */}
        {panelState === 'empty' && (
          <div className="flex flex-col items-center justify-center py-10 px-4">
            <Bell className="h-12 w-12 text-muted-foreground opacity-30 mb-3" />
            <p className="text-sm font-medium text-foreground">No notifications yet</p>
            <p className="text-xs text-muted-foreground text-center max-w-[200px] mt-1">
              When someone interacts with your content, you&apos;ll see it here.
            </p>
          </div>
        )}

        {/* data 状态 */}
        {panelState === 'data' && (
          <>
            {/* aria-live 区域，屏幕阅读器播报新通知 */}
            <div aria-live="polite" className="sr-only">
              {newIds.size > 0 && `${newIds.size} new notification(s)`}
            </div>
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onClick={handleNotificationClick}
                isNew={newIds.has(notification.id)}
              />
            ))}

            {/* LoadMoreTrigger */}
            {notifications.length > PAGE_SIZE && hasMore && (
              <div className="flex justify-center py-3">
                {loadMoreError ? (
                  <p className="text-xs text-muted-foreground">
                    Failed to load.{' '}
                    <button
                      type="button"
                      onClick={handleLoadMore}
                      className="text-primary hover:underline"
                    >
                      Retry
                    </button>
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="text-sm text-primary hover:underline disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {loadingMore ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      'Load more'
                    )}
                  </button>
                )}
              </div>
            )}
            {notifications.length >= PAGE_SIZE && !hasMore && (
              <p className="py-3 text-center text-xs text-muted-foreground">
                No more notifications
              </p>
            )}
          </>
        )}
      </div>

      {/* WebSocket 状态提示条 */}
      {(wsStatus === 'reconnecting' || wsStatus === 'lost') && (
        <div className="border-t bg-muted px-4 py-2 text-center">
          {wsStatus === 'reconnecting' && (
            <p className="text-xs text-muted-foreground flex items-center justify-center gap-1.5">
              <Loader2 className="h-3 w-3 animate-spin" />
              Reconnecting...
            </p>
          )}
          {wsStatus === 'lost' && (
            <p className="text-xs text-muted-foreground">
              Connection lost.{' '}
              <button
                type="button"
                onClick={wsRefresh}
                className="text-primary hover:underline font-medium"
              >
                Refresh
              </button>
            </p>
          )}
        </div>
      )}
    </div>
  );
});

export default NotificationPanel;
