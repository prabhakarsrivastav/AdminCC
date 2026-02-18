import { useEffect, useState, useMemo } from "react";
import { api } from "@/lib/api";

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Briefcase,
  TrendingUp,
  Users,
  DollarSign,
  Calendar,
  BarChart3,
  Activity,
  CreditCard,
  MessageSquare,
  BookOpen,
  Settings,
  Plus,
  Eye,
  Search,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Target,
  Award,
  Clock,
} from "lucide-react";
import { useDarkMode } from "@/contexts/DarkModeContext";

const Dashboard = () => {
  const { isDarkMode } = useDarkMode();
  const [stats, setStats] = useState({
    totalServices: 0,
    avgRating: 0,
    totalReviews: 0,
    totalUsers: 0,
    totalPayments: 0,
    totalRevenue: 0,
    pendingConsultations: 0,
    activeWebinars: 0,
    totalProducts: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);

      // Fetch services data
      const services = await api.services.getAll();
      const totalServices = services?.length || 0;
      const totalReviews = services?.reduce((acc: number, s: any) => acc + (s.reviews || 0), 0) || 0;
      const avgRating = totalServices > 0 ? services?.reduce((acc: number, s: any) => acc + (s.rating || 0), 0) / totalServices : 0;

      // Fetch users data
      const usersResponse = await api.admin.users.getAll();
      const users = usersResponse.data || [];
      const totalUsers = users?.length || 0;

      // Fetch payments data
      const paymentsResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/admin/payments`, {
        headers: getAuthHeaders(),
      });
      const paymentsData = paymentsResponse.ok ? await paymentsResponse.json() : { data: [] };
      const payments = paymentsData.data || [];
      const totalPayments = payments?.length || 0;
      const totalRevenue = payments?.reduce((acc: number, p: any) => acc + (p.amount || 0), 0) || 0;

      // Fetch consultations data
      const consultationsResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/consultations/admin/all`, {
        headers: getAuthHeaders(),
      });
      const consultationsData = consultationsResponse.ok ? await consultationsResponse.json() : { data: [] };
      const consultations = consultationsData.data || [];
      const pendingConsultations = consultations?.filter((c: any) => c.status === 'pending').length || 0;

      // Fetch webinars data
      const webinarsResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/webinars/admin/all`, {
        headers: getAuthHeaders(),
      });
      const webinarsData = webinarsResponse.ok ? await webinarsResponse.json() : { data: [] };
      const webinars = webinarsData.data || [];
      const activeWebinars = webinars?.filter((w: any) => new Date(w.date) > new Date()).length || 0;

      // Fetch products data
      const productsResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/products/admin/all`, {
        headers: getAuthHeaders(),
      });
      const productsData = productsResponse.ok ? await productsResponse.json() : { data: [] };
      const products = productsData.data || [];
      const totalProducts = products?.length || 0;

      setStats({
        totalServices,
        avgRating: Number(avgRating.toFixed(1)),
        totalReviews,
        totalUsers,
        totalPayments,
        totalRevenue,
        pendingConsultations,
        activeWebinars,
        totalProducts,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: "Total Services",
      value: stats.totalServices,
      icon: Briefcase,
      description: "Active services available",
      color: "text-blue-500",
      bgColor: "from-blue-500/10 to-blue-600/10",
      trend: "+12%",
      trendUp: true,
    },
    {
      title: "Total Revenue",
      value: `$${(stats.totalRevenue / 100).toFixed(0)}`,
      icon: DollarSign,
      description: "Revenue generated",
      color: "text-green-500",
      bgColor: "from-green-500/10 to-green-600/10",
      trend: "+8%",
      trendUp: true,
    },
    {
      title: "Total Users",
      value: stats.totalUsers,
      icon: Users,
      description: "Registered users",
      color: "text-purple-500",
      bgColor: "from-purple-500/10 to-purple-600/10",
      trend: "+15%",
      trendUp: true,
    },
    {
      title: "Active Webinars",
      value: stats.activeWebinars,
      icon: Calendar,
      description: "Upcoming webinars",
      color: "text-orange-500",
      bgColor: "from-orange-500/10 to-orange-600/10",
      trend: "+5%",
      trendUp: true,
    },
    {
      title: "Pending Consultations",
      value: stats.pendingConsultations,
      icon: MessageSquare,
      description: "Awaiting response",
      color: "text-yellow-500",
      bgColor: "from-yellow-500/10 to-yellow-600/10",
      trend: "-3%",
      trendUp: false,
    },
    {
      title: "Total Products",
      value: stats.totalProducts,
      icon: BookOpen,
      description: "Available products",
      color: "text-indigo-500",
      bgColor: "from-indigo-500/10 to-indigo-600/10",
      trend: "+7%",
      trendUp: true,
    },
    {
      title: "Average Rating",
      value: stats.avgRating,
      icon: Award,
      description: "Service quality",
      color: "text-amber-500",
      bgColor: "from-amber-500/10 to-amber-600/10",
      trend: "+2%",
      trendUp: true,
    },
    {
      title: "Total Reviews",
      value: stats.totalReviews,
      icon: BarChart3,
      description: "Customer feedback",
      color: "text-cyan-500",
      bgColor: "from-cyan-500/10 to-cyan-600/10",
      trend: "+10%",
      trendUp: true,
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Header */}
      <div className="relative overflow-hidden bg-white dark:bg-black backdrop-blur-sm border-b border-gray-200 dark:border-gray-800">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-cyan-500/5"></div>
        <div className="relative p-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-black dark:text-white mb-2 bg-gradient-to-r from-black via-blue-900 to-black dark:from-white dark:via-blue-100 dark:to-white bg-clip-text text-transparent">
                Admin Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-lg">Welcome back! Here's what's happening with your platform</p>
            </div>
            <div className="flex items-center gap-4">
              <Button
                onClick={fetchStats}
                disabled={loading}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh Data
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-8 space-y-8">
        {/* Statistics Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat, index) => (
            <Card key={stat.title} className="group relative overflow-hidden bg-gray-200/50 dark:bg-gray-800/50 border-gray-300 dark:border-gray-700 hover:bg-gray-300/70 dark:hover:bg-gray-800/70 backdrop-blur-sm shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:scale-[1.02] hover:-translate-y-1">
              {/* Background Gradient */}
              <div className={`absolute top-0 right-0 w-24 h-24 rounded-full -mr-12 -mt-12 opacity-20 group-hover:opacity-30 transition-opacity duration-500 bg-gradient-to-br ${stat.bgColor}`}></div>

              <CardHeader className="relative pb-3">
                <div className="flex items-center justify-between">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.bgColor} backdrop-blur-sm border border-gray-400/50 dark:border-gray-600/50`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <div className={`flex items-center gap-1 text-sm font-medium ${stat.trendUp ? 'text-green-400' : 'text-red-400'}`}>
                    {stat.trendUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {stat.trend}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="text-3xl font-bold text-black dark:text-white mb-1 group-hover:scale-110 transition-transform duration-300">
                  {stat.value}
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">{stat.description}</p>
                <div className="mt-3 h-1 bg-gray-300 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${stat.bgColor} rounded-full transition-all duration-1000 ease-out`}
                    style={{ width: `${Math.min((typeof stat.value === 'string' ? parseInt(stat.value.replace('$', '').replace(',', '')) : stat.value) / 100 * 100, 100)}%` }}
                  ></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions Section */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Manage Services */}
          <Card className="group relative overflow-hidden bg-gradient-to-br from-gray-200/50 to-gray-300/50 dark:from-gray-800/50 dark:to-gray-900/50 border-gray-300 dark:border-gray-700 hover:border-blue-500/50 backdrop-blur-sm shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:scale-[1.02] cursor-pointer">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <CardHeader className="relative">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30">
                  <Briefcase className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-black dark:text-white text-lg group-hover:text-blue-400 transition-colors duration-300">
                    Manage Services
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">
                    Add, edit, or remove settlement services
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative">
              <Button className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <Eye className="h-4 w-4 mr-2" />
                View Services
              </Button>
            </CardContent>
          </Card>

          {/* User Management */}
          <Card className="group relative overflow-hidden bg-gradient-to-br from-gray-200/50 to-gray-300/50 dark:from-gray-800/50 dark:to-gray-900/50 border-gray-300 dark:border-gray-700 hover:border-purple-500/50 backdrop-blur-sm shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:scale-[1.02] cursor-pointer">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <CardHeader className="relative">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30">
                  <Users className="h-6 w-6 text-purple-400" />
                </div>
                <div>
                  <CardTitle className="text-black dark:text-white text-lg group-hover:text-purple-400 transition-colors duration-300">
                    User Management
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">
                    Manage user accounts and permissions
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative">
              <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <Users className="h-4 w-4 mr-2" />
                Manage Users
              </Button>
            </CardContent>
          </Card>

          {/* View Analytics */}
          <Card className="group relative overflow-hidden bg-gradient-to-br from-gray-200/50 to-gray-300/50 dark:from-gray-800/50 dark:to-gray-900/50 border-gray-300 dark:border-gray-700 hover:border-green-500/50 backdrop-blur-sm shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:scale-[1.02] cursor-pointer">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <CardHeader className="relative">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30">
                  <BarChart3 className="h-6 w-6 text-green-400" />
                </div>
                <div>
                  <CardTitle className="text-black dark:text-white text-lg group-hover:text-green-400 transition-colors duration-300">
                    Analytics & Reports
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">
                    View detailed analytics and insights
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative">
              <Button className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <BarChart3 className="h-4 w-4 mr-2" />
                View Analytics
              </Button>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="group relative overflow-hidden bg-gradient-to-br from-gray-200/50 to-gray-300/50 dark:from-gray-800/50 dark:to-gray-900/50 border-gray-300 dark:border-gray-700 hover:border-orange-500/50 backdrop-blur-sm shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:scale-[1.02] md:col-span-2 lg:col-span-3">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-yellow-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <CardHeader className="relative">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500/20 to-yellow-500/20 border border-orange-500/30">
                  <Activity className="h-6 w-6 text-orange-400" />
                </div>
                <div>
                  <CardTitle className="text-black dark:text-white text-lg group-hover:text-orange-400 transition-colors duration-300">
                    Recent Activity
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">
                    Latest platform activity and notifications
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-gray-300/30 dark:bg-gray-700/30 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-700 dark:text-gray-300">New user registration</p>
                    <p className="text-xs text-gray-500">2 minutes ago</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-300/30 dark:bg-gray-700/30 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-700 dark:text-gray-300">Payment processed successfully</p>
                    <p className="text-xs text-gray-500">5 minutes ago</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-300/30 dark:bg-gray-700/30 rounded-lg">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-700 dark:text-gray-300">Consultation request received</p>
                    <p className="text-xs text-gray-500">10 minutes ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
