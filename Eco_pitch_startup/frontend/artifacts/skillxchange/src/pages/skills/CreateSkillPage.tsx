import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { apiCreateSkill } from "../../api/skills.api";
import { SkillForm } from "../../components/skills/SkillForm";
import { AppShell } from "../../components/layout/AppShell";
import { QUERY_KEYS } from "../../constants/skills.constants";
import { useAuthStore } from "../../store/authStore";
import { parseApiError } from "../../utils/errorParser";
import toast from "react-hot-toast";
import type { SkillFormData } from "../../components/skills/SkillForm";

export default function CreateSkillPage() {
  const [, navigate] = useLocation();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [apiError, setApiError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: apiCreateSkill,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USER_SKILLS(user?.id ?? "") });
      toast.success("Skill created!");
      navigate("/my-skills");
    },
    onError: (err) => {
      setApiError(parseApiError(err));
    },
  });

  async function handleSubmit(data: SkillFormData) {
    setApiError(null);
    await mutation.mutateAsync({
      title: data.title,
      description: data.description,
      category: data.category,
      mode: data.mode,
      credits_per_session: data.credits_per_session ?? null,
      price_per_session: data.price_per_session ?? null,
    });
  }

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate("/my-skills")}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-600 mb-6 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to My Skills
        </button>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h1 className="text-xl font-bold text-gray-900 mb-1">Add New Skill</h1>
          <p className="text-sm text-gray-500 mb-6">
            List a skill you can teach. Others can find and request sessions with you.
          </p>

          <SkillForm
            onSubmit={handleSubmit}
            submitLabel="Create Skill"
            apiError={apiError}
          />
        </div>
      </div>
    </AppShell>
  );
}
