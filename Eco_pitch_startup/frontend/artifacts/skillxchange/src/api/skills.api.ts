import { axiosInstance } from "./axiosInstance";
import type {
  Skill,
  SkillFilters,
  SkillsListResponse,
  CreateSkillPayload,
  SkillRequest,
  SkillRequestsListResponse,
} from "../types/skill.types";

// GET /api/skills?q=&category=&mode=&page=&limit=
export async function apiListSkills(filters: SkillFilters = {}): Promise<SkillsListResponse> {
  const res = await axiosInstance.get<SkillsListResponse>("/api/skills", { params: filters });
  // Backend wraps list in { success, data, total, page, pages }
  // The entire response.data IS the SkillsListResponse shape
  return res.data;
}

// GET /api/skills/:id
export async function apiGetSkill(id: string): Promise<Skill> {
  const res = await axiosInstance.get<{ success: boolean; data: Skill }>(`/api/skills/${id}`);
  return res.data.data;
}

// POST /api/skills
export async function apiCreateSkill(payload: CreateSkillPayload): Promise<Skill> {
  const res = await axiosInstance.post<{ success: boolean; data: Skill }>("/api/skills", payload);
  if (res.data.success) return res.data.data;
  throw new Error("Failed to create skill");
}

// PUT /api/skills/:id
export async function apiUpdateSkill(
  id: string,
  payload: Partial<CreateSkillPayload>
): Promise<Skill> {
  const res = await axiosInstance.put<{ success: boolean; data: Skill }>(
    `/api/skills/${id}`,
    payload
  );
  if (res.data.success) return res.data.data;
  throw new Error("Failed to update skill");
}

// DELETE /api/skills/:id  (soft delete — sets is_active: false)
export async function apiDeleteSkill(id: string): Promise<void> {
  await axiosInstance.delete(`/api/skills/${id}`);
}

// GET /api/skill-requests?q=&category=&page=&limit=
export async function apiListSkillRequests(
  filters: SkillFilters = {}
): Promise<SkillRequestsListResponse> {
  const res = await axiosInstance.get<SkillRequestsListResponse>("/api/skill-requests", {
    params: filters,
  });
  return res.data;
}

// POST /api/skill-requests
export async function apiCreateSkillRequest(payload: {
  title: string;
  description?: string;
  category?: string;
}): Promise<SkillRequest> {
  const res = await axiosInstance.post<{ success: boolean; data: SkillRequest }>(
    "/api/skill-requests",
    payload
  );
  if (res.data.success) return res.data.data;
  throw new Error("Failed to create skill request");
}
