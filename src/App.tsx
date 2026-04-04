import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import AppLayout from "./components/AppLayout";
import Index from "./pages/Index";
import SOSPage from "./pages/SOSPage";
import RoutesPage from "./pages/RoutesPage";
import ServicesPage from "./pages/ServicesPage";
import ProfilePage from "./pages/ProfilePage";
import GuardiansPage from "./pages/GuardiansPage";
import IncidentsPage from "./pages/IncidentsPage";
import TripsPage from "./pages/TripsPage";
import AuthPage from "./pages/AuthPage";
import OnboardingPage from "./pages/OnboardingPage";
import LiveTrackingPage from "./pages/LiveTrackingPage";
import SplashPage from "./pages/SplashPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, isDemo } = useAuth();
  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!user && !isDemo) return <Navigate to="/splash" replace />;
  return <>{children}</>;
};

const AuthRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, isDemo } = useAuth();
  if (loading) return null;
  if (user || isDemo) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const SplashRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, isDemo } = useAuth();
  if (loading) return null;
  if (user || isDemo) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/splash" element={<SplashRoute><SplashPage /></SplashRoute>} />
            <Route path="/auth" element={<AuthRoute><AuthPage /></AuthRoute>} />
            <Route path="/onboarding" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />
            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route path="/" element={<Index />} />
              <Route path="/sos" element={<SOSPage />} />
              <Route path="/routes" element={<RoutesPage />} />
              <Route path="/services" element={<ServicesPage />} />
              <Route path="/guardians" element={<GuardiansPage />} />
              <Route path="/incidents" element={<IncidentsPage />} />
              <Route path="/trips" element={<TripsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/live-tracking" element={<LiveTrackingPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
