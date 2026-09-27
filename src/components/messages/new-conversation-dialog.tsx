'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { useMediaQuery } from '@/lib/use-media-query';
import { searchUsers, createConversation } from '@/api/messages';
import type { UserSearchResult } from '@/types/message';

interface NewConversationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConversationCreated: (conversationId: string) => void;
}

type DialogState = 'idle' | 'typing' | 'searching' | 'results' | 'no-results' | 'search-error' | 'creating';

/**
 * 新建会话浮层。
 * 搜索用户并发起/打开会话。
 * Mobile (< 768px) 底部 Sheet，Desktop 居中 Dialog。
 */
export default function NewConversationDialog({
  open,
  onOpenChange,
  onConversationCreated,
}: NewConversationDialogProps) {
  const router = useRouter();
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const [state, setState] = useState<DialogState>('idle');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [creating, setCreating] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // 打开时重置状态
  useEffect(() => {
    if (open) {
      setQuery('');
      setResults([]);
      setState('idle');
    }
  }, [open]);

  // 搜索逻辑（300ms debounce）
  const doSearch = useCallback(async (nickname: string) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState('searching');
    try {
      const users = await searchUsers(nickname, controller.signal);
      setResults(users);
      setState(users.length > 0 ? 'results' : 'no-results');
    } catch (err) {
      if ((err as Error).name === 'CanceledError') return;
      setState('search-error');
    }
  }, []);

  const handleInputChange = (value: string) => {
    setQuery(value);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.length < 2) {
      setState('typing');
      setResults([]);
      return;
    }

    setState('typing');
    debounceRef.current = setTimeout(() => {
      doSearch(value);
    }, 300);
  };

  // 选择用户 → 创建/打开会话
  const handleSelectUser = async (user: UserSearchResult) => {
    setCreating(true);
    setState('creating');
    try {
      const { conversationId } = await createConversation(user.id);
      onOpenChange(false);
      onConversationCreated(conversationId);
    } catch {
      setCreating(false);
      setState('results');
    }
  };

  // 清理 debounce
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const content = (
    <div className="flex flex-col gap-3">
      {/* 搜索输入框 */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange(e.target.value)}
          placeholder="Search by nickname..."
          className="h-10 pl-9"
          autoFocus
        />
      </div>

      {/* 状态区域 */}
      {state === 'typing' && query.length < 2 && (
        <p className="text-xs text-muted-foreground">Type at least 2 characters to search</p>
      )}

      {state === 'searching' && (
        <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Searching...
        </div>
      )}

      {state === 'creating' && (
        <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Starting conversation...
        </div>
      )}

      {state === 'no-results' && (
        <p className="py-4 text-center text-sm text-muted-foreground">No users found</p>
      )}

      {state === 'search-error' && (
        <div className="py-4 text-center text-sm text-muted-foreground">
          Search failed.{' '}
          <button onClick={() => doSearch(query)} className="text-primary hover:underline">
            Retry
          </button>
        </div>
      )}

      {state === 'results' && (
        <div className="max-h-[300px] overflow-y-auto">
          {results.map((user) => (
            <button
              key={user.id}
              onClick={() => handleSelectUser(user)}
              disabled={creating}
              className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-muted disabled:opacity-50"
            >
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.nickname}
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                  {user.nickname.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-sm font-medium text-foreground">{user.nickname}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[400px]">
          <DialogHeader>
            <DialogTitle>New message</DialogTitle>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>New message</SheetTitle>
        </SheetHeader>
        <div className="px-4 pb-6">
          {content}
        </div>
      </SheetContent>
    </Sheet>
  );
}
