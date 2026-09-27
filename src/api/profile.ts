import request from './request';
import type { Result } from '../types/user';
import type { Profile, ProfileUpdateRequest, AvatarUploadResponse } from '../types/profile';

// 获取当前用户资料
export async function getProfile(userUuid: string, signal?: AbortSignal): Promise<Profile> {
  const response = await request.get<Result<Profile>>('/api/profile', {
    params: { uuid: userUuid },
    signal,
  });
  return response.data.data;
}

// 更新用户资料
export async function updateProfile(
  userUuid: string,
  data: ProfileUpdateRequest,
): Promise<Profile> {
  const response = await request.put<Result<Profile>>('/api/profile', data, {
    params: { uuid: userUuid },
  });
  return response.data.data;
}

// 上传头像
export async function uploadAvatar(userUuid: string, file: File): Promise<AvatarUploadResponse> {
  const formData = new FormData();
  formData.append('file', file);
  const response = await request.post<Result<AvatarUploadResponse>>('/api/profile/avatar', formData, {
    params: { uuid: userUuid },
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data.data;
}

// 获取预定义兴趣标签列表
export async function getTags(signal?: AbortSignal): Promise<string[]> {
  const response = await request.get<Result<string[]>>('/api/profile/tags', { signal });
  return response.data.data;
}
