'use client';

import { useState, useEffect, useCallback } from 'react';
import { getCurrentUserUuid } from './auth';

interface AuthState {
  /** 当前用户 UUID（模拟登录：从 localStorage 读取） */
  userId: string | null;
  /** 是否已登录（模拟阶段始终为 true） */
  isLoggedIn: boolean;
  /** 重新检查登录状态 */
  refresh: () => void;
}

/**
 * 简单的认证 Hook。
 * 当前阶段使用 localStorage 中的 UUID 模拟登录状态，
 * 后续替换为真实认证系统（/api/auth/me + session cookie）。
 */
export function useAuth(): AuthState {
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const refresh = useCallback(() => {
    const uuid = getCurrentUserUuid();
    setUserId(uuid);
    setIsLoggedIn(!!uuid);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { userId, isLoggedIn, refresh };
}
