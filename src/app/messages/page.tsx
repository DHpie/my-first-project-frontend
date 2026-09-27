'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, MessageCircle, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/lib/use-auth';
import { getConversations, markConversationRead } from '@/api/messages';
import type { Conversation } from '@/types/message';
import ConversationItem from '@/components/messages/conversation-item';
import NewConversationDialog from '@/components/messages/new-conversation-dialog';

type PageState = 'loading' | 'error' | 'empty' | 'data';

export default function MessagesPage() {
  const router = useRouter();
  const { isLoggedIn, userId } = useAuth();
  const [state, setState] = useState<PageState>('loading');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // 未登录重定向
  useEffect(() => {
    if (isLoggedIn === false) {
      // 仅在确认未登录后重定向，避免初始化时误判
      const timer = setTimeout(() => {
        if (!isLoggedIn) router.push('/');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isLoggedIn, router]);

  // 拉取会话列表
  const fetchConversations = useCallback(async (pageNum: number, append: boolean = false) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      if (!append) setState('loading');
      const data = await getConversations(pageNum, 20, controller.signal);
      const list = data.conversations;

      if (append) {
        setConversations((prev) => [...prev, ...list]);
      } else {
        setConversations(list);
      }
      setHasMore(data.hasMore);
      setPage(pageNum);

      if (!append && list.length === 0) {
        setState('empty');
      } else {
        setState('data');
      }
    } catch (err) {
      if ((err as Error).name === 'CanceledError') return;
      if (!append) setState('error');
      else setLoadMoreError(true);
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      fetchConversations(0);
    }
  }, [isLoggedIn, fetchConversations]);

  // 标记已读
  const handleMarkRead = useCallback(async (conversationId: string) => {
    try {
      await markConversationRead(conversationId);
      setConversations((prev) =>
        prev.map((c) =>
          c.conversationId === conversationId ? { ...c, unreadCount: 0 } : c,
        ),
      );
    } catch {
      // 静默失败
    }
  }, []);

  // 加载更多
  const handleLoadMore = async () => {
    setLoadingMore(true);
    setLoadMoreError(false);
    await fetchConversations(page + 1, true);
    setLoadingMore(false);
  };

  // 重试
  const handleRetry = () => {
    fetchConversations(0);
  };

  // 新建会话后刷新列表
  const handleConversationCreated = (conversationId: string) => {
    setDialogOpen(false);
    router.push(`/messages/${conversationId}`);
  };

  if (!isLoggedIn) return null;

  return (
    <section aria-label="Messages" className="mx-auto max-w-[600px] px-4 md:px-0">
      {/* 页面标题 */}
      <div className="flex items-center justify-between py-4">
        <h1 className="text-lg font-semibold text-foreground">Messages</h1>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="size-4" />
          New message
        </Button>
      </div>

      {/* loading 状态 */}
      {state === 'loading' && (
        <div role="list" aria-label="Conversations">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 border-b border-border px-4 py-3" style={{ height: 72 }}>
              <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="flex justify-between gap-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-10" />
                </div>
                <Skeleton className="h-3 w-40" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* error 状态 */}
      {state === 'error' && (
        <div className="flex flex-col items-center justify-center py-16">
          <AlertCircle className="mb-4 size-12 text-muted-foreground" />
          <p className="mb-1 text-sm font-medium text-foreground">Something went wrong</p>
          <p className="mb-4 text-xs text-muted-foreground">Could not load your messages</p>
          <Button variant="outline" onClick={handleRetry}>
            Retry
          </Button>
        </div>
      )}

      {/* empty 状态 */}
      {state === 'empty' && (
        <div className="flex flex-col items-center justify-center py-16">
          <MessageCircle className="mb-4 size-12 text-muted-foreground opacity-30" />
          <p className="mb-1 text-sm font-medium text-foreground">No messages yet</p>
          <p className="mb-4 text-center text-xs text-muted-foreground max-w-[220px]">
            Start a conversation with someone!
          </p>
          <Button onClick={() => setDialogOpen(true)}>Start a conversation</Button>
        </div>
      )}

      {/* data 状态 */}
      {state === 'data' && (
        <>
          <div role="list" aria-label="Conversations">
            {conversations.map((conv) => (
              <ConversationItem
                key={conv.conversationId}
                conversation={conv}
                onMarkRead={handleMarkRead}
              />
            ))}
          </div>

          {/* 加载更多 */}
          {hasMore && (
            <div className="py-3 text-center">
              {loadMoreError ? (
                <span className="text-sm text-muted-foreground">
                  Failed to load.{' '}
                  <button
                    onClick={handleLoadMore}
                    className="text-primary hover:underline"
                  >
                    Retry
                  </button>
                </span>
              ) : (
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="text-sm text-primary hover:underline disabled:opacity-50"
                >
                  {loadingMore ? 'Loading...' : 'Load more'}
                </button>
              )}
            </div>
          )}
        </>
      )}

      {/* 新建会话 Dialog */}
      <NewConversationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onConversationCreated={handleConversationCreated}
      />
    </section>
  );
}
