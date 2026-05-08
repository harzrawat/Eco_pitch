import { axiosInstance } from "./axiosInstance";
import type { Match, MyMatchesResponse, CompleteSessionResponse } from "../types/match.types";

export interface MyMatchesFilters {
  role?: "teacher" | "learner";
  status?: "pending" | "accepted" | "rejected" | "completed";
}

export interface CreateMatchPayload {
  skillId: string;
  sessionType: "credit" | "paid";
}

// POST /api/matches — learner sends match request to teacher (via skill)
export async function apiCreateMatch(payload: CreateMatchPayload): Promise<Match> {
  const res = await axiosInstance.post<{ success: boolean; data: Match }>(
    "/api/matches",
    payload
  );
  if (res.data.success) return res.data.data;
  throw new Error("Failed to create match");
}

// GET /api/matches/me?role=&status=
export async function apiGetMyMatches(filters: MyMatchesFilters = {}): Promise<Match[]> {
  const params: Record<string, string> = {};
  if (filters.role) params.role = filters.role;
  if (filters.status) params.status = filters.status;

  const res = await axiosInstance.get<MyMatchesResponse>("/api/matches/me", { params });
  return res.data.data;
}

// PUT /api/matches/:id/respond — teacher accepts or rejects
export async function apiRespondToMatch(
  matchId: string,
  action: "accepted" | "rejected"
): Promise<void> {
  await axiosInstance.put(`/api/matches/${matchId}/respond`, { action });
}

// PUT /api/sessions/:id/complete — either teacher or learner can complete
// Credit sessions: auto-transfers credits on backend
export async function apiCompleteSession(
  sessionId: string
): Promise<CompleteSessionResponse> {
  const res = await axiosInstance.put<{ success: boolean; data: CompleteSessionResponse }>(
    `/api/sessions/${sessionId}/complete`
  );
  return res.data.data;
}
