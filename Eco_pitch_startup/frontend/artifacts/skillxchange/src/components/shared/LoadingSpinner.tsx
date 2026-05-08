import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizes = { sm: "h-4 w-4", md: "h-6 w-6", lg: "h-8 w-8" };

export function LoadingSpinner({ size = "md", className = "" }: LoadingSpinnerProps) {
  return (
    <Loader2 className={`animate-spin text-indigo-600 ${sizes[size]} ${className}`} />
  );
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center py-24">
      <LoadingSpinner size="lg" />
    </div>
  );
}

export function SkillCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
      <div className="flex gap-2 mb-3">
        <div className="h-5 w-16 rounded-full bg-gray-200" />
        <div className="h-5 w-16 rounded-full bg-gray-200" />
      </div>
      <div className="h-5 w-3/4 rounded bg-gray-200 mb-2" />
      <div className="h-4 w-full rounded bg-gray-100 mb-1" />
      <div className="h-4 w-5/6 rounded bg-gray-100 mb-4" />
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-full bg-gray-200" />
        <div className="h-4 w-24 rounded bg-gray-200" />
      </div>
    </div>
  );
}
