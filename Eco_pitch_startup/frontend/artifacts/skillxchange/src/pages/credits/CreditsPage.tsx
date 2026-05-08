import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Coins, TrendingUp, TrendingDown, AlertCircle, RefreshCw } from "lucide-react";
import { apiGetCreditBalance, apiGetCreditHistory } from "../../api/credits.api";
import { AppShell } from "../../components/layout/AppShell";
import { EmptyState } from "../../components/shared/EmptyState";
import { QUERY_KEYS } from "../../constants/skills.constants";
import type { CreditTransaction, TransactionReason } from "../../types/credit.types";

// ── Reason labels ─────────────────────────────────────────────────────────────
const REASON_LABELS: Record<string, string> = {
  session_taught: "Session Taught",
  session_taken: "Session Taken",
  purchase: "Credit Purchase",
};

function reasonLabel(reason: TransactionReason): string {
  return REASON_LABELS[reason] ?? reason;
}

// ── Credit Balance Card ───────────────────────────────────────────────────────
function BalanceSkeleton() {
  return (
    <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl p-8 animate-pulse">
      <div className="h-5 w-32 rounded bg-white/20 mb-4" />
      <div className="h-14 w-40 rounded bg-white/20 mb-2" />
      <div className="h-4 w-24 rounded bg-white/20" />
    </div>
  );
}

function CreditBalanceCard({ credits, isLoading, isError, refetch }: {
  credits?: number;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}) {
  if (isLoading) return <BalanceSkeleton />;

  if (isError) {
    return (
      <div className="bg-white rounded-2xl border border-red-200 p-8 flex flex-col items-center gap-3 text-center">
        <AlertCircle className="h-8 w-8 text-red-400" />
        <p className="text-sm text-gray-600">Could not load balance.</p>
        <button onClick={refetch} className="text-sm font-medium text-indigo-600 hover:text-indigo-500 flex items-center gap-1.5">
          <RefreshCw className="h-3.5 w-3.5" /> Retry
        </button>
      </div>
    );
  }

  const formatted = (credits ?? 0).toLocaleString("en-IN");
  const isLow = (credits ?? 0) === 0;

  return (
    <div className={`rounded-2xl p-8 text-white shadow-lg ${isLow ? "bg-gradient-to-br from-rose-500 to-red-600" : "bg-gradient-to-br from-indigo-600 to-violet-600"}`}>
      <div className="flex items-center gap-2 mb-3 opacity-80">
        <Coins className="h-5 w-5" />
        <p className="text-sm font-medium tracking-wide uppercase">Credit Balance</p>
      </div>
      <p className="text-6xl font-bold tracking-tight mb-1">{formatted}</p>
      <p className="text-sm opacity-70">credits available</p>

      {isLow && (
        <div className="mt-4 bg-white/20 rounded-xl px-4 py-2.5 text-sm font-medium">
          ⚠️ You have 0 credits. Complete a session as a teacher to earn more.
        </div>
      )}
    </div>
  );
}

// ── Row Skeleton ──────────────────────────────────────────────────────────────
function RowSkeleton() {
  return (
    <div className="flex items-center gap-4 px-5 py-4 animate-pulse">
      <div className="w-8 h-8 rounded-full bg-gray-200 shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-4 w-32 rounded bg-gray-200" />
        <div className="h-3 w-24 rounded bg-gray-100" />
      </div>
      <div className="h-5 w-20 rounded bg-gray-200" />
    </div>
  );
}

