// 简易认证辅助模块
// 当前阶段使用 localStorage 存储用户 UUID，后续替换为真实认证系统
const CURRENT_USER_KEY = 'chinaBuddy_currentUserUuid';

// 演示用默认用户 UUID（可通过 localStorage 覆盖）
const DEMO_USER_UUID = '00000000-0000-0000-0000-000000000001';

export function getCurrentUserUuid(): string {
  if (typeof window === 'undefined') return DEMO_USER_UUID;
  return localStorage.getItem(CURRENT_USER_KEY) || DEMO_USER_UUID;
}

export function setCurrentUserUuid(uuid: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CURRENT_USER_KEY, uuid);
}

export function clearCurrentUser(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(CURRENT_USER_KEY);
}
