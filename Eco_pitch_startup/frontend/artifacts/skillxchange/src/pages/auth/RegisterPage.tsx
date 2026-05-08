import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useLocation } from "wouter";
import { Eye, EyeOff, Loader2, Sparkles } from "lucide-react";
import toast from "react-hot-toast";
import { AuthLayout } from "../../components/layout/AuthLayout";
import { useAuthStore } from "../../store/authStore";
import { apiRegister, apiGetMe } from "../../api/auth.api";
import { parseApiError } from "../../utils/errorParser";

const registerSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  email: z.string().email("Enter a valid email").max(150, "Email is too long"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [, navigate] = useLocation();
  const { login, isAuthenticated } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  if (isAuthenticated) {
    navigate("/dashboard");
    return null;
  }

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  async function onSubmit(data: RegisterFormData) {
    setApiError(null);
    try {
      const { token, user: loginUser } = await apiRegister(data);
      localStorage.setItem("skillxchange_token", token);

      // Hydrate full user profile
      let fullUser;
      try {
        fullUser = await apiGetMe();
      } catch {
        fullUser = {
          id: loginUser.id,
          name: loginUser.name,
          email: loginUser.email,
          credits: loginUser.credits,
          bio: null,
          avatar_url: null,
          college: null,
          city: null,
          is_premium: false,
          created_at: new Date().toISOString(),
        };
      }

      login(token, fullUser);
      navigate("/dashboard");
    } catch (err) {
      const msg = parseApiError(err);
      const status =
        err &&
        typeof err === "object" &&
        "response" in err
          ? (err as { response?: { status?: number } }).response?.status
          : undefined;

      if (status === 409) {
        setApiError("This email is already registered. Login instead?");
      } else if (msg.startsWith("Network")) {
        toast.error(msg);
      } else {
        setApiError(msg);
      }
    }
  }

  return (
    <AuthLayout>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Create your account</h2>

      {/* Credits callout */}
      <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5 mb-6">
        <Sparkles className="h-4 w-4 text-amber-500 shrink-0" />
        <p className="text-sm text-amber-700 font-medium">Start with 50 free credits!</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        {/* API Error Banner */}
        {apiError && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700"
          >
            <svg className="mt-0.5 h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span>
              {apiError}
              {apiError.includes("already registered") && (
                <>
                  {" "}
                  <Link href="/login" className="underline font-medium">
                    Log in here.
                  </Link>
                </>
              )}
            </span>
          </div>
        )}

        {/* Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">
            Full name
          </label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            aria-describedby={errors.name ? "name-error" : undefined}
            {...register("name")}
            className="block w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition disabled:opacity-50"
            placeholder="Harsh Rawat"
            disabled={isSubmitting}
          />
          {errors.name && (
            <p id="name-error" className="mt-1.5 text-xs text-red-600">
              {errors.name.message}
            </p>
          )}
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
            Email address
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            aria-describedby={errors.email ? "email-error" : undefined}
            {...register("email")}
            className="block w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition disabled:opacity-50"
            placeholder="you@example.com"
            disabled={isSubmitting}
          />
          {errors.email && (
            <p id="email-error" className="mt-1.5 text-xs text-red-600">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              aria-describedby={errors.password ? "password-error" : undefined}
              {...register("password")}
              className="block w-full rounded-lg border border-gray-300 px-3.5 py-2.5 pr-10 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition disabled:opacity-50"
              placeholder="At least 8 characters"
              disabled={isSubmitting}
            />
            <button
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword((v) => !v)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 transition"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && (
            <p id="password-error" className="mt-1.5 text-xs text-red-600">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {isSubmitting ? "Creating account..." : "Create account"}
        </button>
      </form>

      {/* Footer */}
      <p className="mt-6 text-center text-sm text-gray-500">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-indigo-600 hover:text-indigo-500 transition"
        >
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
