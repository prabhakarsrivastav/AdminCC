import { useState } from "react";
import { Outlet, NavLink, useNavigate, Link } from "react-router-dom";
import canadaLogo from "@/assets/canada-logo.png";
import { useDarkMode } from "@/contexts/DarkModeContext";

import {
  LayoutDashboard,
  Settings,
  LogOut,
  Menu,
  X,
  Briefcase,
  CreditCard,
  RefreshCw,
  Calendar,
  Users,
  Video,
  BookOpen,
  BarChart3,
  TrendingUp,
  Moon,
  Sun,
  ShoppingCart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { authHelpers } from "@/lib/api";
import { clearAuthCache } from "./RouteGuard";

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const navigate = useNavigate();
  const { isDarkMode, toggleDarkMode } = useDarkMode();

  const handleLogout = () => {
    authHelpers.removeToken();
    clearAuthCache();
    setShowLogoutDialog(false);
    // Use replace to avoid adding to browser history
    window.location.replace(window.location.origin);
  };

  const navItems = [
    { to: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/admin/payments", icon: CreditCard, label: "Payment Management" },
    { to: "/admin/orders", icon: ShoppingCart, label: "Order Management" },
    { to: "/admin/refunds", icon: RefreshCw, label: "Refund Requests" },
    { to: "/admin/services", icon: Briefcase, label: "Manage Services" },
    { to: "/admin/products", icon: BookOpen, label: "Products & Courses" },
    { to: "/admin/consultations", icon: Calendar, label: "Consultations" },
    { to: "/admin/webinars", icon: Video, label: "Webinars" },
    { to: "/admin/users", icon: Users, label: "User Management" },
    { to: "/admin/analytics/services", icon: BarChart3, label: "Services Analytics" },
    { to: "/admin/analytics/ebooks-courses", icon: TrendingUp, label: "E-books & Courses" },
    { to: "/admin/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <div className={`min-h-screen flex w-full ${isDarkMode ? 'bg-black' : 'bg-gray-50'}`}>
      {/* Sidebar */}
      <aside
        className={`
          ${sidebarOpen ? "w-64" : "w-20"} 
          ${isDarkMode ? 'bg-black border-gray-800' : 'bg-white border-gray-200'}
          border-r
          transition-all duration-300 ease-in-out
          fixed h-full z-40 shadow-sm
          flex flex-col
        `}
      >
        {/* Logo & Toggle */}
        <div className={`h-16 flex items-center px-4 border-b ${isDarkMode ? 'border-gray-800' : 'border-gray-200'} flex-shrink-0`}>
          {sidebarOpen && (
             <Link to="/admin/dashboard" className="flex items-center space-x-2 group flex-1 min-w-0">
          <div className="relative flex-shrink-0">
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full group-hover:bg-primary/30 transition-all duration-300"></div>
            <img src={canadaLogo} alt="Canada Navigate" className="h-10 w-10 rounded-xl relative shadow-[0_4px_16px_rgba(0,0,0,0.1)] group-hover:scale-110 transition-transform duration-300" />
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-base font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text truncate">ConnectCanada.io</span>
            <span className="text-[9px] text-muted-foreground truncate">Admin Portal</span>
          </div>
        </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`ml-auto flex-shrink-0 ${isDarkMode ? 'hover:bg-gray-900 text-gray-300' : 'hover:bg-gray-100 text-gray-700'}`}
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-3 rounded-lg transition-all ${
                  isActive
                    ? isDarkMode
                      ? "bg-blue-950 text-blue-400 font-semibold border border-blue-900"
                      : "bg-blue-50 text-blue-700 font-semibold border border-blue-200"
                    : isDarkMode
                      ? "text-gray-300 hover:bg-gray-900"
                      : "text-gray-700 hover:bg-gray-100"
                }`
              }
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {sidebarOpen && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Dark Mode Toggle & Logout */}
        <div className={`p-4 border-t ${isDarkMode ? 'border-gray-800' : 'border-gray-200'} flex-shrink-0 space-y-2`}>
          {/* Dark Mode Toggle */}
          <Button
            variant="ghost"
            onClick={toggleDarkMode}
            className={`w-full justify-start ${isDarkMode ? 'text-gray-300 hover:bg-gray-900 hover:text-yellow-400' : 'text-gray-700 hover:bg-gray-100'} transition-colors`}
          >
            {isDarkMode ? <Sun className="h-5 w-5 shrink-0" /> : <Moon className="h-5 w-5 shrink-0" />}
            {sidebarOpen && <span className="ml-3">{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>}
          </Button>
          <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                className={`w-full justify-start ${isDarkMode ? 'text-gray-300 hover:bg-red-950 hover:text-red-400' : 'text-gray-700 hover:bg-red-50 hover:text-red-600'} transition-colors`}
              >
                <LogOut className="h-5 w-5 shrink-0" />
                {sidebarOpen && <span className="ml-3">Logout</span>}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className={isDarkMode ? 'bg-black border-gray-800 text-white' : ''}>
              <AlertDialogHeader>
                <AlertDialogTitle className={isDarkMode ? 'text-white' : ''}>Confirm Logout</AlertDialogTitle>
                <AlertDialogDescription className={isDarkMode ? 'text-gray-400' : ''}>
                  Are you sure you want to sign out? You will need to log in again to access the admin panel.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className={isDarkMode ? 'bg-gray-900 text-white border-gray-800 hover:bg-gray-800' : ''}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleLogout} className="bg-red-600 hover:bg-red-700">
                  Sign Out
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={`
          ${sidebarOpen ? "ml-64" : "ml-20"}
          flex-1 transition-all duration-300 ease-in-out ${isDarkMode ? 'bg-black' : 'bg-gray-50'} min-h-screen
        `}
      >
        <div className="p-0">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
