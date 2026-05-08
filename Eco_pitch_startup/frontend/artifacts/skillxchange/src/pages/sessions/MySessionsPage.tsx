import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Calendar, Coins, IndianRupee, CheckCircle, AlertCircle } from "lucide-react";
import { apiGetMyMatches, apiCompleteSession } from "../../api/matches.api";
import { apiGetMe } from "../../api/auth.api";
import { PaymentButton } from "../../components/payments/PaymentButton";
import { AppShell } from "../../components/layout/AppShell";
import { EmptyState } from "../../components/shared/EmptyState";
import { QUERY_KEYS } from "../../constants/skills.constants";
import { useAuthStore } from "../../store/authStore";
import { parseApiError } from "../../utils/errorParser";
import toast from "react-hot-toast";
import type { Match } from "../../types/match.types";

// ── Confirm Dialog ────────────────────────────────────────────────────────────
function ConfirmDialog({
  message,
  onConfirm,
  onCancel,
  loading,
}: {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm z-10">
        <p className="text-sm text-gray-700 mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition disabled:opacity-60"
          >
            {loading ? "Completing..." : "Mark Complete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Mini Avatar ───────────────────────────────────────────────────────────────
function MiniAvatar({ name, url }: { name: string; url?: string | null }) {
  if (url) return <img src={url} alt={name} className="w-7 h-7 rounded-full object-cover" />;
  return (
    <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
      {name?.[0]?.toUpperCase() ?? "?"}
    </div>
  );
}

// ── SessionCard ───────────────────────────────────────────────────────────────
function SessionCard({
  match,
  currentUserId,
  onComplete,
}: {
  match: Match;
  currentUserId: string;
  onComplete: (sessionId: string, skillTitle: string) => void;
}) {
  const isScheduled = match.session?.status === "scheduled";
  const isCompleted = match.session?.status === "completed" || match.status === "completed";
  const isLearner = match.learner?.userId === currentUserId;

  const completedAt = match.session?.completedAt
    ? new Date(match.session.completedAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-gray-900 text-base leading-tight">
            {match.skill?.title ?? "Unknown Skill"}
          </p>
          {completedAt && (
            <p className="text-xs text-gray-400 mt-0.5">Completed {completedAt}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* Session type + amount */}
          {match.sessionType === "credit" ? (
            <span className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
              <Coins className="h-3 w-3" />
              {match.skill?.creditsPerSession ?? "?"} credits
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200">
              <IndianRupee className="h-3 w-3" />
              Paid
            </span>
          )}
          {/* Status badge */}
          <span
            className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
              isCompleted
                ? "bg-gray-100 text-gray-600 border-gray-200"
                : "bg-blue-100 text-blue-700 border-blue-200"
            }`}
          >
            {isCompleted ? "Completed" : "Scheduled"}
          </span>
        </div>
      </div>

      {/* Participants */}
      <div className="flex flex-wrap gap-4">
        {match.teacher && (
          <div className="flex items-center gap-2">
            <MiniAvatar name={match.teacher.name} url={match.teacher.avatarUrl} />
            <div>
              <p className="text-xs text-gray-400">Teacher</p>
              <p className="text-sm font-medium text-gray-800">{match.teacher.name}</p>
            </div>
          </div>
        )}
        {match.learner && (
          <div className="flex items-center gap-2">
            <MiniAvatar name={match.learner.name} url={match.learner.avatarUrl} />
            <div>
              <p className="text-xs text-gray-400">Learner</p>
              <p className="text-sm font-medium text-gray-800">{match.learner.name}</p>
            </div>
          </div>
        )}
      </div>

      {/* Credits transferred display */}
      {isCompleted && match.session?.creditsTransferred != null && (
        <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
          <Coins className="h-4 w-4 text-amber-500 shrink-0" />
          <p className="text-sm font-medium text-amber-700">
            {match.session.creditsTransferred} credits transferred
          </p>
        </div>
      )}

      {/* Learner balance warning for credit sessions */}
      {isScheduled && match.sessionType === "credit" && isLearner && (
        <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
          <Coins className="h-3.5 w-3.5 text-gray-400 shrink-0" />
          Make sure you have enough credits to complete this session
        </div>
      )}

      {/* Actions */}
      {isScheduled && match.session?.sessionId && (
        <div className="flex gap-2 pt-1">
          {/* Pay Now — paid sessions, learner only */}
          {match.sessionType === "paid" && isLearner && (
            <PaymentButton
              sessionId={match.session.sessionId}
              amount={match.skill?.creditsPerSession ?? 0}
              skillTitle={match.skill?.title ?? "Session"}
              className="flex-1"
            />
          )}
          {/* Mark Complete */}
          <button
            onClick={() => onComplete(match.session!.sessionId, match.skill?.title ?? "session")}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-white px-4 py-2 text-sm font-semibold text-indigo-600 hover:bg-indigo-50 transition"
          >
            <CheckCircle className="h-4 w-4" />
            Mark Complete
          </button>
        </div>
      )}
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function SessionCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
      <div className="flex justify-between mb-4">
        <div className="h-5 w-40 rounded bg-gray-200" />
        <div className="flex gap-2">
          <div className="h-5 w-16 rounded-full bg-gray-200" />
          <div className="h-5 w-20 rounded-full bg-gray-200" />
        </div>
      </div>
      <div className="flex gap-4 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gray-200" />
          <div className="h-4 w-20 rounded bg-gray-200" />
        </div>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gray-200" />
          <div className="h-4 w-20 rounded bg-gray-200" />
        </div>
      </div>
      <div className="h-9 rounded-lg bg-gray-200" />
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
type SessionTab = "scheduled" | "completed";

export default function MySessionsPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<SessionTab>("scheduled");
  const [confirmSession, setConfirmSession] = useState<{
    sessionId: string;
    skillTitle: string;
  } | null>(null);

  // Sessions = accepted matches that have a session object
  const { data: acceptedMatches, isLoading, isError, refetch } = useQuery({
    queryKey: [...QUERY_KEYS.SESSIONS, "accepted"],
    queryFn: () => apiGetMyMatches({ status: "accepted" }),
  });

  const { data: completedMatches, isLoading: completedLoading } = useQuery({
    queryKey: [...QUERY_KEYS.SESSIONS, "completed"],
    queryFn: () => apiGetMyMatches({ status: "completed" }),
  });

  const { setUser } = useAuthStore();

  const completeMutation = useMutation({
    mutationFn: (sessionId: string) => apiCompleteSession(sessionId),
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SESSIONS });
      queryClient.invalidateQueries({ queryKey: ["matches"] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CREDIT_BALANCE });
      // Refresh auth store so credits badge in navbar updates immediately
      try {
        const freshUser = await apiGetMe();
        setUser(freshUser);
      } catch {
        // Non-critical — credits badge will update on next page load
      }
      if (data.creditsTransferred != null) {
        toast.success(`${data.creditsTransferred} credits transferred!`);
      } else {
        toast.success("Session marked as complete!");
      }
      setConfirmSession(null);
    },
    onError: (err) => {
      toast.error(parseApiError(err));
      setConfirmSession(null);
    },
  });

  const scheduledSessions = (acceptedMatches ?? []).filter(
    (m) => m.session && m.session.status === "scheduled"
  );
  const completedSessions = (completedMatches ?? []).filter(
    (m) => m.status === "completed"
  );

  const displayList = tab === "scheduled" ? scheduledSessions : completedSessions;
  const displayLoading = tab === "scheduled" ? isLoading : completedLoading;

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Sessions</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Track and complete your skill sessions
            </p>
          </div>
          {user && (
            <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 text-sm font-medium px-3 py-1.5 rounded-full">
              <Coins className="h-4 w-4" />
              {user.credits} credits
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
          {(["scheduled", "completed"] as SessionTab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition capitalize ${
                tab === t
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t === "scheduled" ? "Scheduled" : "Completed"}
            </button>
          ))}
        </div>

        {/* Content */}
        {displayLoading && (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => <SessionCardSkeleton key={i} />)}
          </div>
        )}

        {isError && tab === "scheduled" && (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <AlertCircle className="h-8 w-8 text-red-400" />
            <p className="text-sm text-gray-600">Failed to load sessions.</p>
            <button onClick={() => refetch()} className="text-sm font-medium text-indigo-600 hover:text-indigo-500">Retry</button>
          </div>
        )}

        {!displayLoading && displayList.length === 0 && (
          <EmptyState
            icon={Calendar}
            title={tab === "scheduled" ? "No scheduled sessions" : "No completed sessions"}
            description={
              tab === "scheduled"
                ? "Accepted matches will appear here as scheduled sessions."
                : "Completed sessions will show up here."
            }
          />
        )}

        {!displayLoading && displayList.length > 0 && (
          <div className="space-y-3">
            {displayList.map((match) => (
              <SessionCard
                key={match.matchId}
                match={match}
                currentUserId={user?.id ?? ""}
                onComplete={(sessionId, skillTitle) =>
                  setConfirmSession({ sessionId, skillTitle })
                }
              />
            ))}
          </div>
        )}
      </div>

      {confirmSession && (
        <ConfirmDialog
          message={`Mark "${confirmSession.skillTitle}" session as complete? Credits will be transferred automatically for credit sessions.`}
          loading={completeMutation.isPending}
          onConfirm={() => completeMutation.mutate(confirmSession.sessionId)}
          onCancel={() => setConfirmSession(null)}
        />
      )}
    </AppShell>
  );
}
