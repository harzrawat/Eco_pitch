import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { apiGetSkill, apiUpdateSkill } from "../../api/skills.api";
import { SkillForm } from "../../components/skills/SkillForm";
import { AppShell } from "../../components/layout/AppShell";
import { PageLoader } from "../../components/shared/LoadingSpinner";
import { QUERY_KEYS } from "../../constants/skills.constants";
import { useAuthStore } from "../../store/authStore";
import { parseApiError } from "../../utils/errorParser";
import toast from "react-hot-toast";
import type { SkillFormData } from "../../components/skills/SkillForm";

export default function EditSkillPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [apiError, setApiError] = useState<string | null>(null);

  const { data: skill, isLoading } = useQuery({
    queryKey: QUERY_KEYS.SKILL(id!),
    queryFn: () => apiGetSkill(id!),
    enabled: !!id,
  });

  const mutation = useMutation({
    mutationFn: (data: SkillFormData) =>
      apiUpdateSkill(id!, {
        title: data.title,
        description: data.description,
        category: data.category,
        mode: data.mode,
        credits_per_session: data.credits_per_session ?? null,
        price_per_session: data.price_per_session ?? null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USER_SKILLS(user?.id ?? "") });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SKILL(id!) });
      toast.success("Skill updated!");
      navigate("/my-skills");
    },
    onError: (err) => {
      setApiError(parseApiError(err));
    },
  });

  async function handleSubmit(data: SkillFormData) {
    setApiError(null);
    await mutation.mutateAsync(data);
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
          <h1 className="text-xl font-bold text-gray-900 mb-1">Edit Skill</h1>
          <p className="text-sm text-gray-500 mb-6">Update your skill listing.</p>

          {isLoading && <PageLoader />}

          {!isLoading && skill && (
            <SkillForm
              defaultValues={skill}
              onSubmit={handleSubmit}
              submitLabel="Save Changes"
              apiError={apiError}
            />
          )}
        </div>
      </div>
    </AppShell>
  );
}
