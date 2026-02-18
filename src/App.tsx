import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { DarkModeProvider } from "./contexts/DarkModeContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import AdminLayout from "./components/AdminLayout";
import RouteGuard from "./components/RouteGuard";
import Dashboard from "./pages/admin/Dashboard";
import ManageServices from "./pages/admin/ManageServices";
import Payments from "./pages/admin/Payments";
import Refunds from "./pages/admin/Refunds";
import Settings from "./pages/admin/Settings";
import Consultations from "./pages/admin/Consultations";
import Users from "./pages/admin/Users";
import Webinars from "./pages/admin/Webinars";
import AddWebinar from "./pages/admin/AddWebinar";
import EditWebinar from "./pages/admin/EditWebinar";
import Products from "./pages/admin/Products";
import ServiceSalesAnalytics from "./pages/admin/ServiceSalesAnalytics";
import CoursesProductsAnalytics from "./pages/admin/CoursesProductsAnalytics";
import ServicesAnalytics from "./pages/admin/ServicesAnalytics";
import OrderManagement from "./pages/admin/OrderManagement";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <DarkModeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
        <Routes>
          {/* Show login page as the root for admin environment */}
          <Route path="/" element={<Auth />} />
          {/* Keep the public index available at /home */}
          {/* <Route path="/home" element={<Index />} /> */}
          <Route
            path="/admin"
            element={
              <RouteGuard requireAdmin={true}>
                <AdminLayout />
              </RouteGuard>
            }
          >
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="payments" element={<Payments />} />
            <Route path="refunds" element={<Refunds />} />
            <Route path="services" element={<ManageServices />} />
            <Route path="consultations" element={<Consultations />} />
            <Route path="users" element={<Users />} />
            <Route path="webinars" element={<Webinars />} />
            <Route path="webinars/add" element={<AddWebinar />} />
            <Route path="webinars/edit/:id" element={<EditWebinar />} />
            <Route path="products" element={<Products />} />
            <Route path="analytics/services" element={<ServicesAnalytics />} />
            <Route path="analytics/ebooks-courses" element={<CoursesProductsAnalytics />} />
            <Route path="orders" element={<OrderManagement />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          {/* Auth routes */}
          <Route path="/login" element={<Navigate to="/" replace />} />
          <Route path="/auth" element={<Navigate to="/" replace />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      </TooltipProvider>
    </DarkModeProvider>
  </QueryClientProvider>
);

export default App;
