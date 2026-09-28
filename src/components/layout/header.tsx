'use client';

import Link from 'next/link';
import Image from 'next/image';
import { User } from 'lucide-react';
import { useEffect, useState } from 'react';
import NotificationBell from '../notifications/notification-bell';
import MessagesBell from '@/components/messages/messages-bell';
import { getProfile } from '@/api/profile';
import { getCurrentUserUuid } from '@/lib/auth';
import type { Profile } from '@/types/profile';

export default function Header() {
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const uuid = getCurrentUserUuid();
    getProfile(uuid)
      .then(setProfile)
      .catch(() => { /* 静默失败，显示默认头像 */ });
  }, []);

  const displayName = profile?.nickname || 'User';
  const hasAvatar = !!profile?.avatarUrl;

  return (
    <header className="sticky top-0 z-50 w-full bg-background">
      {/* Brand gradient bottom edge */}
      <div className="h-[2px] bg-gradient-to-r from-[#C41E3A] via-[#D4A017] to-[#C41E3A]" />

      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-4 md:px-0">
        <Link
          href="/"
          className="text-xl font-bold tracking-tight text-foreground transition-colors hover:text-[#C41E3A]"
        >
          ChinaBuddy
        </Link>

        <div className="flex items-center gap-3">
          {/* 当前用户头像 + 昵称 */}
          <Link
            href="/profile"
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-muted"
            aria-label="My Profile"
          >
            {hasAvatar ? (
              <Image
                src={profile!.avatarUrl!}
                alt={`${displayName}'s avatar`}
                width={28}
                height={28}
                className="h-7 w-7 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
                <User className="size-4 text-primary" />
              </div>
            )}
            <span className="hidden font-medium text-foreground sm:inline">{displayName}</span>
          </Link>
          <NotificationBell />
          <MessagesBell />
        </div>
      </div>
    </header>
  );
}
