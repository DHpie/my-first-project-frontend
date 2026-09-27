'use client';

import { useState, useEffect, useCallback } from 'react';

interface AuthState {
  /** 当前用户 ID（后端 session/cookie 管理） */
  userId: string | null;
  /** 是否已登录 */
  isLoggedIn: boolean;
  /** 重新检查登录状态 */
  refresh: () => void;
}

/**
 * 简单的认证 Hook。
 * 通过请求 /api/auth/me 检查当前登录状态。
 * 后端通过 session cookie 管理认证。
 */
export function useAuth(): AuthState {
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const refresh = useCallback(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error('Not authenticated');
      })
      .then((data) => {
        // 后端返回 { code: 200, data: { uuid: "..." } }
        const id = data?.data?.uuid ?? data?.uuid ?? null;
        setUserId(id);
        setIsLoggedIn(!!id);
      })
      .catch(() => {
        setUserId(null);
        setIsLoggedIn(false);
      });
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { userId, isLoggedIn, refresh };
}
