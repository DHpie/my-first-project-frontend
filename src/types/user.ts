export interface User {
  id: number;
  username: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface Result<T> {
  code: number;
  message: string;
  data: T;
}

export interface UserCreateRequest {
  username: string;
  email: string;
}

export interface UserUpdateRequest {
  username?: string;
  email?: string;
}
