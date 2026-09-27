export interface Profile {
  id: string;
  username: string;
  email: string;
  nickname: string | null;
  bio: string | null;
  avatarUrl: string | null;
  interestTags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ProfileUpdateRequest {
  nickname?: string;
  bio?: string;
  interestTags?: string[];
}

export interface AvatarUploadResponse {
  avatarUrl: string;
}
