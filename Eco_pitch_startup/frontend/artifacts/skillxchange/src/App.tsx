import { useEffect, lazy, Suspense } from "react";
import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { Loader2 } from "lucide-react";
import { useAuthStore } from "./store/authStore";
import { apiGetMe } from "./api/auth.api";

const LoginPage = lazy(() => import("./pages/auth/LoginPage"));
const RegisterPage = lazy(() => import("./pages/auth/RegisterPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const SkillsMarketplacePage = lazy(() => import("./pages/skills/SkillsMarketplacePage"));
const SkillDetailPage = lazy(() => import("./pages/skills/SkillDetailPage"));
const MySkillsPage = lazy(() => import("./pages/skills/MySkillsPage"));
const CreateSkillPage = lazy(() => import("./pages/skills/CreateSkillPage"));
const EditSkillPage = lazy(() => import("./pages/skills/EditSkillPage"));
const SkillRequestsPage = lazy(() => import("./pages/skill-requests/SkillRequestsPage"));
const ProfilePage = lazy(() => import("./pages/profile/ProfilePage"));
const EditProfilePage = lazy(() => import("./pages/profile/EditProfilePage"));
const MyMatchesPage = lazy(() => import("./pages/matches/MyMatchesPage"));
const MySessionsPage = lazy(() => import("./pages/sessions/MySessionsPage"));
const CreditsPage = lazy(() => import("./pages/credits/CreditsPage"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60,
    },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();
  if (isLoading) return null;
  if (!isAuthenticated) return <Redirect to="/login" />;
  return <>{children}</>;
}

const PageFallback = (
  <div className="min-h-screen flex items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
  </div>
);

function AppRouter() {
  return (
    <Suspense fallback={PageFallback}>
      <Switch>
        {/* Auth */}
        <Route path="/login" component={LoginPage} />
        <Route path="/register" component={RegisterPage} />

        {/* Protected */}
        <Route path="/dashboard">
          <ProtectedRoute><DashboardPage /></ProtectedRoute>
        </Route>
        <Route path="/skills/:id">
          <ProtectedRoute><SkillDetailPage /></ProtectedRoute>
        </Route>
        <Route path="/skills">
          <ProtectedRoute><SkillsMarketplacePage /></ProtectedRoute>
        </Route>
        <Route path="/my-skills/new">
          <ProtectedRoute><CreateSkillPage /></ProtectedRoute>
        </Route>
        <Route path="/my-skills/:id/edit">
          <ProtectedRoute><EditSkillPage /></ProtectedRoute>
        </Route>
        <Route path="/my-skills">
          <ProtectedRoute><MySkillsPage /></ProtectedRoute>
        </Route>
        <Route path="/skill-requests">
          <ProtectedRoute><SkillRequestsPage /></ProtectedRoute>
        </Route>
        <Route path="/profile/edit">
          <ProtectedRoute><EditProfilePage /></ProtectedRoute>
        </Route>
        <Route path="/profile/:id">
          <ProtectedRoute><ProfilePage /></ProtectedRoute>
        </Route>
        <Route path="/matches">
          <ProtectedRoute><MyMatchesPage /></ProtectedRoute>
        </Route>
        <Route path="/sessions">
          <ProtectedRoute><MySessionsPage /></ProtectedRoute>
        </Route>
        <Route path="/credits">
          <ProtectedRoute><CreditsPage /></ProtectedRoute>
        </Route>

        {/* Default */}
        <Route path="/">
          <Redirect to="/dashboard" />
        </Route>
        <Route>
          <Redirect to="/dashboard" />
        </Route>
      </Switch>
    </Suspense>
  );
}

function AuthHydrator({ children }: { children: React.ReactNode }) {
  const { login, logout, setLoading } = useAuthStore();

  useEffect(() => {
    const storedToken = localStorage.getItem("skillxchange_token");
    if (!storedToken) {
      setLoading(false);
      return;
    }

    apiGetMe()
      .then((user) => {
        login(storedToken, user);
      })
      .catch(() => {
        logout();
      });
  }, []);

  return <>{children}</>;
}

function FullScreenLoader() {
  const { isLoading } = useAuthStore();
  if (!isLoading) return null;
  return (
    <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        </div>
        <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter>
        <AuthHydrator>
          <FullScreenLoader />
          <AppRouter />
        </AuthHydrator>
      </WouterRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            borderRadius: "10px",
            background: "#1f2937",
            color: "#f9fafb",
            fontSize: "14px",
          },
        }}
      />
    </QueryClientProvider>
  );
}

export default App;
