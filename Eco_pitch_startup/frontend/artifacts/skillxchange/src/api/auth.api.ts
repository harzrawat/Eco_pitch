import { axiosInstance } from "./axiosInstance";
import type { AuthResponse, User } from "../types/user.types";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export async function apiLogin(payload: LoginPayload): Promise<AuthResponse> {
  const res = await axiosInstance.post<{ success: boolean; data: AuthResponse }>(
    "/api/auth/login",
    { ...payload, email: payload.email.toLowerCase().trim() }
  );
  if (res.data.success) return res.data.data;
  throw new Error("Login failed");
}

export async function apiRegister(payload: RegisterPayload): Promise<AuthResponse> {
  const res = await axiosInstance.post<{ success: boolean; data: AuthResponse }>(
    "/api/auth/register",
    {
      name: payload.name.trim(),
      email: payload.email.toLowerCase().trim(),
      password: payload.password,
    }
  );
  if (res.data.success) return res.data.data;
  throw new Error("Registration failed");
}

export async function apiGetMe(): Promise<User> {
  const res = await axiosInstance.get<{ success: boolean; data: User }>("/api/auth/me");
  if (res.data.success) return res.data.data;
  throw new Error("Failed to fetch user");
}
