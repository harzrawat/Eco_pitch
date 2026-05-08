import { useState } from "react";
import { useParams, useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Coins, IndianRupee, MapPin, GraduationCap, AlertCircle } from "lucide-react";
import { apiGetSkill } from "../../api/skills.api";
import { apiCreateMatch } from "../../api/matches.api";
import { AppShell } from "../../components/layout/AppShell";
import { PageLoader } from "../../components/shared/LoadingSpinner";
import { CATEGORY_COLORS, MODE_COLORS, MODE_LABELS, QUERY_KEYS } from "../../constants/skills.constants";
import { useAuthStore } from "../../store/authStore";
import toast from "react-hot-toast";

export default function SkillDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { isAuthenticated, user } = useAuthStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [sessionType, setSessionType] = useState<"credit" | "paid">("credit");
  const [matchLoading, setMatchLoading] = useState(false);
  const [matchError, setMatchError] = useState<string | null>(null);

  const { data: skill, isLoading, isError } = useQuery({
    queryKey: QUERY_KEYS.SKILL(id!),
    queryFn: () => apiGetSkill(id!),
    enabled: !!id,
  });

  async function handleSendMatch() {
    if (!skill) return;
    setMatchLoading(true);
    setMatchError(null);
    try {
      await apiCreateMatch({ skillId: skill.id, sessionType });
      toast.success("Match request sent!");
      setModalOpen(false);
    } catch (e: unknown) {
      const msg =
        e && typeof e === "object" && "response" in e
          ? ((e as { response?: { data?: { error?: string } } }).response?.data?.error ?? "Failed to send request")
          : "Failed to send request";
      setMatchError(msg);
    } finally {
      setMatchLoading(false);
    }
  }

  function handleRequestMatchClick() {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    if (skill) {
      setSessionType(skill.credits_per_session != null ? "credit" : "paid");
      setMatchError(null);
      setModalOpen(true);
    }
  }

  const isOwn = user?.id === skill?.user_id;

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => navigate("/skills")}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-600 mb-6 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to marketplace
        </button>

        {isLoading && <PageLoader />}

        {isError && (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <AlertCircle className="h-8 w-8 text-red-400" />
            <p className="text-base font-medium text-gray-800">Skill not found</p>
            <Link href="/skills" className="text-sm text-indigo-600 hover:text-indigo-500">
              Back to marketplace
            </Link>
          </div>
        )}

        {skill && (
          <div className="space-y-4">
            {/* Main skill card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex flex-wrap gap-2 mb-4">
                {skill.category && (
                  <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${CATEGORY_COLORS[skill.category] ?? "bg-gray-100 text-gray-700"}`}>
                    {skill.category}
                  </span>
                )}
                {skill.mode && (
                  <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${MODE_COLORS[skill.mode] ?? "bg-gray-100 text-gray-700"}`}>
                    {MODE_LABELS[skill.mode] ?? skill.mode}
                  </span>
                )}
              </div>

              <h1 className="text-2xl font-bold text-gray-900 mb-3">{skill.title}</h1>

              {skill.description && (
                <p className="text-gray-600 text-sm leading-relaxed mb-5">{skill.description}</p>
              )}

              {/* Pricing */}
              <div className="flex flex-wrap gap-4 p-4 bg-gray-50 rounded-xl">
                {skill.credits_per_session != null && (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                      <Coins className="h-4 w-4 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Credits</p>
                      <p className="text-sm font-semibold text-gray-900">{skill.credits_per_session} per session</p>
                    </div>
                  </div>
                )}
                {skill.price_per_session != null && (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                      <IndianRupee className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Paid</p>
                      <p className="text-sm font-semibold text-gray-900">₹{skill.price_per_session} per session</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Action button */}
              <div className="mt-5">
                {isOwn ? (
                  <p className="text-sm text-gray-400 text-center py-2">This is your skill listing</p>
                ) : (
                  <button
                    onClick={handleRequestMatchClick}
                    className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-500 transition shadow-sm"
                  >
                    Request Match
                  </button>
                )}
              </div>
            </div>

            {/* Teacher card */}
            {skill.teacher && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Teacher</h2>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xl">
                    {skill.teacher.name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <Link
                      href={`/profile/${skill.teacher.id}`}
                      className="text-base font-semibold text-gray-900 hover:text-indigo-600 transition"
                    >
                      {skill.teacher.name}
                    </Link>
                    {skill.teacher.college && (
                      <p className="flex items-center gap-1 text-sm text-gray-500 mt-0.5">
                        <GraduationCap className="h-3.5 w-3.5" />
                        {skill.teacher.college}
                      </p>
                    )}
                    {skill.teacher.city && (
                      <p className="flex items-center gap-1 text-sm text-gray-500 mt-0.5">
                        <MapPin className="h-3.5 w-3.5" />
                        {skill.teacher.city}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Match Modal */}
      {modalOpen && skill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setModalOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm z-10">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Request Match</h2>
            <p className="text-sm text-gray-500 mb-5 font-medium">{skill.title}</p>

            {matchError && (
              <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {matchError}
              </div>
            )}

            <p className="text-sm font-medium text-gray-700 mb-3">Choose session type</p>
            <div className="space-y-2 mb-6">
              {skill.credits_per_session != null && (
                <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 cursor-pointer hover:border-indigo-400 transition has-[:checked]:border-indigo-500 has-[:checked]:bg-indigo-50">
                  <input type="radio" name="st" value="credit" checked={sessionType === "credit"} onChange={() => setSessionType("credit")} className="accent-indigo-600" />
                  <span className="text-sm font-medium">Credits — {skill.credits_per_session} credits/session</span>
                </label>
              )}
              {skill.price_per_session != null && (
                <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 cursor-pointer hover:border-indigo-400 transition has-[:checked]:border-indigo-500 has-[:checked]:bg-indigo-50">
                  <input type="radio" name="st" value="paid" checked={sessionType === "paid"} onChange={() => setSessionType("paid")} className="accent-indigo-600" />
                  <span className="text-sm font-medium">Paid — ₹{skill.price_per_session}/session</span>
                </label>
              )}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setModalOpen(false)} className="flex-1 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">Cancel</button>
              <button onClick={handleSendMatch} disabled={matchLoading} className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition disabled:opacity-60">
                {matchLoading ? "Sending..." : "Send Request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
