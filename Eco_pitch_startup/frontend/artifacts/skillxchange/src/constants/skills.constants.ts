export const CATEGORIES = [
  "Tech",
  "Music",
  "Design",
  "Language",
  "Fitness",
  "Academic",
  "Other",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const MODES = ["online", "offline", "both"] as const;
export type Mode = (typeof MODES)[number];

export const MODE_LABELS: Record<string, string> = {
  online: "Online",
  offline: "Offline",
  both: "Online & Offline",
};

export const CATEGORY_COLORS: Record<string, string> = {
  Tech: "bg-blue-100 text-blue-700",
  Music: "bg-purple-100 text-purple-700",
  Design: "bg-pink-100 text-pink-700",
  Language: "bg-green-100 text-green-700",
  Fitness: "bg-orange-100 text-orange-700",
  Academic: "bg-yellow-100 text-yellow-700",
  Other: "bg-gray-100 text-gray-700",
};

export const MODE_COLORS: Record<string, string> = {
  online: "bg-teal-100 text-teal-700",
  offline: "bg-amber-100 text-amber-700",
  both: "bg-indigo-100 text-indigo-700",
};

export const QUERY_KEYS = {
  SKILLS: (filters: object) => ["skills", filters],
  SKILL: (id: string) => ["skills", id],
  USER_SKILLS: (userId: string) => ["user-skills", userId],
  SKILL_REQUESTS: (filters: object) => ["skill-requests", filters],
  USER_PROFILE: (userId: string) => ["user-profile", userId],
  MATCHES: (filters?: object) => ["matches", filters ?? {}],
  SESSIONS: ["sessions"] as const,
  CREDIT_BALANCE: ["credit-balance"] as const,
  CREDIT_HISTORY: (page?: number) => ["credit-history", page ?? 1],
};
