import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import Profile from "./pages/Profile";
import BrowseProjects from "./pages/BrowseProjects";
import ProjectDetails from "./pages/ProjectDetails";
import PublicProfile from "./pages/PublicProfile";
import DeveloperDashboard from "./pages/dashboard/DeveloperDashboard";
import FreelancerDashboard from "./pages/dashboard/FreelancerDashboard";

import PostProject from "./pages/dashboard/PostProject";
import Settings from "./pages/dashboard/Settings";
import FindFreelancers from "./pages/dashboard/FindFreelancers";
import Messages from "./pages/dashboard/Messages";
import Payments from "./pages/dashboard/Payments";
import MyBids from "./pages/MyBids";
import MyProjects from "./pages/MyProjects";
import AppliedProjects from "./pages/dashboard/AppliedProjects";
import NotFound from "./pages/NotFound";
import DashboardLayout from "@/components/layout/DashboardLayout";
import MainLayout from "@/components/layout/MainLayout";

const queryClient = new QueryClient();

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) => {
  const { user, userProfile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && userProfile && !allowedRoles.includes(userProfile.role)) {
    // Redirect to appropriate dashboard based on role

    if (userProfile.role === 'developer') return <Navigate to="/developer" replace />;
    if (userProfile.role === 'freelancer') return <Navigate to="/freelancer" replace />;
  }

  return <>{children}</>;
};

// Dashboard redirect component
const DashboardRedirect = () => {
  const { userProfile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!userProfile) return <Navigate to="/login" replace />;

  switch (userProfile.role) {

    case 'developer':
      return <Navigate to="/developer" replace />;
    case 'freelancer':
      return <Navigate to="/freelancer" replace />;
    default:
      return <Navigate to="/" replace />;
  }
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        {/* Public Routes */}
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/projects" element={<BrowseProjects />} />
        <Route path="/projects/:id" element={<ProjectDetails />} />
      </Route>

      {/* Dashboard Redirect */}
      <Route path="/dashboard" element={<ProtectedRoute><DashboardRedirect /></ProtectedRoute>} />

      {/* Developer Routes */}
      <Route
        path="/developer"
        element={
          <ProtectedRoute allowedRoles={['developer']}>
            <DeveloperDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/developer/settings"
        element={
          <ProtectedRoute allowedRoles={['developer']}>
            <Settings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/developer/projects/new"
        element={
          <ProtectedRoute allowedRoles={['developer']}>
            <PostProject />
          </ProtectedRoute>
        }
      />
      <Route
        path="/developer/freelancers"
        element={
          <ProtectedRoute allowedRoles={['developer']}>
            <FindFreelancers />
          </ProtectedRoute>
        }
      />
      <Route
        path="/developer/applied-projects"
        element={
          <ProtectedRoute allowedRoles={['developer']}>
            <AppliedProjects />
          </ProtectedRoute>
        }
      />
      <Route
        path="/developer/messages"
        element={
          <ProtectedRoute allowedRoles={['developer']}>
            <Messages />
          </ProtectedRoute>
        }
      />
      <Route
        path="/developer/payments"
        element={
          <ProtectedRoute allowedRoles={['developer']}>
            <Payments />
          </ProtectedRoute>
        }
      />
      <Route
        path="/developer/my-projects"
        element={
          <ProtectedRoute allowedRoles={['developer']}>
            <MyProjects />
          </ProtectedRoute>
        }
      />
      <Route
        path="/developer/*"
        element={
          <ProtectedRoute allowedRoles={['developer']}>
            <DeveloperDashboard />
          </ProtectedRoute>
        }
      />

      {/* Freelancer Routes */}
      <Route
        path="/freelancer/settings"
        element={
          <ProtectedRoute allowedRoles={['freelancer']}>
            <Settings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/freelancer"
        element={
          <ProtectedRoute allowedRoles={['freelancer']}>
            <FreelancerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/freelancer/projects"
        element={
          <ProtectedRoute allowedRoles={['freelancer']}>
            <DashboardLayout role="freelancer">
              <BrowseProjects isInDashboard={true} />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/freelancer/*"
        element={
          <ProtectedRoute allowedRoles={['freelancer']}>
            <FreelancerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/freelancer/messages"
        element={
          <ProtectedRoute allowedRoles={['freelancer']}>
            <Messages />
          </ProtectedRoute>
        }
      />
      <Route
        path="/freelancer/bids"
        element={
          <ProtectedRoute allowedRoles={['freelancer']}>
            <MyBids />
          </ProtectedRoute>
        }
      />
      <Route
        path="/freelancer/my-projects"
        element={
          <ProtectedRoute allowedRoles={['freelancer']}>
            <MyProjects />
          </ProtectedRoute>
        }
      />



      {/* Profile Routes */}
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile/:id"
        element={
          <ProtectedRoute>
            <PublicProfile />
          </ProtectedRoute>
        }
      />

      {/* Catch-all */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
