'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { AlertCircle, ArrowLeft, Camera, Check, Loader2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getProfile, updateProfile, uploadAvatar, getTags } from '@/api/profile';
import { getCurrentUserUuid } from '@/lib/auth';
import { useToast, ToastContainer } from '@/components/ui/toast';
import { useUnsavedChanges } from '@/components/profile/use-unsaved-changes';
import { UnsavedChangesDialog } from '@/components/profile/unsaved-changes-dialog';
import type { Profile } from '@/types/profile';

type PageState = 'loading' | 'error' | 'unauthorized' | 'editing' | 'saving';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2MB
const MAX_TAGS = 5;

export default function ProfileEditPage() {
  const router = useRouter();
  const { toasts, show: showToast, dismiss: dismissToast } = useToast();

  const [state, setState] = useState<PageState>('loading');
  const [_profile, setProfile] = useState<Profile | null>(null);
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  // 表单状态
  const [nickname, setNickname] = useState('');
  const [bio, setBio] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  // 初始值（用于 isDirty 比较）
  const [initialNickname, setInitialNickname] = useState('');
  const [initialBio, setInitialBio] = useState('');
  const [initialTags, setInitialTags] = useState<string[]>([]);
  const [initialAvatar, setInitialAvatar] = useState<string | null>(null);

  // 昵称校验错误
  const [nicknameError, setNicknameError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const savingRef = useRef(false);

  // isDirty 计算
  const isDirty = useMemo(() => {
    return (
      nickname !== initialNickname ||
      bio !== initialBio ||
      JSON.stringify(selectedTags) !== JSON.stringify(initialTags) ||
      avatarUrl !== initialAvatar
    );
  }, [nickname, bio, selectedTags, avatarUrl, initialNickname, initialBio, initialTags, initialAvatar]);

  // 加载数据
  const fetchData = useCallback(async () => {
    setState('loading');
    try {
      const userUuid = getCurrentUserUuid();
      const [profileData, tags] = await Promise.all([
        getProfile(userUuid),
        getTags(),
      ]);
      setProfile(profileData);
      setAvailableTags(tags);

      // 初始化表单
      const nick = profileData.nickname || '';
      const bioVal = profileData.bio || '';
      const tagsVal = profileData.interestTags || [];
      const avatar = profileData.avatarUrl || null;

      setNickname(nick);
      setBio(bioVal);
      setSelectedTags(tagsVal);
      setAvatarUrl(avatar);

      setInitialNickname(nick);
      setInitialBio(bioVal);
      setInitialTags(tagsVal);
      setInitialAvatar(avatar);

      setState('editing');
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
    fetchData();
  }, [fetchData]);

  // 401 重定向
  useEffect(() => {
    if (state === 'unauthorized') {
      router.replace('/login?callbackUrl=/profile/edit');
    }
  }, [state, router]);

  // 页面标题
  useEffect(() => {
    document.title = 'My Profile - ChinaBuddy';
  }, []);

  // 头像上传处理
  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = ''; // 重置 input 以允许重新选择同一文件
    await doUploadAvatar(file);
  };

  const doUploadAvatar = async (file: File) => {
    // 前端校验：文件类型
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      showToast('Please upload a JPG, PNG, or WebP image', 'error');
      return;
    }
    // 前端校验：文件大小
    if (file.size > MAX_AVATAR_SIZE) {
      showToast('File size must be under 2MB', 'error');
      return;
    }

    setAvatarUploading(true);
    try {
      const userUuid = getCurrentUserUuid();
      const result = await uploadAvatar(userUuid, file);
      setAvatarUrl(result.avatarUrl);
      showToast('Avatar uploaded successfully', 'success');
    } catch {
      showToast('Failed to upload avatar. Please try again.', 'error');
    } finally {
      setAvatarUploading(false);
    }
  };

  // 标签选择
  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) => {
      if (prev.includes(tag)) {
        return prev.filter((t) => t !== tag);
      }
      if (prev.length >= MAX_TAGS) {
        showToast('Maximum 5 tags allowed', 'warning');
        return prev;
      }
      return [...prev, tag];
    });
  };

  // 昵称输入处理
  const handleNicknameChange = (value: string) => {
    // 前端静默过滤 HTML 标签
    const cleaned = value.replace(/<[^>]*>/g, '');
    setNickname(cleaned);
    setNicknameError('');
  };

  // 保存处理
  const handleSave = async () => {
    // 校验昵称
    if (!nickname.trim()) {
      setNicknameError('Nickname is required');
      return;
    }
    if (savingRef.current) return;
    savingRef.current = true;
    setState('saving');

    try {
      const userUuid = getCurrentUserUuid();
      await updateProfile(userUuid, {
        nickname: nickname.trim(),
        bio: bio.trim(),
        interestTags: selectedTags,
      });
      showToast('Profile updated successfully', 'success');
      router.push('/profile');
    } catch {
      showToast('Failed to save changes. Please try again.', 'error', false);
      setState('editing');
    } finally {
      savingRef.current = false;
    }
  };

  // 未保存离开确认
  const { showDialog, tryNavigate, handleKeepEditing, handleDiscard } = useUnsavedChanges(isDirty);

  // 取消处理
  const handleCancel = () => {
    tryNavigate('/profile');
  };

  const isSaving = state === 'saving';

  // loading / unauthorized 状态
  if (state === 'loading' || state === 'unauthorized') {
    return (
      <main className="mx-auto max-w-[480px] px-4 py-8">
        <EditSkeleton />
      </main>
    );
  }

  if (state === 'error') {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-[480px] flex-col items-center justify-center px-4">
        <EditErrorState onRetry={fetchData} />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-[480px] px-4 py-8">
      {/* 返回链接 */}
      <button
        type="button"
        onClick={handleCancel}
        aria-label="Back to profile"
        className="mb-6 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to Profile
      </button>

      <div className="space-y-6">
        {/* 头像上传区域 */}
        <div className="flex flex-col items-center gap-2">
          <div className="relative">
            {avatarUrl ? (
              <div className="relative">
                <Image
                  src={avatarUrl}
                  alt="Profile photo preview"
                  width={96}
                  height={96}
                  className={`h-24 w-24 rounded-full object-cover transition-opacity ${avatarUploading ? 'opacity-50' : 'opacity-100'}`}
                />
                {avatarUploading && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="size-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                  </div>
                )}
              </div>
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-muted">
                <User className="size-10 text-muted-foreground" />
              </div>
            )}
            {/* 悬浮遮罩（仅视觉提示，点击由下方按钮触发） */}
            {!avatarUploading && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                <Camera className="size-6 text-white" />
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={handleAvatarClick}
            className="text-sm text-primary hover:underline"
            disabled={isSaving}
          >
            Change photo
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            aria-label="Upload profile photo"
            onChange={handleFileChange}
            disabled={isSaving}
          />
        </div>

        {/* 昵称输入 */}
        <div className="space-y-1.5">
          <label htmlFor="nickname" className="block text-sm font-medium text-foreground">
            Nickname
          </label>
          <Input
            id="nickname"
            value={nickname}
            onChange={(e) => handleNicknameChange(e.target.value)}
            maxLength={30}
            placeholder="Enter your nickname"
            disabled={isSaving}
            aria-label="Nickname"
            aria-invalid={!!nicknameError}
            aria-describedby={nicknameError ? 'nickname-error' : undefined}
            className={`h-10 ${nicknameError ? 'border-destructive' : ''}`}
          />
          <div className="flex items-center justify-between">
            {nicknameError ? (
              <p id="nickname-error" className="text-xs text-destructive" role="alert">
                {nicknameError}
              </p>
            ) : (
              <span />
            )}
            <span
              className={`text-xs ${nickname.length >= 30 ? 'text-destructive' : nickname.length > 25 ? 'text-accent' : 'text-muted-foreground'}`}
              aria-live="polite"
            >
              {nickname.length}/30
            </span>
          </div>
        </div>

        {/* 简介输入 */}
        <div className="space-y-1.5">
          <label htmlFor="bio" className="block text-sm font-medium text-foreground">
            Bio
          </label>
          <textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={200}
            rows={3}
            placeholder="Tell us about yourself"
            disabled={isSaving}
            aria-label="Bio"
            aria-describedby="bio-counter"
            className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 max-h-[120px]"
          />
          <div className="flex justify-end">
            <span
              id="bio-counter"
              className={`text-xs ${bio.length >= 200 ? 'text-destructive' : bio.length > 180 ? 'text-accent' : 'text-muted-foreground'}`}
              aria-live="polite"
            >
              {bio.length}/200
            </span>
          </div>
        </div>

        {/* 兴趣标签选择器 */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">
            Interests (select up to {MAX_TAGS})
          </p>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Interest tags">
            {availableTags.map((tag) => {
              const isSelected = selectedTags.includes(tag);
              const isDisabled = !isSelected && selectedTags.length >= MAX_TAGS;
              return (
                <button
                  key={tag}
                  type="button"
                  role="checkbox"
                  aria-checked={isSelected}
                  aria-label={tag}
                  onClick={() => handleTagToggle(tag)}
                  disabled={isSaving || isDisabled}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors duration-150 ${
                    isSelected
                      ? 'bg-primary text-primary-foreground'
                      : isDisabled
                        ? 'cursor-not-allowed border border-border bg-muted text-muted-foreground opacity-40'
                        : 'cursor-pointer border border-border bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {isSelected && <Check className="mr-1 inline size-3" />}
                  {tag}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ActionBar */}
      <div className="sticky bottom-0 mt-6 -mx-4 border-t border-border bg-background px-4 py-3 md:static md:border-0 md:bg-transparent md:px-0 md:py-0">
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!isDirty || isSaving}
            aria-busy={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </div>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <UnsavedChangesDialog
        open={showDialog}
        onKeepEditing={handleKeepEditing}
        onDiscard={handleDiscard}
      />
    </main>
  );
}

function EditErrorState({ onRetry }: { onRetry: () => void }) {
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

function EditSkeleton() {
  return (
    <div className="flex flex-col items-center gap-5">
      <div className="h-24 w-24 animate-pulse rounded-full bg-muted" />
      <div className="h-4 w-24 animate-pulse rounded bg-muted" />
      <div className="w-full space-y-2">
        <div className="h-4 w-20 animate-pulse rounded bg-muted" />
        <div className="h-10 w-full animate-pulse rounded-lg bg-muted" />
      </div>
      <div className="w-full space-y-2">
        <div className="h-4 w-12 animate-pulse rounded bg-muted" />
        <div className="h-20 w-full animate-pulse rounded-lg bg-muted" />
      </div>
      <div className="flex flex-wrap gap-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-8 w-24 animate-pulse rounded-full bg-muted" />
        ))}
      </div>
    </div>
  );
}
