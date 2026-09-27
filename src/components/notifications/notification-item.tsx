'use client';

import { Heart, MessageCircle, Reply, User } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { formatRelativeTime } from '@/lib/format-relative-time';
import type { Notification, NotificationType } from '@/types/notification';

interface NotificationItemProps {
  notification: Notification;
  onClick: (notification: Notification) => void;
  isNew?: boolean;
}

// 通知类型对应图标与颜色
const typeIconConfig: Record<NotificationType, { icon: typeof Heart; color: string }> = {
  LIKE: { icon: Heart, color: 'text-primary' },
  COMMENT: { icon: MessageCircle, color: 'text-accent' },
  REPLY: { icon: Reply, color: 'text-accent' },
};

export default function NotificationItem({ notification, onClick, isNew }: NotificationItemProps) {
  const { type, actorAvatar, actorNickname, actionText, contentSnippet, timestamp, isRead, isContentDeleted } = notification;
  const typeConfig = typeIconConfig[type];
  const TypeIcon = typeConfig.icon;

  const handleClick = () => {
    onClick(notification);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick(notification);
    }
  };

  return (
    <div
      role="listitem"
      tabIndex={0}
      aria-current={isRead ? undefined : 'true'}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        'flex gap-3 px-3 py-3 cursor-pointer transition-colors duration-150',
        'hover:bg-muted/50 active:bg-muted',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-[-2px]',
        isRead ? 'bg-transparent' : 'bg-primary/5',
        isNew && 'animate-[fade-slide-up_200ms_ease-out]',
      )}
    >
      {/* 未读蓝色圆点 */}
      <div className="flex shrink-0 items-center pt-1.5">
        <div
          className={cn(
            'h-2 w-2 rounded-full bg-primary transition-opacity duration-200',
            isRead && 'opacity-0',
            isNew && !isRead && 'animate-pulse',
          )}
        />
      </div>

      {/* 头像（带类型图标角标） */}
      <div className="relative shrink-0">
        {actorAvatar ? (
          <Image
            src={actorAvatar}
            alt={actorNickname}
            width={32}
            height={32}
            className="h-8 w-8 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
            <User className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
        {/* 类型图标角标 */}
        <div className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-background ring-1 ring-border">
          <TypeIcon className={cn('h-2.5 w-2.5', typeConfig.color)} />
        </div>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p
            className={cn(
              'text-sm leading-snug',
              isRead ? 'font-normal text-muted-foreground' : 'font-semibold text-foreground',
            )}
          >
            <span>{actorNickname}</span>{' '}
            <span>{actionText}</span>
          </p>
          <time className="shrink-0 text-xs text-muted-foreground" dateTime={timestamp}>
            {formatRelativeTime(timestamp)}
          </time>
        </div>
        <p
          className={cn(
            'text-xs line-clamp-1 mt-0.5',
            isContentDeleted
              ? 'italic text-muted-foreground'
              : 'text-muted-foreground',
          )}
        >
          {isContentDeleted ? 'Content removed' : contentSnippet}
        </p>
      </div>
    </div>
  );
}
