export interface User {
  uuid: string;
  username: string;
  email: string;
  nickname: string | null;
  bio: string | null;
  avatarUrl: string | null;
  interestTags: string[];
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
