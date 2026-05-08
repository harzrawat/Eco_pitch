export interface Skill {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: string | null;
  mode: string | null;
  credits_per_session: number | null;
  price_per_session: number | null;
  is_active: boolean;
  created_at: string;
  teacher?: {
    id: string;
    name: string;
    avatar_url: string | null;
    college: string | null;
    city: string | null;
  };
}

export interface SkillsListResponse {
  success: boolean;
  data: Skill[];
  total: number;
  page: number;
  pages: number;
}

export interface SkillFilters {
  q?: string;
  category?: string;
  mode?: string;
  page?: number;
  limit?: number;
}

export interface CreateSkillPayload {
  title: string;
  description?: string;
  category?: string;
  mode?: string;
  credits_per_session?: number | null;
  price_per_session?: number | null;
}

export interface SkillRequest {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: string | null;
  created_at: string;
  user?: {
    id: string;
    name: string;
    avatar_url: string | null;
  };
}

export interface SkillRequestsListResponse {
  success: boolean;
  data: SkillRequest[];
  total: number;
  page: number;
  pages: number;
}
