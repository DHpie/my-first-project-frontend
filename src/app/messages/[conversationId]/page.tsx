'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  AlertCircle,
  MessageCircle,
  ArrowDown,
  Loader2,
  ShieldAlert,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/lib/use-auth';
import { useMessageWs } from '@/lib/use-message-ws';
import {
  getMessages,
  sendMessage,
  markConversationRead,
  getConversation,
  getBlockStatus,
  blockUser,
  unblockUser,
} from '@/api/messages';
import type { Message, OptimisticMessage, WebSocketMessagePayload } from '@/types/message';
import ConversationHeader from '@/components/messages/conversation-header';
import MessageBubble from '@/components/messages/message-bubble';
import MessageInput from '@/components/messages/message-input';
import BlockUserDialog from '@/components/messages/block-user-dialog';
import { toast } from 'sonner';

type PageState =
  | 'loading'
  | 'error'
  | 'not-found'
  | 'blocked-by-me'
  | 'blocked-by-other'
  | 'deleted-user'
  | 'data';

export default function ConversationPage() {
  const params = useParams<{ conversationId: string }>();
  const conversationId = params?.conversationId;
  const router = useRouter();
  const { isLoggedIn, userId } = useAuth();

  const [state, setState] = useState<PageState>('loading');
  const [messages, setMessages] = useState<(Message | OptimisticMessage)[]>([]);
  const [otherUserNickname, setOtherUserNickname] = useState('');
  const [otherUserAvatar, setOtherUserAvatar] = useState<string | null>(null);
  const [otherUserId, setOtherUserId] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(0);
  const [loadingEarlier, setLoadingEarlier] = useState(false);

  // 自动滚动相关
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showNewMsgBtn, setShowNewMsgBtn] = useState(false);
  const isAtBottomRef = useRef(true);

  // Block 对话框
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);

  // 乐观消息计数器
  const tempIdCounter = useRef(0);

  // 拉取消息列表
  const fetchMessages = useCallback(
    async (pageNum: number, append: boolean = false) => {
      if (!conversationId) return;
      try {
        const data = await getMessages(conversationId, pageNum, 50);
        const msgs = data.messages;

        if (append) {
          setMessages((prev) => [...msgs, ...prev]);
        } else {
          setMessages(msgs);
        }
        setHasMore(data.hasMore);
        setPage(pageNum);

        // 首次加载后滚动到底部
        if (!append) {
          setState('data');
          setTimeout(() => scrollToBottom(), 100);
        }
      } catch (err) {
        if (!append) {
          // 判断错误类型
          const errMsg = (err as Error).message;
          if (errMsg.includes('404') || errMsg.includes('not found')) {
            setState('not-found');
          } else {
            setState('error');
          }
        }
      }
    },
    [conversationId],
  );

  // 拉取会话详情（对方用户信息 + 屏蔽状态）
  // 返回检测到的特殊状态，如果为 null 则表示正常状态
  const fetchConversationDetail = useCallback(async (): Promise<PageState | null> => {
    if (!conversationId) return null;
    try {
      const conv = await getConversation(conversationId);
      setOtherUserNickname(conv.otherUserNickname);
      setOtherUserAvatar(conv.otherUserAvatar);
      setOtherUserId(conv.otherUserId);

      // 检测已删除用户
      if (conv.otherUserNickname === 'Deleted user') {
        return 'deleted-user';
      }

      // 检测屏蔽状态
      const blockStatus = await getBlockStatus(conv.otherUserId);
      if (blockStatus.status === 'blocked-by-me') {
        return 'blocked-by-me';
      }
      if (blockStatus.status === 'blocked-by-other') {
        return 'blocked-by-other';
      }

      return null; // 正常状态
    } catch (err) {
      const errMsg = (err as Error).message;
      if (errMsg.includes('404') || errMsg.includes('not found')) {
        return 'not-found';
      }
      return 'error';
    }
  }, [conversationId]);

  useEffect(() => {
    if (isLoggedIn && conversationId) {
      (async () => {
        const specialState = await fetchConversationDetail();
        // 屏蔽状态下仍然加载消息历史（只读展示）
        const shouldLoadMessages = specialState === null ||
          specialState === 'blocked-by-me' ||
          specialState === 'blocked-by-other';

        if (specialState && specialState !== 'blocked-by-me' && specialState !== 'blocked-by-other') {
          setState(specialState);
          return;
        }

        if (shouldLoadMessages) {
          await fetchMessages(0);
          // 标记已读（仅正常状态和屏蔽状态下标记）
          markConversationRead(conversationId).catch(() => {});
        }

        // 消息加载完成后设置特殊状态（如果有的话）
        if (specialState) {
          setState(specialState);
        }
      })();
    }
  }, [isLoggedIn, conversationId, fetchConversationDetail, fetchMessages]);

  // 滚动到底部
  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  // 检测是否在底部
  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    isAtBottomRef.current = scrollHeight - scrollTop - clientHeight < 50;
    setShowNewMsgBtn(!isAtBottomRef.current);
  };

  // 发送消息（乐观更新）
  const handleSend = useCallback(
    async (content: string) => {
      const tempId = `temp-${++tempIdCounter.current}`;
      const optimisticMsg: OptimisticMessage = {
        tempId,
        content,
        status: 'sending',
        timestamp: new Date().toISOString(),
        isMine: true,
      };

      setMessages((prev) => [...prev, optimisticMsg]);

      // 如果用户在底部，自动滚动
      if (isAtBottomRef.current) {
        setTimeout(scrollToBottom, 50);
      }

      try {
        const saved = await sendMessage(conversationId, content);
        // 服务端确认 → 替换为真实消息
        setMessages((prev) =>
          prev.map((m) => {
            if ('tempId' in m && m.tempId === tempId) {
              return saved;
            }
            return m;
          }),
        );
      } catch {
        // 发送失败
        setMessages((prev) =>
          prev.map((m) => {
            if ('tempId' in m && m.tempId === tempId) {
              return { ...m, status: 'failed' as const };
            }
            return m;
          }),
        );
      }
    },
    [conversationId],
  );

  // 重试发送
  const handleRetry = useCallback(
    async (msg: OptimisticMessage) => {
      // 先标记为 sending
      setMessages((prev) =>
        prev.map((m) => {
          if ('tempId' in m && m.tempId === msg.tempId) {
            return { ...m, status: 'sending' as const };
          }
          return m;
        }),
      );

      try {
        const saved = await sendMessage(conversationId, msg.content);
        setMessages((prev) =>
          prev.map((m) => {
            if ('tempId' in m && m.tempId === msg.tempId) {
              return saved;
            }
            return m;
          }),
        );
      } catch {
        setMessages((prev) =>
          prev.map((m) => {
            if ('tempId' in m && m.tempId === msg.tempId) {
              return { ...m, status: 'failed' as const };
            }
            return m;
          }),
        );
      }
    },
    [conversationId],
  );

  // 加载更早消息
  const handleLoadEarlier = async () => {
    setLoadingEarlier(true);
    await fetchMessages(page + 1, true);
    setLoadingEarlier(false);
  };

  // WebSocket 收到新消息
  const handleWsMessage = useCallback(
    (payload: WebSocketMessagePayload) => {
      if (payload.conversationId !== conversationId) return;

      const newMsg: Message = {
        id: payload.messageId,
        content: payload.content,
        timestamp: payload.timestamp,
        isMine: payload.senderId === userId,
      };

      setMessages((prev) => [...prev, newMsg]);

      // 如果在底部则自动滚动
      if (isAtBottomRef.current) {
        setTimeout(scrollToBottom, 50);
      }
    },
    [conversationId, userId],
  );

  useMessageWs({
    onMessage: handleWsMessage,
    enabled: isLoggedIn && state === 'data',
  });

  if (!conversationId) return null;

  // Block user
  const handleBlockUser = async () => {
    if (!otherUserId) return;
    try {
      await blockUser(otherUserId);
      setBlockDialogOpen(false);
      toast('User blocked');
      router.push('/messages');
    } catch {
      toast('Failed to block user');
    }
  };

  // Unblock
  const handleUnblock = async () => {
    if (!otherUserId) return;
    try {
      await unblockUser(otherUserId);
      setState('data');
    } catch {
      // 静默
    }
  };

  if (!isLoggedIn) return null;

  // 判断是否为 OptimisticMessage
  const isOptimistic = (m: Message | OptimisticMessage): m is OptimisticMessage =>
    'tempId' in m;

  return (
    <div className="mx-auto flex h-[calc(100vh-4rem)] max-w-[720px] flex-col">
      {/* Header */}
      <ConversationHeader
        otherUserAvatar={otherUserAvatar}
        otherUserNickname={otherUserNickname}
        onBlockUser={() => setBlockDialogOpen(true)}
      />

      {/* loading 状态 */}
      {state === 'loading' && (
        <div className="flex flex-1 flex-col gap-3 p-4">
          <Skeleton className="h-4 w-16 self-start rounded-full" />
          <Skeleton className="h-4 w-24 self-end rounded-full" />
          <Skeleton className="h-4 w-20 self-start rounded-full" />
          <Skeleton className="h-4 w-28 self-end rounded-full" />
          <Skeleton className="h-4 w-16 self-start rounded-full" />
          <Skeleton className="h-4 w-20 self-end rounded-full" />
        </div>
      )}

      {/* error 状态 */}
      {state === 'error' && (
        <div className="flex flex-1 flex-col items-center justify-center">
          <AlertCircle className="mb-4 size-12 text-muted-foreground" />
          <p className="mb-1 text-sm font-medium text-foreground">Something went wrong</p>
          <p className="mb-4 text-xs text-muted-foreground">Could not load messages</p>
          <Button variant="outline" onClick={() => fetchMessages(0)}>
            Retry
          </Button>
        </div>
      )}

      {/* not-found 状态 */}
      {state === 'not-found' && (
        <div className="flex flex-1 flex-col items-center justify-center">
          <MessageCircle className="mb-4 size-12 text-muted-foreground" />
          <p className="mb-1 text-sm font-medium text-foreground">Conversation not found</p>
          <p className="mb-4 text-center text-xs text-muted-foreground max-w-[280px]">
            This conversation doesn&apos;t exist or you don&apos;t have access.
          </p>
          <Button variant="outline" onClick={() => router.push('/messages')}>
            ← Back to messages
          </Button>
        </div>
      )}

      {/* blocked-by-me 状态 */}
      {state === 'blocked-by-me' && (
        <>
          <div className="flex items-center gap-2 border-b border-border bg-muted/50 px-4 py-2">
            <ShieldAlert className="size-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              You have blocked this user. Messages will not be delivered.
            </span>
          </div>
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-3 py-4 md:px-4"
            role="log"
            aria-live="polite"
            aria-label="Message history"
          >
            {messages.filter((m) => !isOptimistic(m)).map((m) => {
              const msg = m as Message;
              return (
                <MessageBubble
                  key={msg.id}
                  id={msg.id}
                  content={msg.content}
                  timestamp={msg.timestamp}
                  isMine={msg.isMine}
                />
              );
            })}
          </div>
          <MessageInput
            disabled
            disabledMessage="You have blocked this user"
            showUnblock
            onUnblock={handleUnblock}
            onSend={() => {}}
          />
        </>
      )}

      {/* blocked-by-other 状态 */}
      {state === 'blocked-by-other' && (
        <>
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-3 py-4 md:px-4"
            role="log"
            aria-live="polite"
            aria-label="Message history"
          >
            {messages.filter((m) => !isOptimistic(m)).map((m) => {
              const msg = m as Message;
              return (
                <MessageBubble
                  key={msg.id}
                  id={msg.id}
                  content={msg.content}
                  timestamp={msg.timestamp}
                  isMine={msg.isMine}
                />
              );
            })}
          </div>
          <div className="border-t border-border bg-background px-4 py-3">
            <p className="text-sm text-muted-foreground">You have been blocked by this user</p>
          </div>
        </>
      )}

      {/* deleted-user 状态 */}
      {state === 'deleted-user' && (
        <>
          <div className="flex items-center gap-2 border-b border-border bg-muted/50 px-4 py-2">
            <Info className="size-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">This user no longer exists.</span>
          </div>
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-3 py-4 md:px-4"
            role="log"
            aria-live="polite"
            aria-label="Message history"
          >
            {messages.filter((m) => !isOptimistic(m)).map((m) => {
              const msg = m as Message;
              return (
                <MessageBubble
                  key={msg.id}
                  id={msg.id}
                  content={msg.content}
                  timestamp={msg.timestamp}
                  isMine={msg.isMine}
                />
              );
            })}
          </div>
          <div className="border-t border-border bg-background px-4 py-3">
            <p className="text-sm text-muted-foreground">This user no longer exists</p>
          </div>
        </>
      )}

      {/* data 状态 */}
      {state === 'data' && (
        <>
          {/* 消息列表 */}
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="relative flex-1 overflow-y-auto px-3 py-4 md:px-4"
            role="log"
            aria-live="polite"
            aria-label="Message history"
          >
            {/* 加载更早消息 */}
            {hasMore && (
              <div className="mb-4 text-center">
                {loadingEarlier ? (
                  <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                    <Loader2 className="size-3 animate-spin" />
                    Loading...
                  </span>
                ) : (
                  <button
                    onClick={handleLoadEarlier}
                    className="text-sm text-primary hover:underline"
                  >
                    Load earlier messages
                  </button>
                )}
              </div>
            )}

            {/* 消息气泡 */}
            <div className="flex flex-col gap-3">
              {messages.map((m) => {
                if (isOptimistic(m)) {
                  return (
                    <MessageBubble
                      key={m.tempId}
                      id={m.tempId}
                      content={m.content}
                      timestamp={m.timestamp}
                      isMine={m.isMine}
                      status={m.status}
                      onRetry={() => handleRetry(m)}
                    />
                  );
                }
                const msg = m as Message;
                return (
                  <MessageBubble
                    key={msg.id}
                    id={msg.id}
                    content={msg.content}
                    timestamp={msg.timestamp}
                    isMine={msg.isMine}
                  />
                );
              })}
            </div>

            {/* 新消息浮动按钮 */}
            {showNewMsgBtn && (
              <button
                onClick={scrollToBottom}
                className="fixed bottom-24 right-4 z-10 flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-lg transition-all hover:bg-primary/80 md:right-auto md:left-1/2 md:-translate-x-1/2"
              >
                <ArrowDown className="size-3" />
                New messages
              </button>
            )}
          </div>

          {/* 输入区域 */}
          <MessageInput onSend={handleSend} />
        </>
      )}

      {/* Block User 确认对话框 */}
      <BlockUserDialog
        open={blockDialogOpen}
        onOpenChange={setBlockDialogOpen}
        otherUserNickname={otherUserNickname}
        onConfirm={handleBlockUser}
      />
    </div>
  );
}
