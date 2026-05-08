import { axiosInstance } from "./axiosInstance";
import type { CreditBalance, CreditHistoryResponse } from "../types/credit.types";

export async function apiGetCreditBalance(): Promise<CreditBalance> {
  const res = await axiosInstance.get<{ success: boolean; data: CreditBalance }>(
    "/api/credits/balance"
  );
  return res.data.data;
}

export async function apiGetCreditHistory(
  page = 1,
  limit = 20
): Promise<CreditHistoryResponse> {
  const res = await axiosInstance.get<CreditHistoryResponse>("/api/credits/history", {
    params: { page, limit },
  });
  return res.data;
}
