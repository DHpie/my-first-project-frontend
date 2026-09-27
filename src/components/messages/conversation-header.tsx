'use client';

import { useRouter } from 'next/navigation';
import { MoreVertical, Ban, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ConversationHeaderProps {
  otherUserAvatar: string | null;
  otherUserNickname: string;
  onBlockUser: () => void;
}

/**
 * 会话详情页顶部栏。
 * 展示对方头像 + 昵称 + 更多操作菜单（Block user）。
 */
export default function ConversationHeader({
  otherUserAvatar,
  otherUserNickname,
  onBlockUser,
}: ConversationHeaderProps) {
  const router = useRouter();
  const isDeletedUser = otherUserNickname === 'Deleted user';

  return (
    <div className="flex items-center justify-between border-b border-border px-4 py-2">
      {/* 返回按钮 + 头像 + 昵称 */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => router.push('/messages')}
          aria-label="Back to messages"
        >
          ←
        </Button>
        {otherUserAvatar && !isDeletedUser ? (
          <img
            src={otherUserAvatar}
            alt={otherUserNickname}
            className="h-8 w-8 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
            <User className="size-4 text-muted-foreground" />
          </div>
        )}
        <span className={`text-sm font-semibold text-foreground ${isDeletedUser ? 'opacity-60' : ''}`}>
          {isDeletedUser ? 'Deleted user' : otherUserNickname}
        </span>
      </div>

      {/* 更多操作菜单 */}
      {!isDeletedUser && (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="ghost" size="icon-sm" aria-label="More options" />}
          >
            <MoreVertical className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={onBlockUser}>
              <Ban className="mr-2 size-4" />
              Block user
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
