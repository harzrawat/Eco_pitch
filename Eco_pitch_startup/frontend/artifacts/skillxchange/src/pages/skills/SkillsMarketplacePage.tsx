import { useState, useEffect, useCallback } from "react";
import { useLocation, useSearch } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Search, SlidersHorizontal, AlertCircle } from "lucide-react";
import { apiListSkills } from "../../api/skills.api";
import { apiCreateMatch } from "../../api/matches.api";
import { SkillCard } from "../../components/skills/SkillCard";
import { Pagination } from "../../components/shared/Pagination";
import { EmptyState } from "../../components/shared/EmptyState";
import { SkillCardSkeleton } from "../../components/shared/LoadingSpinner";
import { CATEGORIES, MODES, MODE_LABELS, QUERY_KEYS } from "../../constants/skills.constants";
import { AppShell } from "../../components/layout/AppShell";
import { useAuthStore } from "../../store/authStore";
import toast from "react-hot-toast";
import type { Skill } from "../../types/skill.types";

function MatchRequestModal({
  skill,
  onClose,
}: {
  skill: Skill;
  onClose: () => void;
}) {
  const [sessionType, setSessionType] = useState<"credit" | "paid">(
    skill.credits_per_session != null ? "credit" : "paid"
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasCredit = skill.credits_per_session != null;
  const hasPaid = skill.price_per_session != null;

  async function handleSubmit() {
    setLoading(true);
    setError(null);
    try {
      await apiCreateMatch({ skillId: skill.id, sessionType });
      toast.success("Match request sent!");
      onClose();
    } catch (e: unknown) {
      const msg =
        e && typeof e === "object" && "response" in e
          ? ((e as { response?: { data?: { error?: string } } }).response?.data?.error ?? "Failed to send match request")
          : "Failed to send match request";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm z-10">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Request Match</h2>
        <p className="text-sm text-gray-500 mb-5">
          <span className="font-medium text-gray-800">{skill.title}</span>
        </p>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <p className="text-sm font-medium text-gray-700 mb-3">Session type</p>
        <div className="space-y-2 mb-6">
          {hasCredit && (
            <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 cursor-pointer hover:border-indigo-400 transition has-[:checked]:border-indigo-500 has-[:checked]:bg-indigo-50">
              <input
                type="radio"
                name="sessionType"
                value="credit"
                checked={sessionType === "credit"}
                onChange={() => setSessionType("credit")}
                className="accent-indigo-600"
              />
              <span className="text-sm font-medium text-gray-800">
                Credits — {skill.credits_per_session} credits/session
              </span>
            </label>
          )}
          {hasPaid && (
            <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 cursor-pointer hover:border-indigo-400 transition has-[:checked]:border-indigo-500 has-[:checked]:bg-indigo-50">
              <input
                type="radio"
                name="sessionType"
                value="paid"
                checked={sessionType === "paid"}
                onChange={() => setSessionType("paid")}
                className="accent-indigo-600"
              />
              <span className="text-sm font-medium text-gray-800">
                Paid — ₹{skill.price_per_session}/session
              </span>
            </label>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition disabled:opacity-60"
          >
            {loading ? "Sending..." : "Send Request"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SkillsMarketplacePage() {
  const { isAuthenticated } = useAuthStore();
  const [, navigate] = useLocation();
  const searchStr = useSearch();

  const params = new URLSearchParams(searchStr);
  const [q, setQ] = useState(params.get("q") ?? "");
  const [category, setCategory] = useState(params.get("category") ?? "");
  const [mode, setMode] = useState(params.get("mode") ?? "");
  const [page, setPage] = useState(Number(params.get("page") ?? 1));
  const [debouncedQ, setDebouncedQ] = useState(q);
  const [matchSkill, setMatchSkill] = useState<Skill | null>(null);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQ(q);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  // Sync URL
  useEffect(() => {
    const p = new URLSearchParams();
    if (debouncedQ) p.set("q", debouncedQ);
    if (category) p.set("category", category);
    if (mode) p.set("mode", mode);
    if (page > 1) p.set("page", String(page));
    const qs = p.toString();
    navigate(`/skills${qs ? `?${qs}` : ""}`, { replace: true });
  }, [debouncedQ, category, mode, page]);

  const filters = {
    q: debouncedQ || undefined,
    category: category || undefined,
    mode: mode || undefined,
    page,
    limit: 9,
  };

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: QUERY_KEYS.SKILLS(filters),
    queryFn: () => apiListSkills(filters),
  });

  function handleFilterChange(setter: (v: string) => void) {
    return (e: React.ChangeEvent<HTMLSelectElement>) => {
      setter(e.target.value);
      setPage(1);
    };
  }

  function handleRequestMatch(skill: Skill) {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    setMatchSkill(skill);
  }

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Browse Skills</h1>
            <p className="text-sm text-gray-500 mt-0.5">Find a teacher and start learning</p>
          </div>
        </div>

        {/* Search + Filter Bar */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search skills..."
              className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition"
            />
          </div>
          <div className="flex gap-2 shrink-0">
            <select
              value={category}
              onChange={handleFilterChange(setCategory)}
              className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition"
            >
              <option value="">All categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <select
              value={mode}
              onChange={handleFilterChange(setMode)}
              className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition"
            >
              <option value="">All modes</option>
              {MODES.map((m) => (
                <option key={m} value={m}>{MODE_LABELS[m]}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Results count */}
        {data && (
          <p className="text-sm text-gray-500 mb-4">
            Showing <span className="font-medium">{data.data.length}</span> of{" "}
            <span className="font-medium">{data.total}</span> skills
          </p>
        )}

        {/* Grid */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <SkillCardSkeleton key={i} />)}
          </div>
        )}

        {isError && (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <AlertCircle className="h-8 w-8 text-red-400" />
            <p className="text-sm text-gray-600">Failed to load skills.</p>
            <button
              onClick={() => refetch()}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
            >
              Retry
            </button>
          </div>
        )}

        {!isLoading && !isError && data?.data.length === 0 && (
          <EmptyState
            icon={SlidersHorizontal}
            title="No skills found"
            description="Try different filters or search terms."
          />
        )}

        {!isLoading && !isError && data && data.data.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.data.map((skill) => (
                <SkillCard
                  key={skill.id}
                  skill={skill}
                  variant="marketplace"
                  isAuthenticated={isAuthenticated}
                  onRequestMatch={() => handleRequestMatch(skill)}
                />
              ))}
            </div>
            <Pagination
              page={data.page}
              pages={data.pages}
              total={data.total}
              limit={9}
              onPageChange={setPage}
            />
          </>
        )}
      </div>

      {matchSkill && (
        <MatchRequestModal skill={matchSkill} onClose={() => setMatchSkill(null)} />
      )}
    </AppShell>
  );
}
