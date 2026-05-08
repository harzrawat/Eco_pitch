import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";
import { apiUpdateUserProfile } from "../../api/users.api";
import { AppShell } from "../../components/layout/AppShell";
import { useAuthStore } from "../../store/authStore";
import { parseApiError } from "../../utils/errorParser";
import toast from "react-hot-toast";

const editProfileSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  bio: z.string().max(500, "Bio too long").optional(),
  avatar_url: z
    .string()
    .url("Enter a valid URL")
    .optional()
    .or(z.literal("")),
  college: z.string().max(150, "College name too long").optional(),
  city: z.string().max(100, "City name too long").optional(),
});

type EditProfileFormData = z.infer<typeof editProfileSchema>;

function AvatarPreview({ url, name }: { url: string; name: string }) {
  const [imgError, setImgError] = useState(false);

  if (url && !imgError) {
    return (
      <img
        src={url}
        alt={name}
        onError={() => setImgError(true)}
        className="w-24 h-24 rounded-full object-cover ring-4 ring-indigo-100 shadow"
      />
    );
  }
  return (
    <div className="w-24 h-24 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-3xl ring-4 ring-indigo-50 shadow">
      {name?.[0]?.toUpperCase() ?? "?"}
    </div>
  );
}

const inputCls =
  "block w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition disabled:opacity-50";

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
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

export default function EditProfilePage() {
  const [, navigate] = useLocation();
  const { user, updateUser } = useAuthStore();
  const [apiError, setApiError] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar_url ?? "");

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<EditProfileFormData>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      name: user?.name ?? "",
      bio: user?.bio ?? "",
      avatar_url: user?.avatar_url ?? "",
      college: user?.college ?? "",
      city: user?.city ?? "",
    },
  });

  // Watch avatar_url for live preview on blur
  const watchedAvatar = watch("avatar_url");

  const mutation = useMutation({
    mutationFn: (data: EditProfileFormData) =>
      apiUpdateUserProfile(user!.id, {
        name: data.name,
        bio: data.bio || undefined,
        avatar_url: data.avatar_url || undefined,
        college: data.college || undefined,
        city: data.city || undefined,
      }),
    onSuccess: (updatedUser) => {
      updateUser(updatedUser);
      toast.success("Profile updated!");
      navigate(`/profile/${user!.id}`);
    },
    onError: (err) => {
      const msg = parseApiError(err);
      if (
        err &&
        typeof err === "object" &&
        "response" in err &&
        (err as { response?: { status?: number } }).response?.status === 403
      ) {
        toast.error("You can only edit your own profile");
        navigate(`/profile/${user!.id}`);
      } else {
        setApiError(msg);
      }
    },
  });

  async function onSubmit(data: EditProfileFormData) {
    setApiError(null);
    await mutation.mutateAsync(data);
  }

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate(`/profile/${user?.id}`)}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-600 mb-6 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to profile
        </button>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h1 className="text-xl font-bold text-gray-900 mb-1">Edit Profile</h1>
          <p className="text-sm text-gray-500 mb-6">
            Update your public profile information.
          </p>

          {/* Avatar Preview */}
          <div className="flex flex-col items-center mb-7">
            <AvatarPreview url={avatarPreview} name={watch("name") || user?.name || ""} />
            <p className="text-xs text-gray-400 mt-2">Avatar preview</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
            {apiError && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {apiError}
              </div>
            )}

            <Field id="avatar_url" label="Avatar URL" error={errors.avatar_url?.message}>
              <input
                id="avatar_url"
                type="url"
                {...register("avatar_url")}
                onBlur={() => setAvatarPreview(watchedAvatar ?? "")}
                className={inputCls}
                placeholder="https://example.com/your-photo.jpg"
                disabled={isSubmitting}
              />
            </Field>

            <Field id="name" label="Full name *" error={errors.name?.message}>
              <input
                id="name"
                type="text"
                {...register("name")}
                className={inputCls}
                placeholder="Your name"
                disabled={isSubmitting}
              />
            </Field>

            <Field id="bio" label="Bio" error={errors.bio?.message}>
              <textarea
                id="bio"
                {...register("bio")}
                rows={4}
                className={inputCls}
                placeholder="Tell others about yourself — what you teach, what you want to learn..."
                disabled={isSubmitting}
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field id="college" label="College / University" error={errors.college?.message}>
                <input
                  id="college"
                  type="text"
                  {...register("college")}
                  className={inputCls}
                  placeholder="e.g. IIT Delhi"
                  disabled={isSubmitting}
                />
              </Field>

              <Field id="city" label="City" error={errors.city?.message}>
                <input
                  id="city"
                  type="text"
                  {...register("city")}
                  className={inputCls}
                  placeholder="e.g. New Delhi"
                  disabled={isSubmitting}
                />
              </Field>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate(`/profile/${user?.id}`)}
                className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {isSubmitting ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
