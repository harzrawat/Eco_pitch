import { useLocation } from "wouter";
import { Coins, IndianRupee, MapPin, Pencil, Trash2 } from "lucide-react";
import type { Skill } from "../../types/skill.types";
import { CATEGORY_COLORS, MODE_COLORS, MODE_LABELS } from "../../constants/skills.constants";

interface SkillCardProps {
  skill: Skill;
  variant?: "marketplace" | "owner";
  onEdit?: () => void;
  onDelete?: () => void;
  onRequestMatch?: () => void;
  isAuthenticated?: boolean;
}

function Avatar({ name, url, size = 8 }: { name: string; url?: string | null; size?: number }) {
  if (url) {
    return (
      <img
        src={url}
        alt={name}
        className={`w-${size} h-${size} rounded-full object-cover`}
      />
    );
  }
  return (
    <div
      className={`w-${size} h-${size} rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold text-sm`}
    >
      {name?.[0]?.toUpperCase() ?? "?"}
    </div>
  );
}

export function SkillCard({
  skill,
  variant = "marketplace",
  onEdit,
  onDelete,
  onRequestMatch,
  isAuthenticated,
}: SkillCardProps) {
  const [, navigate] = useLocation();

  return (
    <div
      className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col gap-3"
    >
      {/* Badges */}
      <div className="flex flex-wrap gap-2">
        {skill.category && (
          <span
            className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
              CATEGORY_COLORS[skill.category] ?? "bg-gray-100 text-gray-700"
            }`}
          >
            {skill.category}
          </span>
        )}
        {skill.mode && (
          <span
            className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
              MODE_COLORS[skill.mode] ?? "bg-gray-100 text-gray-700"
            }`}
          >
            {MODE_LABELS[skill.mode] ?? skill.mode}
          </span>
        )}
      </div>

      {/* Title + description */}
      <div>
        <h3
          className="font-semibold text-gray-900 text-base leading-tight cursor-pointer hover:text-indigo-600 transition"
          onClick={() => navigate(`/skills/${skill.id}`)}
        >
          {skill.title}
        </h3>
        {skill.description && (
          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{skill.description}</p>
        )}
      </div>

      {/* Pricing */}
      <div className="flex flex-wrap gap-3">
        {skill.credits_per_session != null && (
          <span className="flex items-center gap-1 text-sm text-amber-700 font-medium">
            <Coins className="h-4 w-4" />
            {skill.credits_per_session} credits/session
          </span>
        )}
        {skill.price_per_session != null && (
          <span className="flex items-center gap-1 text-sm text-green-700 font-medium">
            <IndianRupee className="h-4 w-4" />
            {skill.price_per_session}/session
          </span>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-50">
        {skill.teacher ? (
          <button
            className="flex items-center gap-2 hover:opacity-80 transition"
            onClick={() => navigate(`/profile/${skill.teacher!.id}`)}
          >
            <Avatar name={skill.teacher.name} url={skill.teacher.avatar_url} size={7} />
            <div className="text-left">
              <p className="text-sm font-medium text-gray-800">{skill.teacher.name}</p>
              {(skill.teacher.city || skill.teacher.college) && (
                <p className="text-xs text-gray-400 flex items-center gap-0.5">
                  <MapPin className="h-3 w-3" />
                  {skill.teacher.city ?? skill.teacher.college}
                </p>
              )}
            </div>
          </button>
        ) : (
          <span />
        )}

        {variant === "marketplace" && (
          <button
            onClick={onRequestMatch}
            className="text-sm font-semibold text-indigo-600 hover:text-indigo-500 transition"
          >
            Request Match
          </button>
        )}

        {variant === "owner" && (
          <div className="flex items-center gap-2">
            <button
              onClick={onEdit}
              className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition"
              aria-label="Edit skill"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              onClick={onDelete}
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
              aria-label="Delete skill"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
