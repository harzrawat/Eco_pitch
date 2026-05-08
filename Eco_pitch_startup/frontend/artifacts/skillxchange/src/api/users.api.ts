import { axiosInstance } from "./axiosInstance";
import type { User } from "../types/user.types";
import type { Skill } from "../types/skill.types";

// GET /api/users/:id — public profile (no email returned)
export async function apiGetUserProfile(userId: string): Promise<User> {
  const res = await axiosInstance.get<{ success: boolean; data: User }>(
    `/api/users/${userId}`
  );
  return res.data.data;
}

// GET /api/users/:id/skills — user's active skills (no pagination)
export async function apiGetUserSkills(userId: string): Promise<Skill[]> {
  const res = await axiosInstance.get<{ success: boolean; data: Skill[] }>(
    `/api/users/${userId}/skills`
  );
  return res.data.data;
}

export interface UpdateProfilePayload {
  name?: string;
  bio?: string;
  avatar_url?: string;
  college?: string;
  city?: string;
  // NOTE: email, password, credits, is_premium are NOT allowed — backend silently ignores them
}

// PUT /api/users/:id — owner only (JWT must match userId)
export async function apiUpdateUserProfile(
  userId: string,
  payload: UpdateProfilePayload
): Promise<User> {
  const res = await axiosInstance.put<{ success: boolean; data: User }>(
    `/api/users/${userId}`,
    payload
  );
  if (res.data.success) return res.data.data;
  throw new Error("Failed to update profile");
}
