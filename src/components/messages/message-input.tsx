'use client';

import { useState, useRef, useCallback } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { cn } from 'cn';
import { Button } from '@/components/ui/button';

interface MessageInputProps {
  disabled?: boolean;
  placeholder?: string;
  onSend: (content: string) => void;
  /** 替换输入区域的提示文案（被屏蔽时） */
  disabledMessage?: string;
  /** 是否显示 Unblock 按钮 */
  showUnblock?: boolean;
  onUnblock?: () => void;
}

const MAX_LENGTH = 1000;

/**
 * 消息输入框组件。
 * 支持 Enter 发送、Shift+Enter 换行、字数统计、截断。
 */
export default function MessageInput({
  disabled = false,
  placeholder = 'Type a message...',
  onSend,
  disabledMessage,
  showUnblock,
  onUnblock,
}: MessageInputProps) {
  const [value, setValue] = useState('');
  const [sending, setSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const trimmed = value.trim();
  const isValid = trimmed.length > 0 && trimmed.length <= MAX_LENGTH;
  const showCharCount = value.length > 900;
  const atLimit = value.length >= MAX_LENGTH;

  const handleSend = useCallback(() => {
    if (!isValid || sending || disabled) return;
    setSending(true);
    onSend(trimmed);
    setValue('');
    // 发送完成后重置 sending 状态（由外部控制或超时）
    setTimeout(() => setSending(false), 500);
  }, [isValid, sending, disabled, onSend, trimmed]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    // 截断超过 1000 字符的输入
    if (newValue.length > MAX_LENGTH) {
      setValue(newValue.slice(0, MAX_LENGTH));
      return;
    }
    setValue(newValue);
  };

  // 禁用状态：替换为提示文案
  if (disabled) {
    return (
      <div className="border-t border-border bg-background px-4 py-3">
        <p className="text-sm text-muted-foreground">{disabledMessage || 'Messages cannot be sent'}</p>
        {showUnblock && onUnblock && (
          <Button variant="outline" size="sm" className="mt-2" onClick={onUnblock}>
            Unblock
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="border-t border-border bg-background px-3 py-2 md:px-4">
      <div className="flex items-end gap-2">
        <div className="relative min-w-0 flex-1">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={1}
            className={cn(
              'w-full resize-none rounded-lg border border-input bg-transparent px-3 py-2 text-sm transition-colors outline-none',
              'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
              'placeholder:text-muted-foreground',
            )}
            style={{ minHeight: 40, maxHeight: 120 }}
            aria-label="Message input"
            aria-describedby={showCharCount ? 'char-count' : undefined}
          />
        </div>
        <Button
          size="icon"
          className="h-10 w-10 shrink-0 rounded-lg"
          disabled={!isValid || sending}
          onClick={handleSend}
          aria-label="Send message"
        >
          {sending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Send className="size-4" />
          )}
        </Button>
      </div>
      {/* 字数统计 */}
      {showCharCount && (
        <p
          id="char-count"
          className={cn(
            'mt-1 text-right text-[10px]',
            atLimit ? 'text-destructive' : 'text-accent',
          )}
          aria-live="polite"
        >
          {value.length}/{MAX_LENGTH}
        </p>
      )}
    </div>
  );
}