// ── Transaction Row ───────────────────────────────────────────────────────────
function TransactionRow({ tx }: { tx: CreditTransaction }) {
  const isPositive = tx.delta > 0;
  const date = new Date(tx.createdAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const time = new Date(tx.createdAt).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const shortRef = tx.refId ? `${tx.refId.slice(0, 8)}…` : null;

  return (
    <div className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition group">
      {/* Icon */}
      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${isPositive ? "bg-green-100" : "bg-red-100"}`}>
        {isPositive
          ? <TrendingUp className="h-4 w-4 text-green-600" />
          : <TrendingDown className="h-4 w-4 text-red-500" />}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">{reasonLabel(tx.reason)}</p>
        <p className="text-xs text-gray-400 mt-0.5">
          {date} · {time}
          {shortRef && (
            <span className="ml-2 font-mono text-gray-300 group-hover:text-gray-400 transition">
              #{shortRef}
            </span>
          )}
        </p>
      </div>

      {/* Delta */}
      <span className={`text-sm font-bold tabular-nums ${isPositive ? "text-green-600" : "text-red-500"}`}>
        {isPositive ? "+" : ""}{tx.delta} credits
      </span>
    </div>
  );
}

// ── Pagination (compact) ──────────────────────────────────────────────────────
function HistoryPagination({
  page,
  pages,
  total,
  limit,
  onPageChange,
}: {
  page: number;
  pages: number;
  total: number;
  limit: number;
  onPageChange: (p: number) => void;
}) {
  if (pages <= 1) return null;
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
      <p className="text-xs text-gray-400">
        Showing {from}–{to} of {total}
      </p>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          ← Prev
        </button>
        <span className="text-xs font-medium text-gray-500 px-2">
          Page {page} of {pages}
        </span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pages}
          className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          Next →
        </button>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
const LIMIT = 20;

export default function CreditsPage() {
  const [page, setPage] = useState(1);

  const {
    data: balance,
    isLoading: balanceLoading,
    isError: balanceError,
    refetch: refetchBalance,
  } = useQuery({
    queryKey: QUERY_KEYS.CREDIT_BALANCE,
    queryFn: apiGetCreditBalance,
    staleTime: 30_000,
  });

  const {
    data: history,
    isLoading: historyLoading,
    isError: historyError,
    refetch: refetchHistory,
  } = useQuery({
    queryKey: QUERY_KEYS.CREDIT_HISTORY(page),
    queryFn: () => apiGetCreditHistory(page, LIMIT),
    placeholderData: (prev) => prev,
  });

  const pages = history ? Math.ceil(history.total / LIMIT) : 0;

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Credits Wallet</h1>
          <p className="text-sm text-gray-500 mt-0.5">Your balance and transaction history</p>
        </div>

        {/* Balance Card */}
        <div className="mb-6">
          <CreditBalanceCard
            credits={balance?.credits}
            isLoading={balanceLoading}
            isError={balanceError}
            refetch={refetchBalance}
          />
        </div>

        {/* Transaction History */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">Transaction History</h2>
            <button
              onClick={() => refetchHistory()}
              className="text-gray-400 hover:text-indigo-600 transition"
              aria-label="Refresh history"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

          {historyLoading && (
            <div className="divide-y divide-gray-50">
              {Array.from({ length: 5 }).map((_, i) => <RowSkeleton key={i} />)}
            </div>
          )}

          {historyError && (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <AlertCircle className="h-7 w-7 text-red-400" />
              <p className="text-sm text-gray-600">Could not load transaction history.</p>
              <button
                onClick={() => refetchHistory()}
                className="text-sm font-medium text-indigo-600 hover:text-indigo-500 flex items-center gap-1.5"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Retry
              </button>
            </div>
          )}

          {!historyLoading && !historyError && (!history?.data || history.data.length === 0) && (
            <EmptyState
              icon={Coins}
              title="No transactions yet"
              description="Complete a session as a teacher to earn credits!"
            />
          )}

          {!historyLoading && !historyError && history && history.data.length > 0 && (
            <>
              <div className="divide-y divide-gray-50">
                {history.data.map((tx) => (
                  <TransactionRow key={tx.transactionId} tx={tx} />
                ))}
              </div>
              <HistoryPagination
                page={page}
                pages={pages}
                total={history.total}
                limit={LIMIT}
                onPageChange={setPage}
              />
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}
