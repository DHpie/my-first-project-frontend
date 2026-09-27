'use client';

import { cn } from 'cn';
import { formatBubbleTime } from '@/lib/format';

interface MessageBubbleProps {
  id: string;
  content: string;
  timestamp: string;
  isMine: boolean;
  status?: 'sending' | 'sent' | 'failed';
  onRetry?: () => void;
}

/**
 * 单条消息气泡组件。
 * 自己的消息靠右（primary），对方消息靠左（muted）。
 * 支持 sending/sent/failed 三种发送状态。
 */
export default function MessageBubble({
  id,
  content,
  timestamp,
  isMine,
  status = 'sent',
  onRetry,
}: MessageBubbleProps) {
  const isSending = status === 'sending';
  const isFailed = status === 'failed';

  return (
    <div
      className={cn('flex flex-col', isMine ? 'items-end' : 'items-start')}
      aria-label={`${isMine ? 'You' : 'Other'}, ${content}, ${formatBubbleTime(timestamp)}`}
    >
      <div
        className={cn(
          'max-w-[75%] px-3 py-2',
          isMine
            ? 'rounded-2xl rounded-tr-sm bg-primary text-primary-foreground'
            : 'rounded-2xl rounded-tl-sm bg-muted text-foreground',
          isSending && 'opacity-60 transition-opacity duration-200',
        )}
      >
        <p className="whitespace-pre-wrap break-words text-sm">{content}</p>
        {!isSending && (
          <p
            className={cn(
              'mt-1 text-[10px]',
              isMine ? 'text-primary-foreground/60 text-right' : 'text-muted-foreground',
            )}
          >
            {formatBubbleTime(timestamp)}
          </p>
        )}
      </div>

      {/* 发送失败提示 */}
      {isFailed && isMine && (
        <div className="mt-1 flex items-center gap-1 text-xs text-destructive">
          <span>Failed to send</span>
          <button
            onClick={onRetry}
            className="font-medium text-primary hover:underline"
          >
            {isSending ? 'Retrying...' : 'Retry'}
          </button>
        </div>
      )}
    </div>
  );
}
