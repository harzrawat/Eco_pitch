import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { IndianRupee, Loader2 } from "lucide-react";
import { apiInitiatePayment, apiVerifyPayment } from "../../api/payments.api";
import { loadRazorpayScript } from "../../utils/razorpay";
import { QUERY_KEYS } from "../../constants/skills.constants";
import { parseApiError } from "../../utils/errorParser";
import toast from "react-hot-toast";
import type { InitiatePaymentResponse } from "../../types/payment.types";

interface PaymentButtonProps {
  sessionId: string;
  amount: number;
  skillTitle: string;
  className?: string;
}

// ── Payment Breakdown Modal ───────────────────────────────────────────────────
function PaymentBreakdownModal({
  amount,
  skillTitle,
  onConfirm,
  onCancel,
  loading,
}: {
  amount: number;
  skillTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const platformFee = +(amount * 0.15).toFixed(2);
  const teacherReceives = +(amount - platformFee).toFixed(2);

  function fmt(n: number) {
    return `₹${n.toFixed(2)}`;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm z-10 overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">Payment Summary</h3>
          <p className="text-sm text-gray-500 mt-0.5 truncate">{skillTitle}</p>
        </div>

        {/* Breakdown */}
        <div className="px-6 py-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Session amount</span>
            <span className="font-semibold text-gray-900">{fmt(amount)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Platform fee (15%)</span>
            <span className="text-gray-500">−{fmt(platformFee)}</span>
          </div>
          <div className="border-t border-gray-100 pt-3 flex justify-between text-sm">
            <span className="text-gray-500">Teacher receives</span>
            <span className="font-medium text-green-600">{fmt(teacherReceives)}</span>
          </div>
          <div className="border-t border-dashed border-gray-200 pt-3 flex justify-between">
            <span className="font-semibold text-gray-900">You pay</span>
            <span className="font-bold text-gray-900 text-base">{fmt(amount)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition disabled:opacity-60"
          >
            {loading ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Processing…</>
            ) : (
              <><IndianRupee className="h-4 w-4" /> Proceed to Pay</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── PaymentButton ─────────────────────────────────────────────────────────────
export function PaymentButton({ sessionId, amount, skillTitle, className = "" }: PaymentButtonProps) {
  const queryClient = useQueryClient();
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [razorpayLoading, setRazorpayLoading] = useState(false);

  // Step 5: verify mutation
  const verifyMutation = useMutation({
    mutationFn: apiVerifyPayment,
    onSuccess: () => {
      toast.success("Payment successful!");
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SESSIONS });
      queryClient.invalidateQueries({ queryKey: ["matches"] });
    },
    onError: () => {
      toast.error("Payment verification failed. Contact support.");
    },
    onSettled: () => {
      setRazorpayLoading(false);
    },
  });

  // Step 1–4: initiate + open Razorpay
  function openRazorpay(data: InitiatePaymentResponse) {
    const rzp = new (window as unknown as { Razorpay: new (opts: unknown) => { open: () => void } }).Razorpay({
      key: data.keyId,
      amount: Math.round(data.amount * 100), // paise
      currency: data.currency,
      order_id: data.razorpayOrderId,
      name: "SkillXchange",
      description: "Session Payment",
      handler: async (response: {
        razorpay_order_id: string;
        razorpay_payment_id: string;
        razorpay_signature: string;
      }) => {
        verifyMutation.mutate({
          razorpayOrderId: response.razorpay_order_id,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature,
        });
      },
      modal: {
        ondismiss: () => {
          setRazorpayLoading(false);
        },
      },
    });
    rzp.open();
  }

  const initiateMutation = useMutation({
    mutationFn: () => apiInitiatePayment(sessionId),
    onSuccess: async (data) => {
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        toast.error("Could not load payment page. Try again.");
        setRazorpayLoading(false);
        return;
      }
      openRazorpay(data);
    },
    onError: (err) => {
      const msg = parseApiError(err);
      // Specific 4xx/5xx handling per spec
      if (msg.includes("already")) {
        toast.error("Payment already done. Refresh the page.");
      } else if (msg.includes("not configured")) {
        toast.error("Payment gateway not configured. Contact support.");
      } else if (msg.includes("gateway") || msg.includes("502")) {
        toast.error("Payment gateway error. Try again.");
      } else {
        toast.error(msg);
      }
      setRazorpayLoading(false);
    },
  });

  function handleProceed() {
    setShowBreakdown(false);
    setRazorpayLoading(true);
    initiateMutation.mutate();
  }

  const isLoading = razorpayLoading || initiateMutation.isPending || verifyMutation.isPending;

  return (
    <>
      <button
        onClick={() => setShowBreakdown(true)}
        disabled={isLoading}
        className={`flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-500 transition disabled:opacity-60 ${className}`}
      >
        {isLoading ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Processing…</>
        ) : (
          <><IndianRupee className="h-4 w-4" /> Pay Now</>
        )}
      </button>

      {showBreakdown && (
        <PaymentBreakdownModal
          amount={amount}
          skillTitle={skillTitle}
          loading={isLoading}
          onConfirm={handleProceed}
          onCancel={() => setShowBreakdown(false)}
        />
      )}
    </>
  );
}
