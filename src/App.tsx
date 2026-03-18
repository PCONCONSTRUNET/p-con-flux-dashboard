import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import ClientLayout from "@/components/layout/ClientLayout";
import AdminLayout from "@/components/layout/AdminLayout";

import Login from "@/pages/Login";
import ForgotPassword from "@/pages/ForgotPassword";
import AdminLogin from "@/pages/admin/AdminLogin";
import ClientDashboard from "@/pages/client/Dashboard";
import LiveCatalog from "@/pages/client/LiveCatalog";
import History from "@/pages/client/History";
import Profile from "@/pages/client/Profile";
import AdminDashboard from "@/pages/admin/Dashboard";
import Patterns from "@/pages/admin/Patterns";
import UsersPage from "@/pages/admin/Users";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const AuthRedirect = () => {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Navigate to={user?.role === 'admin' ? '/admin' : '/client'} replace />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<AuthRedirect />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/admin/login" element={<AdminLogin />} />

            {/* Client routes */}
            <Route path="/client" element={<ProtectedRoute role="client"><ClientLayout><ClientDashboard /></ClientLayout></ProtectedRoute>} />
            <Route path="/client/catalog" element={<ProtectedRoute role="client"><ClientLayout><LiveCatalog /></ClientLayout></ProtectedRoute>} />
            <Route path="/client/history" element={<ProtectedRoute role="client"><ClientLayout><History /></ClientLayout></ProtectedRoute>} />
            <Route path="/client/profile" element={<ProtectedRoute role="client"><ClientLayout><Profile /></ClientLayout></ProtectedRoute>} />

            {/* Admin routes */}
            <Route path="/admin" element={<ProtectedRoute role="admin"><AdminLayout><AdminDashboard /></AdminLayout></ProtectedRoute>} />
            <Route path="/admin/patterns" element={<ProtectedRoute role="admin"><AdminLayout><Patterns /></AdminLayout></ProtectedRoute>} />
            <Route path="/admin/catalog" element={<ProtectedRoute role="admin"><AdminLayout><LiveCatalog /></AdminLayout></ProtectedRoute>} />
            <Route path="/admin/history" element={<ProtectedRoute role="admin"><AdminLayout><History /></AdminLayout></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute role="admin"><AdminLayout><UsersPage /></AdminLayout></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
