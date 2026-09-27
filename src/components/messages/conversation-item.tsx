'use client';

import { useRouter } from 'next/navigation';
import { User } from 'lucide-react';
import { cn } from 'cn';
import { formatMessageTime } from '@/lib/format';
import type { Conversation } from '@/types/message';

interface ConversationItemProps {
  conversation: Conversation;
  /** 点击后标记已读的回调 */
  onMarkRead?: (conversationId: string) => void;
}

/**
 * 单个会话行组件。
 * 展示头像 + 昵称 + 消息片段 + 时间 + 未读 badge。
 */
export default function ConversationItem({ conversation, onMarkRead }: ConversationItemProps) {
  const router = useRouter();
  const {
    conversationId,
    otherUserAvatar,
    otherUserNickname,
    lastMessageSnippet,
    lastMessageTime,
    unreadCount,
  } = conversation;

  const isUnread = unreadCount > 0;
  const isDeletedUser = otherUserNickname === 'Deleted user';

  const handleClick = () => {
    if (isUnread) {
      onMarkRead?.(conversationId);
    }
    router.push(`/messages/${conversationId}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      role="listitem"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        'flex cursor-pointer items-center gap-3 border-b border-border px-4 py-3 transition-colors duration-150',
        'hover:bg-muted/50',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-[-2px]',
        isUnread && 'bg-primary/5',
      )}
      aria-label={`${otherUserNickname}, ${lastMessageSnippet}, ${formatMessageTime(lastMessageTime)}${isUnread ? `, ${unreadCount} unread messages` : ''}`}
    >
      {/* 头像 */}
      <div className="relative shrink-0">
        {otherUserAvatar && !isDeletedUser ? (
          <img
            src={otherUserAvatar}
            alt={otherUserNickname}
            className="h-10 w-10 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <User className="size-5 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* 内容区域 */}
      <div className="min-w-0 flex-1">
        {/* 第一行：昵称 + 时间 + badge */}
        <div className="flex items-center justify-between gap-2">
          <span
            className={cn(
              'truncate text-sm',
              isUnread ? 'font-semibold text-foreground' : 'font-medium text-foreground',
              isDeletedUser && 'opacity-60',
            )}
          >
            {isDeletedUser ? 'Deleted user' : otherUserNickname}
          </span>
          <div className="flex shrink-0 items-center gap-1.5">
            <span className="text-xs text-muted-foreground">
              {formatMessageTime(lastMessageTime)}
            </span>
            {isUnread && (
              <span
                className="flex items-center justify-center rounded-full bg-primary font-bold text-primary-foreground"
                style={{ minWidth: 18, height: 18, fontSize: 10 }}
                aria-label={`${unreadCount} unread messages`}
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </div>
        </div>
        {/* 第二行：消息片段 */}
        <p
          className={cn(
            'truncate text-xs',
            isUnread ? 'font-medium text-foreground' : 'text-muted-foreground',
          )}
        >
          {lastMessageSnippet}
        </p>
      </div>
    </div>
  );
}
