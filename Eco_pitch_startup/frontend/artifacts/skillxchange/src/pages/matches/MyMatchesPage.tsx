import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { GitMerge, RefreshCw, AlertCircle, Coins, IndianRupee } from "lucide-react";
import { apiGetMyMatches, apiRespondToMatch } from "../../api/matches.api";
import { AppShell } from "../../components/layout/AppShell";
import { EmptyState } from "../../components/shared/EmptyState";
import { QUERY_KEYS } from "../../constants/skills.constants";
import { useAuthStore } from "../../store/authStore";
import { parseApiError } from "../../utils/errorParser";
import toast from "react-hot-toast";
import type { Match, MatchStatus, MatchRole } from "../../types/match.types";

// ── Status badge ─────────────────────────────────────────────────────────────
const STATUS_STYLES: Record<MatchStatus, string> = {
  pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
  accepted: "bg-green-100 text-green-700 border-green-200",
  rejected: "bg-red-100 text-red-700 border-red-200",
  completed: "bg-gray-100 text-gray-600 border-gray-200",
};
const STATUS_LABELS: Record<MatchStatus, string> = {
  pending: "Pending",
  accepted: "Accepted",
  rejected: "Rejected",
  completed: "Completed",
};

function StatusBadge({ status }: { status: MatchStatus }) {
  return (
    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${STATUS_STYLES[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}

// ── Avatar ────────────────────────────────────────────────────────────────────
function MiniAvatar({ name, url }: { name: string; url?: string | null }) {
  if (url) return <img src={url} alt={name} className="w-7 h-7 rounded-full object-cover" />;
  return (
    <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
      {name?.[0]?.toUpperCase() ?? "?"}
    </div>
  );
}

// ── Confirm Dialog ────────────────────────────────────────────────────────────
function ConfirmDialog({
  message,
  onConfirm,
  onCancel,
  loading,
  confirmLabel = "Confirm",
  variant = "danger",
}: {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
  confirmLabel?: string;
  variant?: "danger" | "default";
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
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-60 ${variant === "danger" ? "bg-red-600 hover:bg-red-500" : "bg-indigo-600 hover:bg-indigo-500"}`}
          >
            {loading ? "..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── MatchCard ─────────────────────────────────────────────────────────────────
function MatchCard({
  match,
  currentUserId,
  onRespond,
}: {
  match: Match;
  currentUserId: string;
  onRespond: (matchId: string, action: "accepted" | "rejected") => void;
}) {
  const isTeacher = match.teacher?.userId === currentUserId;
  const isPending = match.status === "pending";
  const isAccepted = match.status === "accepted";

  const date = new Date(match.createdAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-4">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-gray-900 text-base leading-tight">
            {match.skill?.title ?? "Unknown Skill"}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">{date}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* Session type */}
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
          <StatusBadge status={match.status} />
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

      {/* Action buttons */}
      {isTeacher && isPending && (
        <div className="flex gap-2 pt-1">
          <button
            aria-label={`Accept match for ${match.skill?.title}`}
            onClick={() => onRespond(match.matchId, "accepted")}
            className="flex-1 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition"
          >
            Accept
          </button>
          <button
            aria-label={`Reject match for ${match.skill?.title}`}
            onClick={() => onRespond(match.matchId, "rejected")}
            className="flex-1 rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 transition"
          >
            Reject
          </button>
        </div>
      )}

      {isAccepted && match.session && (
        <div className="pt-1">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg">
            Session scheduled — go to My Sessions to complete
          </span>
        </div>
      )}
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function MatchCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
      <div className="flex justify-between mb-4">
        <div className="space-y-1.5">
          <div className="h-5 w-40 rounded bg-gray-200" />
          <div className="h-3 w-20 rounded bg-gray-100" />
        </div>
        <div className="flex gap-2">
          <div className="h-5 w-16 rounded-full bg-gray-200" />
          <div className="h-5 w-16 rounded-full bg-gray-200" />
        </div>
      </div>
      <div className="flex gap-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gray-200" />
          <div className="space-y-1">
            <div className="h-3 w-12 rounded bg-gray-100" />
            <div className="h-4 w-20 rounded bg-gray-200" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gray-200" />
          <div className="space-y-1">
            <div className="h-3 w-12 rounded bg-gray-100" />
            <div className="h-4 w-20 rounded bg-gray-200" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
const ROLE_TABS: { label: string; value: "" | "teacher" | "learner" }[] = [
  { label: "All", value: "" },
  { label: "As Teacher", value: "teacher" },
  { label: "As Learner", value: "learner" },
];

const STATUS_FILTERS: { label: string; value: "" | "pending" | "accepted" | "rejected" | "completed" }[] = [
  { label: "All", value: "" },
  { label: "Pending", value: "pending" },
  { label: "Accepted", value: "accepted" },
  { label: "Rejected", value: "rejected" },
  { label: "Completed", value: "completed" },
];

export default function MyMatchesPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [roleFilter, setRoleFilter] = useState<"" | MatchRole>("");
  const [statusFilter, setStatusFilter] = useState<"" | MatchStatus>("");
  const [confirmDialog, setConfirmDialog] = useState<{
    matchId: string;
    action: "accepted" | "rejected";
    skillTitle: string;
  } | null>(null);

  const filters = {
    role: roleFilter || undefined,
    status: statusFilter || undefined,
  };

  const { data: matches, isLoading, isError, refetch } = useQuery({
    queryKey: QUERY_KEYS.MATCHES(filters),
    queryFn: () => apiGetMyMatches(filters),
    refetchInterval: 30_000,
  });

  const respondMutation = useMutation({
    mutationFn: ({ matchId, action }: { matchId: string; action: "accepted" | "rejected" }) =>
      apiRespondToMatch(matchId, action),
    onSuccess: (_, { action }) => {
      queryClient.invalidateQueries({ queryKey: ["matches"] });
      toast.success(action === "accepted" ? "Match accepted! Session scheduled." : "Match rejected.");
      setConfirmDialog(null);
    },
    onError: (err) => {
      toast.error(parseApiError(err));
      setConfirmDialog(null);
    },
  });

  function handleRespond(matchId: string, action: "accepted" | "rejected") {
    const match = matches?.find((m) => m.matchId === matchId);
    if (action === "rejected") {
      setConfirmDialog({ matchId, action, skillTitle: match?.skill?.title ?? "this match" });
    } else {
      respondMutation.mutate({ matchId, action });
    }
  }

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Matches</h1>
            <p className="text-sm text-gray-500 mt-0.5">Track all your match requests</p>
          </div>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-600 transition"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        {/* Role Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-4 w-fit">
          {ROLE_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setRoleFilter(tab.value as "" | MatchRole)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
                roleFilter === tab.value
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Status Filter */}
        <div className="flex gap-2 overflow-x-auto pb-1 mb-6">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value as "" | MatchStatus)}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium border transition ${
                statusFilter === f.value
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-600"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {isLoading && (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => <MatchCardSkeleton key={i} />)}
          </div>
        )}

        {isError && (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <AlertCircle className="h-8 w-8 text-red-400" />
            <p className="text-sm text-gray-600">Failed to load matches.</p>
            <button onClick={() => refetch()} className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
              Retry
            </button>
          </div>
        )}

        {!isLoading && !isError && (!matches || matches.length === 0) && (
          <EmptyState
            icon={GitMerge}
            title={statusFilter === "pending" ? "No pending matches" : "No matches yet"}
            description={
              statusFilter === "pending"
                ? "No pending requests right now."
                : "Browse skills to send your first match request!"
            }
          />
        )}

        {!isLoading && !isError && matches && matches.length > 0 && (
          <div className="space-y-3">
            {matches.map((match) => (
              <MatchCard
                key={match.matchId}
                match={match}
                currentUserId={user?.id ?? ""}
                onRespond={handleRespond}
              />
            ))}
          </div>
        )}
      </div>

      {confirmDialog && (
        <ConfirmDialog
          message={`Are you sure you want to reject the match request for "${confirmDialog.skillTitle}"?`}
          confirmLabel="Reject"
          variant="danger"
          loading={respondMutation.isPending}
          onConfirm={() => respondMutation.mutate({ matchId: confirmDialog.matchId, action: "rejected" })}
          onCancel={() => setConfirmDialog(null)}
        />
      )}
    </AppShell>
  );
}
