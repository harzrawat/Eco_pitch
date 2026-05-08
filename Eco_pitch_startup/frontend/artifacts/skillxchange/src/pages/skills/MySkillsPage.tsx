import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, BookOpen } from "lucide-react";
import { apiDeleteSkill } from "../../api/skills.api";
import { apiGetUserSkills } from "../../api/users.api";
import { SkillCard } from "../../components/skills/SkillCard";
import { EmptyState } from "../../components/shared/EmptyState";
import { SkillCardSkeleton } from "../../components/shared/LoadingSpinner";
import { AppShell } from "../../components/layout/AppShell";
import { QUERY_KEYS } from "../../constants/skills.constants";
import { useAuthStore } from "../../store/authStore";
import toast from "react-hot-toast";

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
        <h2 className="text-base font-semibold text-gray-900 mb-2">Delete Skill?</h2>
        <p className="text-sm text-gray-500 mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 transition disabled:opacity-60"
          >
            {loading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MySkillsPage() {
  const { user } = useAuthStore();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const { data: skills, isLoading } = useQuery({
    queryKey: QUERY_KEYS.USER_SKILLS(user?.id ?? ""),
    queryFn: () => apiGetUserSkills(user!.id),
    enabled: !!user?.id,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiDeleteSkill(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USER_SKILLS(user?.id ?? "") });
      toast.success("Skill deleted");
      setConfirmId(null);
    },
    onError: () => {
      toast.error("Failed to delete skill");
    },
  });

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Skills</h1>
            <p className="text-sm text-gray-500 mt-0.5">Manage the skills you teach</p>
          </div>
          <button
            onClick={() => navigate("/my-skills/new")}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Add Skill
          </button>
        </div>

        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => <SkillCardSkeleton key={i} />)}
          </div>
        )}

        {!isLoading && (!skills || skills.length === 0) && (
          <EmptyState
            icon={BookOpen}
            title="No skills yet"
            description="Add your first skill to start teaching and earning credits."
            ctaLabel="Add your first skill"
            onCta={() => navigate("/my-skills/new")}
          />
        )}

        {!isLoading && skills && skills.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {skills.map((skill) => (
              <SkillCard
                key={skill.id}
                skill={skill}
                variant="owner"
                onEdit={() => navigate(`/my-skills/${skill.id}/edit`)}
                onDelete={() => setConfirmId(skill.id)}
              />
            ))}
          </div>
        )}
      </div>

      {confirmId && (
        <ConfirmDialog
          message="This will remove your skill from the marketplace. This action cannot be undone."
          onConfirm={() => deleteMutation.mutate(confirmId)}
          onCancel={() => setConfirmId(null)}
          loading={deleteMutation.isPending}
        />
      )}
    </AppShell>
  );
}
