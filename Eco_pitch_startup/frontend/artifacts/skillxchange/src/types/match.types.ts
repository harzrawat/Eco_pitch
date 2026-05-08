export type MatchStatus = "pending" | "accepted" | "rejected" | "completed";
export type SessionType = "credit" | "paid";
export type MatchRole = "teacher" | "learner";

export interface Match {
  matchId: string;
  status: MatchStatus;
  sessionType: SessionType;
  skill: {
    skillId: string;
    title: string;
    creditsPerSession: number | null;
  } | null;
  teacher: {
    userId: string;
    name: string;
    avatarUrl: string | null;
  } | null;
  learner: {
    userId: string;
    name: string;
    avatarUrl: string | null;
  } | null;
  createdAt: string;
  session?: {
    sessionId: string;
    status: string;
    completedAt?: string | null;
    creditsTransferred?: number | null;
  } | null;
}

export interface MyMatchesResponse {
  success: boolean;
  data: Match[];
  total: number;
}

export interface CompleteSessionResponse {
  sessionId: string;
  status: string;
  completedAt: string;
  creditsTransferred: number | null;
}
