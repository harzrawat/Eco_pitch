import { useState } from "react";
import { useParams, useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  GraduationCap,
  MapPin,
  Coins,
  Sparkles,
  Calendar,
  Pencil,
  AlertCircle,
  BookOpen,
} from "lucide-react";
import { apiGetUserProfile, apiGetUserSkills } from "../../api/users.api";
import { apiCreateMatch } from "../../api/matches.api";
import { AppShell } from "../../components/layout/AppShell";
import { SkillCard } from "../../components/skills/SkillCard";
import { EmptyState } from "../../components/shared/EmptyState";
import { SkillCardSkeleton } from "../../components/shared/LoadingSpinner";
import { QUERY_KEYS } from "../../constants/skills.constants";
import { useAuthStore } from "../../store/authStore";
import toast from "react-hot-toast";
import type { Skill } from "../../types/skill.types";

function Avatar({ name, url, size = "lg" }: { name: string; url?: string | null; size?: "sm" | "lg" }) {
  const dim = size === "lg" ? "w-24 h-24 text-3xl" : "w-10 h-10 text-base";
  if (url) {
    return (
      <img
        src={url}
        alt={name}
        className={`${dim} rounded-full object-cover ring-4 ring-white shadow`}
      />
    );
  }
  return (
    <div
      aria-label={name}
      className={`${dim} rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold ring-4 ring-white shadow`}
    >
      {name?.[0]?.toUpperCase() ?? "?"}
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row gap-5">
          <div className="w-24 h-24 rounded-full bg-gray-200 shrink-0" />
          <div className="flex-1 space-y-2 pt-2">
            <div className="h-6 w-40 rounded bg-gray-200" />
            <div className="h-4 w-32 rounded bg-gray-100" />
            <div className="h-4 w-24 rounded bg-gray-100" />
          </div>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="h-4 w-full rounded bg-gray-100 mb-2" />
        <div className="h-4 w-5/6 rounded bg-gray-100" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => <SkillCardSkeleton key={i} />)}
      </div>
    </div>
  );
}

function MatchRequestModal({ skill, onClose }: { skill: Skill; onClose: () => void }) {
  const [sessionType, setSessionType] = useState<"credit" | "paid">(
    skill.credits_per_session != null ? "credit" : "paid"
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
          ? ((e as { response?: { data?: { error?: string } } }).response?.data?.error ?? "Failed to send request")
          : "Failed to send request";
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
        <p className="text-sm text-gray-500 mb-5 font-medium">{skill.title}</p>
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
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
          <button onClick={onClose} className="flex-1 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">Cancel</button>
          <button onClick={handleSubmit} disabled={loading} className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition disabled:opacity-60">
            {loading ? "Sending..." : "Send Request"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { isAuthenticated, user: currentUser } = useAuthStore();
  const [matchSkill, setMatchSkill] = useState<Skill | null>(null);

  const isOwnProfile = currentUser?.id === id;

  const { data: profile, isLoading: profileLoading, isError: profileError } = useQuery({
    queryKey: QUERY_KEYS.USER_PROFILE(id!),
    queryFn: () => apiGetUserProfile(id!),
    enabled: !!id,
  });

  const { data: skills, isLoading: skillsLoading, isError: skillsError } = useQuery({
    queryKey: QUERY_KEYS.USER_SKILLS(id!),
    queryFn: () => apiGetUserSkills(id!),
    enabled: !!id,
  });

  const memberSince = profile
    ? new Date(profile.created_at).toLocaleDateString("en-IN", { month: "long", year: "numeric" })
    : "";

  function handleRequestMatch(skill: Skill) {
    if (!isAuthenticated) { navigate("/login"); return; }
    setMatchSkill(skill);
  }

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto">
        {profileLoading && <ProfileSkeleton />}

        {profileError && (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <AlertCircle className="h-8 w-8 text-red-400" />
            <p className="text-base font-semibold text-gray-800">User not found</p>
            <Link href="/skills" className="text-sm text-indigo-600 hover:text-indigo-500">
              Browse skills marketplace
            </Link>
          </div>
        )}

        {profile && (
          <div className="space-y-4">
            {/* Profile Header Card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Banner */}
              <div className="h-24 bg-gradient-to-r from-indigo-500 to-violet-600" />

              <div className="px-6 pb-6">
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-12 mb-4">
                  <Avatar name={profile.name} url={profile.avatar_url} size="lg" />
                  {isOwnProfile && (
                    <button
                      onClick={() => navigate("/profile/edit")}
                      className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-indigo-300 transition"
                    >
                      <Pencil className="h-4 w-4" />
                      Edit Profile
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <h1 className="text-xl font-bold text-gray-900">{profile.name}</h1>
                  {profile.is_premium && (
                    <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                      <Sparkles className="h-3 w-3" />
                      Premium
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 mb-4">
                  {profile.college && (
                    <span className="flex items-center gap-1">
                      <GraduationCap className="h-4 w-4 text-gray-400" />
                      {profile.college}
                    </span>
                  )}
                  {profile.city && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      {profile.city}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Coins className="h-4 w-4 text-amber-400" />
                    <span className="font-medium text-amber-700">{profile.credits}</span> credits
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    Member since {memberSince}
                  </span>
                </div>
              </div>
            </div>

            {/* Bio Section */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">About</h2>
              {profile.bio ? (
                <p className="text-gray-700 text-sm leading-relaxed">{profile.bio}</p>
              ) : (
                <p className="text-gray-400 text-sm italic">No bio added yet.</p>
              )}
            </div>

            {/* Skills Section */}
            <div>
              <h2 className="text-base font-semibold text-gray-900 mb-3">
                Skills {profile.name.split(" ")[0]} can teach
              </h2>

              {skillsLoading && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[0, 1, 2].map((i) => <SkillCardSkeleton key={i} />)}
                </div>
              )}

              {skillsError && (
                <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  Failed to load skills.
                </div>
              )}

              {!skillsLoading && !skillsError && (!skills || skills.length === 0) && (
                <EmptyState
                  icon={BookOpen}
                  title="No skills listed yet"
                  description={`${profile.name.split(" ")[0]} hasn't added any teachable skills yet.`}
                />
              )}

              {!skillsLoading && !skillsError && skills && skills.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {skills.map((skill) => (
                    <SkillCard
                      key={skill.id}
                      skill={{ ...skill, teacher: { id: profile.id, name: profile.name, avatar_url: profile.avatar_url, college: profile.college, city: profile.city } }}
                      variant="marketplace"
                      isAuthenticated={isAuthenticated}
                      onRequestMatch={isOwnProfile ? undefined : () => handleRequestMatch(skill)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {matchSkill && (
        <MatchRequestModal skill={matchSkill} onClose={() => setMatchSkill(null)} />
      )}
    </AppShell>
  );
}
