import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Plus, MessageSquare, X, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiListSkillRequests, apiCreateSkillRequest } from "../../api/skills.api";
import { EmptyState } from "../../components/shared/EmptyState";
import { Pagination } from "../../components/shared/Pagination";
import { AppShell } from "../../components/layout/AppShell";
import { CATEGORIES, CATEGORY_COLORS, QUERY_KEYS } from "../../constants/skills.constants";
import { useAuthStore } from "../../store/authStore";
import { parseApiError } from "../../utils/errorParser";
import toast from "react-hot-toast";
import type { SkillRequest } from "../../types/skill.types";

const requestSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  description: z.string().optional(),
  category: z.enum(["Tech", "Music", "Design", "Language", "Fitness", "Academic", "Other"]).optional(),
});
type RequestFormData = z.infer<typeof requestSchema>;

function SkillRequestCard({ req }: { req: SkillRequest }) {
  const date = new Date(req.created_at).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-gray-900 text-base leading-tight">{req.title}</h3>
        {req.category && (
          <span className={`shrink-0 text-xs font-medium px-2.5 py-0.5 rounded-full ${CATEGORY_COLORS[req.category] ?? "bg-gray-100 text-gray-700"}`}>
            {req.category}
          </span>
        )}
      </div>
      {req.description && (
        <p className="text-sm text-gray-500 line-clamp-2">{req.description}</p>
      )}
      <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-50">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
            {req.user?.name?.[0]?.toUpperCase() ?? "?"}
          </div>
          <span className="text-xs text-gray-500">{req.user?.name ?? "Anonymous"}</span>
        </div>
        <span className="text-xs text-gray-400">{date}</span>
      </div>
    </div>
  );
}

function PostRequestModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RequestFormData>({ resolver: zodResolver(requestSchema) });

  const mutation = useMutation({
    mutationFn: apiCreateSkillRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["skill-requests"] });
      toast.success("Request posted!");
      onClose();
    },
    onError: (err) => setApiError(parseApiError(err)),
  });

  async function onSubmit(data: RequestFormData) {
    setApiError(null);
    await mutation.mutateAsync(data);
  }

  const inputCls = "block w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition disabled:opacity-50";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-md z-10">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-900">Post a Skill Request</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
        </div>

        {apiError && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{apiError}</div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">What do you want to learn? *</label>
            <input type="text" {...register("title")} className={inputCls} placeholder="e.g. Want to learn Python basics" disabled={isSubmitting} />
            {errors.title && <p className="mt-1.5 text-xs text-red-600">{errors.title.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea {...register("description")} rows={3} className={inputCls} placeholder="Tell more about what you're looking for..." disabled={isSubmitting} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
            <select {...register("category")} className={inputCls} disabled={isSubmitting}>
              <option value="">Select category</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition disabled:opacity-60">
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSubmitting ? "Posting..." : "Post Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function SkillRequestsPage() {
  const { isAuthenticated } = useAuthStore();
  const [, navigate] = useLocation();
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [debouncedQ, setDebouncedQ] = useState(q);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedQ(q); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [q]);

  const filters = { q: debouncedQ || undefined, category: category || undefined, page, limit: 10 };

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.SKILL_REQUESTS(filters),
    queryFn: () => apiListSkillRequests(filters),
  });

  function handlePostRequest() {
    if (!isAuthenticated) { navigate("/login"); return; }
    setModalOpen(true);
  }

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Skill Requests</h1>
            <p className="text-sm text-gray-500 mt-0.5">Browse what others want to learn</p>
          </div>
          <button
            onClick={handlePostRequest}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Post Request
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search requests..."
              className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition"
            />
          </div>
          <select
            value={category}
            onChange={(e) => { setCategory(e.target.value); setPage(1); }}
            className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition"
          >
            <option value="">All categories</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 h-24 animate-pulse" />
            ))}
          </div>
        )}

        {!isLoading && data?.data.length === 0 && (
          <EmptyState
            icon={MessageSquare}
            title="No skill requests yet"
            description="Be the first to post what you want to learn!"
            ctaLabel="Post a request"
            onCta={handlePostRequest}
          />
        )}

        {!isLoading && data && data.data.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {data.data.map((req) => <SkillRequestCard key={req.id} req={req} />)}
            </div>
            <Pagination page={data.page} pages={data.pages} total={data.total} limit={10} onPageChange={setPage} />
          </>
        )}
      </div>

      {modalOpen && <PostRequestModal onClose={() => setModalOpen(false)} />}
    </AppShell>
  );
}
