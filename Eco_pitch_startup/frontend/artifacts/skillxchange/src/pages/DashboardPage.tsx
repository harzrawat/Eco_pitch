import { useLocation } from "wouter";
import { Coins, BookOpen, Search, GitMerge, Sparkles } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { AppShell } from "../components/layout/AppShell";

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [, navigate] = useLocation();

  const quickLinks = [
    { label: "Browse Skills", desc: "Find teachers in the marketplace", icon: Search, href: "/skills", color: "bg-indigo-50 text-indigo-600" },
    { label: "My Skills", desc: "Manage skills you teach", icon: BookOpen, href: "/my-skills", color: "bg-purple-50 text-purple-600" },
    { label: "My Matches", desc: "View and respond to match requests", icon: GitMerge, href: "/matches", color: "bg-teal-50 text-teal-600" },
    { label: "Skill Requests", desc: "See what others want to learn", icon: Sparkles, href: "/skill-requests", color: "bg-amber-50 text-amber-600" },
  ];

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto">
        {/* Welcome banner */}
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-6 text-white mb-6 shadow-lg">
          <p className="text-sm text-indigo-200 mb-1">Welcome back</p>
          <h1 className="text-2xl font-bold mb-4">{user?.name ?? "User"} 👋</h1>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2 bg-white/15 rounded-xl px-4 py-2.5">
              <Coins className="h-5 w-5 text-amber-300" />
              <div>
                <p className="text-xs text-indigo-200">Credits</p>
                <p className="font-bold text-lg leading-tight">{user?.credits ?? 0}</p>
              </div>
            </div>
            {user?.is_premium && (
              <div className="flex items-center gap-2 bg-white/15 rounded-xl px-4 py-2.5">
                <Sparkles className="h-5 w-5 text-yellow-300" />
                <p className="font-semibold text-sm">Premium Member</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick links */}
        <h2 className="text-base font-semibold text-gray-700 mb-3">Quick Access</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {quickLinks.map(({ label, desc, icon: Icon, href, color }) => (
            <button
              key={href}
              onClick={() => navigate(href)}
              className="flex items-center gap-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-left hover:shadow-md hover:border-indigo-100 transition group"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 group-hover:text-indigo-600 transition">{label}</p>
                <p className="text-sm text-gray-500">{desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
