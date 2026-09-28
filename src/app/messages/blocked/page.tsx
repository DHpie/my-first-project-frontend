'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Shield, ShieldOff, UserX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/lib/use-auth';
import { getBlockedUsers, unblockUser } from '@/api/messages';
import type { BlockedUser } from '@/types/message';
import { toast } from 'sonner';

type PageState = 'loading' | 'error' | 'empty' | 'data';

export default function BlockedUsersPage() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const [state, setState] = useState<PageState>('loading');
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);

  const fetchBlockedUsers = useCallback(async () => {
    setState('loading');
    try {
      const data = await getBlockedUsers();
      setBlockedUsers(data);
      setState(data.length === 0 ? 'empty' : 'data');
    } catch {
      setState('error');
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      fetchBlockedUsers();
    }
  }, [isLoggedIn, fetchBlockedUsers]);

  const handleUnblock = async (userId: string, nickname: string) => {
    try {
      await unblockUser(userId);
      setBlockedUsers((prev) => prev.filter((u) => u.id !== userId));
      toast.success(`${nickname} unblocked`);
      if (blockedUsers.length === 1) {
        setState('empty');
      }
    } catch {
      toast.error('Failed to unblock user');
    }
  };

  if (!isLoggedIn) return null;

  return (
    <section aria-label="Blocked users" className="mx-auto max-w-[600px] px-4 md:px-0">
      {/* Header */}
      <div className="flex items-center gap-3 py-4">
        <button
          onClick={() => router.push('/messages')}
          className="flex items-center justify-center rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Back to messages"
        >
          <ArrowLeft className="size-5" />
        </button>
        <h1 className="text-lg font-semibold text-foreground">Blocked users</h1>
      </div>

      {/* loading */}
      {state === 'loading' && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg border border-border p-3">
              <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-8 w-20" />
            </div>
          ))}
        </div>
      )}

      {/* error */}
      {state === 'error' && (
        <div className="flex flex-col items-center justify-center py-16">
          <Shield className="mb-4 size-12 text-muted-foreground" />
          <p className="mb-1 text-sm font-medium text-foreground">Something went wrong</p>
          <p className="mb-4 text-xs text-muted-foreground">Could not load blocked users</p>
          <Button variant="outline" onClick={fetchBlockedUsers}>
            Retry
          </Button>
        </div>
      )}

      {/* empty */}
      {state === 'empty' && (
        <div className="flex flex-col items-center justify-center py-16">
          <UserX className="mb-4 size-12 text-muted-foreground opacity-30" />
          <p className="mb-1 text-sm font-medium text-foreground">No blocked users</p>
          <p className="text-center text-xs text-muted-foreground max-w-[220px]">
            Users you block will appear here
          </p>
        </div>
      )}

      {/* data */}
      {state === 'data' && (
        <div className="space-y-2">
          {blockedUsers.map((user) => (
            <div
              key={user.id}
              className="flex items-center gap-3 rounded-lg border border-border p-3"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
                <UserX className="size-5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{user.nickname}</p>
                <p className="text-xs text-muted-foreground">Blocked</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleUnblock(user.id, user.nickname)}
              >
                <ShieldOff className="size-3.5" />
                Unblock
              </Button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
