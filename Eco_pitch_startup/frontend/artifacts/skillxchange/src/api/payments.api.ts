import { axiosInstance } from "./axiosInstance";
import type {
  InitiatePaymentResponse,
  VerifyPaymentRequest,
  VerifyPaymentResponse,
} from "../types/payment.types";

export async function apiInitiatePayment(
  sessionId: string
): Promise<InitiatePaymentResponse> {
  const res = await axiosInstance.post<{ success: boolean; data: InitiatePaymentResponse }>(
    "/api/payments/initiate",
    { sessionId }
  );
  return res.data.data;
}

export async function apiVerifyPayment(
  body: VerifyPaymentRequest
): Promise<VerifyPaymentResponse> {
  const res = await axiosInstance.post<{ success: boolean; data: VerifyPaymentResponse }>(
    "/api/payments/verify",
    body
  );
  return res.data.data;
}
