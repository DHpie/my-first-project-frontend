'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { AlertCircle, Loader2, Pencil, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getProfile } from '@/api/profile';
import { getCurrentUserUuid } from '@/lib/auth';
import type { Profile } from '@/types/profile';

type PageState = 'loading' | 'error' | 'unauthorized' | 'data';

export default function ProfilePage() {
  const router = useRouter();
  const [state, setState] = useState<PageState>('loading');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [avatarFailed, setAvatarFailed] = useState(false);

  const fetchProfile = useCallback(async () => {
    setState('loading');
    setAvatarFailed(false);
    try {
      const userUuid = getCurrentUserUuid();
      const data = await getProfile(userUuid);
      setProfile(data);
      setState('data');
    } catch (err) {
      const message = (err as Error).message || '';
      if (message.includes('401') || message.includes('Unauthorized')) {
        setState('unauthorized');
      } else {
        setState('error');
      }
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // 401 时重定向到登录页
  useEffect(() => {
    if (state === 'unauthorized') {
      router.replace('/login?callbackUrl=/profile');
    }
  }, [state, router]);

  // 设置页面标题
  useEffect(() => {
    document.title = 'My Profile - ChinaBuddy';
  }, []);

  // loading �?unauthorized 时不渲染内容
  if (state === 'loading' || state === 'unauthorized') {
    return (
      <main id="main-content" tabIndex={-1} className="mx-auto max-w-[480px] px-4 py-8 md:max-w-[640px]" aria-label="My Profile">
        <ProfileSkeleton />
      </main>
    );
  }

  if (state === 'error') {
    return (
      <main id="main-content" tabIndex={-1} className="mx-auto flex min-h-[60vh] max-w-[480px] flex-col items-center justify-center px-4 md:max-w-[640px]" aria-label="My Profile">
        <ErrorState onRetry={fetchProfile} />
      </main>
    );
  }

  if (!profile) return null;

  const displayName = profile.nickname || 'Anonymous';
  const hasAvatar = profile.avatarUrl && !avatarFailed;

  return (
    <main id="main-content" tabIndex={-1} className="mx-auto max-w-[480px] px-4 py-8 md:max-w-[640px]" aria-label="My Profile">
      <div className="flex flex-col items-center gap-6">
        {/* 头像 */}
        {hasAvatar ? (
          <Image
            src={profile.avatarUrl!}
            alt={`${displayName}'s profile photo`}
            width={96}
            height={96}
            className="h-20 w-20 rounded-full object-cover ring-2 ring-border md:h-24 md:w-24"
            onError={() => setAvatarFailed(true)}
          />
        ) : (
          <div
            className="flex h-20 w-20 items-center justify-center rounded-full bg-muted md:h-24 md:w-24"
            aria-hidden="true"
          >
            <User className="size-8 text-muted-foreground md:size-10" />
          </div>
        )}

        {/* 昵称 */}
        {profile.nickname ? (
          <h1 className="text-center text-xl font-bold text-foreground">{displayName}</h1>
        ) : (
          <h1 className="text-center text-xl italic text-muted-foreground">Anonymous</h1>
        )}

        {/* 简�?*/}
        <div className="w-full text-center">
          {profile.bio ? (
            <p className="mx-auto max-w-[400px] text-sm text-muted-foreground whitespace-pre-line">
              {profile.bio}
            </p>
          ) : (
            <p className="text-sm italic text-muted-foreground">No bio yet</p>
          )}
        </div>

        {/* 兴趣标签 */}
        <div className="w-full">
          {profile.interestTags && profile.interestTags.length > 0 ? (
            <div
              className="flex flex-wrap justify-center gap-2"
              role="group"
              aria-label="Interest tags"
            >
              {profile.interestTags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-center text-sm italic text-muted-foreground">No interests yet</p>
          )}
        </div>

        {/* 编辑按钮 */}
        <Button variant="outline" render={<Link href="/profile/edit" aria-label="Edit profile" />}>
          <Pencil className="size-4" />
          Edit Profile
        </Button>
      </div>
    </main>
  );
}

function ProfileSkeleton() {
  return (
    <div className="flex flex-col items-center gap-5">
      <div className="h-20 w-20 animate-pulse rounded-full bg-muted md:h-24 md:w-24" />
      <div className="h-5 w-32 animate-pulse rounded bg-muted" />
      <div className="w-full space-y-2">
        <div className="mx-auto h-4 w-full animate-pulse rounded bg-muted" />
        <div className="mx-auto h-4 w-3/5 animate-pulse rounded bg-muted" />
      </div>
      <div className="flex gap-2">
        <div className="h-6 w-20 animate-pulse rounded-full bg-muted" />
        <div className="h-6 w-20 animate-pulse rounded-full bg-muted" />
        <div className="h-6 w-20 animate-pulse rounded-full bg-muted" />
      </div>
      <div className="h-8 w-28 animate-pulse rounded-lg bg-muted" />
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  const [retrying, setRetrying] = useState(false);

  const handleRetry = async () => {
    setRetrying(true);
    await onRetry();
    setRetrying(false);
  };

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <AlertCircle className="size-12 text-muted-foreground" />
      <div>
        <p className="text-base font-medium text-foreground">Something went wrong</p>
        <p className="mt-1 text-sm text-muted-foreground">Could not load your profile</p>
      </div>
      <Button variant="outline" onClick={handleRetry} disabled={retrying}>
        {retrying ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Retrying...
          </>
        ) : (
          'Retry'
        )}
      </Button>
    </div>
  );
}
