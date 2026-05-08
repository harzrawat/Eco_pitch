import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Search,
  BookOpen,
  Users,
  GitMerge,
  Calendar,
  Coins,
  Menu,
  X,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/skills", label: "Browse Skills", icon: Search },
  { href: "/my-skills", label: "My Skills", icon: BookOpen },
  { href: "/skill-requests", label: "Skill Requests", icon: Users },
  { href: "/matches", label: "My Matches", icon: GitMerge },
  { href: "/sessions", label: "My Sessions", icon: Calendar },
  { href: "/credits", label: "Credits Wallet", icon: Coins },
];

function NavLink({ href, label, icon: Icon }: { href: string; label: string; icon: React.ElementType }) {
  const [location] = useLocation();
  const active = location === href || (href !== "/dashboard" && location.startsWith(href));

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
        active
          ? "bg-indigo-600 text-white shadow-sm"
          : "text-slate-300 hover:bg-white/10 hover:text-white"
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {label}
    </Link>
  );
}

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { user, logout } = useAuthStore();
  const [, navigate] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const Sidebar = (
    <nav className="flex flex-col h-full py-6 px-3 gap-1">
      {/* Logo */}
      <div className="flex items-center gap-2 px-3 mb-6">
        <div className="w-8 h-8 rounded-lg bg-indigo-400 flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        </div>
        <span className="text-white font-bold text-base">SkillXchange</span>
      </div>

      {NAV_ITEMS.map((item) => (
        <NavLink key={item.href} {...item} />
      ))}

      {/* User footer */}
      <div className="mt-auto pt-4 border-t border-white/10">
        <div className="flex items-center gap-2 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-indigo-400 flex items-center justify-center text-white font-semibold text-sm">
            {user?.name?.[0]?.toUpperCase() ?? "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
            <p className="text-xs text-slate-400 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-white/10 transition mt-1"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 bg-slate-900 shrink-0 fixed inset-y-0 left-0 z-30">
        {Sidebar}
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 inset-y-0 w-56 bg-slate-900 flex flex-col z-50">
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
            {Sidebar}
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 md:ml-56 flex flex-col min-h-screen">
        {/* Top navbar (mobile) */}
        <header className="md:hidden sticky top-0 z-20 bg-white border-b border-gray-200 px-4 h-14 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-500">
            <Menu className="h-5 w-5" />
          </button>
          <span className="font-bold text-gray-900 text-sm">SkillXchange</span>

          {/* Top navbar credits badge */}
          <div className="flex items-center gap-1.5 text-sm font-medium text-amber-700 bg-amber-50 px-2 py-1 rounded-full border border-amber-200">
            <Coins className="h-3.5 w-3.5" />
            {user?.credits ?? 0}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
