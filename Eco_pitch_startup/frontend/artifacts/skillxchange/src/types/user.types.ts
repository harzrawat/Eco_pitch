export interface User {
  id: string;
  name: string;
  email: string;
  bio: string | null;
  avatar_url: string | null;
  college: string | null;
  city: string | null;
  credits: number;
  is_premium: boolean;
  created_at: string;
}

export interface LoginUser {
  id: string;
  name: string;
  email: string;
  credits: number;
}

export interface AuthResponse {
  token: string;
  user: LoginUser;
}
