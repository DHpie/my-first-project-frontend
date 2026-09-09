import request from './request';
import type { Result, User, UserCreateRequest, UserUpdateRequest } from '../types/user';

export async function getUsers(): Promise<User[]> {
  const response = await request.get<Result<User[]>>('/api/users');
  return response.data.data;
}

export async function getUserById(id: number): Promise<User> {
  const response = await request.get<Result<User>>(`/api/users/${id}`);
  return response.data.data;
}

export async function createUser(data: UserCreateRequest): Promise<User> {
  const response = await request.post<Result<User>>('/api/users', data);
  return response.data.data;
}

export async function updateUser(id: number, data: UserUpdateRequest): Promise<User> {
  const response = await request.put<Result<User>>(`/api/users/${id}`, data);
  return response.data.data;
}

export async function deleteUser(id: number): Promise<void> {
  await request.delete<Result<void>>(`/api/users/${id}`);
}
