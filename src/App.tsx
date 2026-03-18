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
import Checkout from "@/pages/client/Checkout";
import AdminDashboard from "@/pages/admin/Dashboard";
import Patterns from "@/pages/admin/Patterns";
import PatternFlow from "@/pages/admin/PatternFlow";
import Integrations from "@/pages/admin/Integrations";

import ClientsPage from "@/pages/admin/Clients";
import PaymentsPage from "@/pages/admin/Payments";
import NotFound from "@/pages/NotFound";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import UpgradeModal from "@/components/UpgradeModal";

const queryClient = new QueryClient();

const AuthRedirect = () => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Navigate to="/client" replace />;
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
            <Route path="/client" element={<ProtectedRoute role="client"><SubscriptionProvider><ClientLayout><UpgradeModal /><ClientDashboard /></ClientLayout></SubscriptionProvider></ProtectedRoute>} />
            <Route path="/client/catalog" element={<ProtectedRoute role="client"><SubscriptionProvider><ClientLayout><UpgradeModal /><LiveCatalog /></ClientLayout></SubscriptionProvider></ProtectedRoute>} />
            <Route path="/client/history" element={<ProtectedRoute role="client"><SubscriptionProvider><ClientLayout><UpgradeModal /><History /></ClientLayout></SubscriptionProvider></ProtectedRoute>} />
            <Route path="/client/profile" element={<ProtectedRoute role="client"><SubscriptionProvider><ClientLayout><UpgradeModal /><Profile /></ClientLayout></SubscriptionProvider></ProtectedRoute>} />
            <Route path="/client/checkout" element={<ProtectedRoute role="client"><Checkout /></ProtectedRoute>} />

            {/* Admin routes */}
            <Route path="/admin" element={<ProtectedRoute role="admin"><AdminLayout><AdminDashboard /></AdminLayout></ProtectedRoute>} />
            <Route path="/admin/patterns" element={<ProtectedRoute role="admin"><AdminLayout><Patterns /></AdminLayout></ProtectedRoute>} />
            <Route path="/admin/pattern-flow" element={<ProtectedRoute role="admin"><AdminLayout><PatternFlow /></AdminLayout></ProtectedRoute>} />
            
            <Route path="/admin/clients" element={<ProtectedRoute role="admin"><AdminLayout><ClientsPage /></AdminLayout></ProtectedRoute>} />
            <Route path="/admin/payments" element={<ProtectedRoute role="admin"><AdminLayout><PaymentsPage /></AdminLayout></ProtectedRoute>} />
            <Route path="/admin/integrations" element={<ProtectedRoute role="admin"><AdminLayout><Integrations /></AdminLayout></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
