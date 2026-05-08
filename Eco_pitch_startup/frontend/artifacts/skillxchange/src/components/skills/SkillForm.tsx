import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { CATEGORIES, MODES, MODE_LABELS } from "../../constants/skills.constants";
import type { Skill } from "../../types/skill.types";

const skillSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title too long"),
  description: z.string().optional(),
  category: z.enum(["Tech", "Music", "Design", "Language", "Fitness", "Academic", "Other"]).optional(),
  mode: z.enum(["online", "offline", "both"]).optional(),
  credits_per_session: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? null : Number(v)),
    z.number().int().positive().nullable().optional()
  ),
  price_per_session: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? null : Number(v)),
    z.number().positive().nullable().optional()
  ),
});

export type SkillFormData = z.infer<typeof skillSchema>;

interface SkillFormProps {
  defaultValues?: Partial<Skill>;
  onSubmit: (data: SkillFormData) => Promise<void>;
  submitLabel: string;
  apiError?: string | null;
}

function Field({
  id,
  label,
  children,
  error,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
  error?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
      </label>
      {children}
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
    </div>
  );
}

const inputCls =
  "block w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition disabled:opacity-50";

export function SkillForm({ defaultValues, onSubmit, submitLabel, apiError }: SkillFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SkillFormData>({
    resolver: zodResolver(skillSchema),
    defaultValues: {
      title: defaultValues?.title ?? "",
      description: defaultValues?.description ?? "",
      category: (defaultValues?.category as SkillFormData["category"]) ?? undefined,
      mode: (defaultValues?.mode as SkillFormData["mode"]) ?? undefined,
      credits_per_session: defaultValues?.credits_per_session ?? undefined,
      price_per_session: defaultValues?.price_per_session ?? undefined,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      {apiError && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {apiError}
        </div>
      )}

      <Field id="title" label="Title *" error={errors.title?.message}>
        <input
          id="title"
          type="text"
          {...register("title")}
          className={inputCls}
          placeholder="e.g. Guitar Lessons for Beginners"
          disabled={isSubmitting}
        />
      </Field>

      <Field id="description" label="Description" error={errors.description?.message}>
        <textarea
          id="description"
          {...register("description")}
          rows={3}
          className={inputCls}
          placeholder="Describe what you'll teach and who it's for..."
          disabled={isSubmitting}
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field id="category" label="Category" error={errors.category?.message}>
          <select
            id="category"
            {...register("category")}
            className={inputCls}
            disabled={isSubmitting}
          >
            <option value="">Select category</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>

        <Field id="mode" label="Mode" error={errors.mode?.message}>
          <select
            id="mode"
            {...register("mode")}
            className={inputCls}
            disabled={isSubmitting}
          >
            <option value="">Select mode</option>
            {MODES.map((m) => (
              <option key={m} value={m}>
                {MODE_LABELS[m]}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field
          id="credits_per_session"
          label="Credits per session"
          error={errors.credits_per_session?.message}
        >
          <input
            id="credits_per_session"
            type="number"
            min={1}
            step={1}
            {...register("credits_per_session")}
            className={inputCls}
            placeholder="e.g. 10"
            disabled={isSubmitting}
          />
        </Field>

        <Field
          id="price_per_session"
          label="Price per session (₹)"
          error={errors.price_per_session?.message}
        >
          <input
            id="price_per_session"
            type="number"
            min={0}
            step={0.01}
            {...register("price_per_session")}
            className={inputCls}
            placeholder="e.g. 500"
            disabled={isSubmitting}
          />
        </Field>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
        {isSubmitting ? "Saving..." : submitLabel}
      </button>
    </form>
  );
}
