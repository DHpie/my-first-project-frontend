'use client';

import { useEffect, useCallback, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

/**
 * 未保存离开确认 hook
 * 拦截浏览器后退/刷新（beforeunload）和应用内导航（Cancel / Back to Profile）
 */
export function useUnsavedChanges(isDirty: boolean) {
  const router = useRouter();
  const [showDialog, setShowDialog] = useState(false);
  const pendingPathRef = useRef<string | null>(null);
  const isDirtyRef = useRef(isDirty);

  // 保持 ref 同步
  useEffect(() => {
    isDirtyRef.current = isDirty;
  }, [isDirty]);

  // beforeunload：浏览器关闭/刷新拦截
  useEffect(() => {
    if (!isDirty) return;

    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };

    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  // 浏览器后退拦截：通过 pushState + popstate 实现
  useEffect(() => {
    if (!isDirty) return;

    // 推入一个额外的 history entry，使后退时触发 popstate
    window.history.pushState(null, '', window.location.href);

    const handlePopState = () => {
      if (isDirtyRef.current) {
        // 用户按了后退键，重新推入 entry 以阻止实际导航
        window.history.pushState(null, '', window.location.href);
        setShowDialog(true);
        pendingPathRef.current = '/profile';
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isDirty]);

  // 触发导航确认（Cancel / Back to Profile 调用）
  const tryNavigate = useCallback(
    (path: string) => {
      if (isDirtyRef.current) {
        pendingPathRef.current = path;
        setShowDialog(true);
      } else {
        router.push(path);
      }
    },
    [router],
  );

  // Keep editing：关闭对话框，留在编辑页
  const handleKeepEditing = useCallback(() => {
    setShowDialog(false);
    pendingPathRef.current = null;
  }, []);

  // Discard：关闭对话框，导航到目标页面
  const handleDiscard = useCallback(() => {
    setShowDialog(false);
    const path = pendingPathRef.current;
    pendingPathRef.current = null;
    if (path) {
      router.push(path);
    }
  }, [router]);

  return {
    showDialog,
    tryNavigate,
    handleKeepEditing,
    handleDiscard,
  };
}
