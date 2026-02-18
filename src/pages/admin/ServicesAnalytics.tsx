import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, ComposedChart, Line, AreaChart, Area, Legend,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from "recharts";
import { 
  Briefcase, TrendingUp, DollarSign, Users, Star, Award, Download, 
  RefreshCw, Filter, Calendar, Activity, Target, Zap, Clock,
  ArrowUpRight, ArrowDownRight, AlertCircle, BarChart3, TrendingDown,
  Sparkles, Eye, Heart, ShoppingBag,
  PieChartIcon
} from "lucide-react";
import { toast } from "sonner";
import api from "@/utils/api";
import { useDarkMode } from "@/contexts/DarkModeContext";

interface ServicesAnalytics {
  serviceBreakdown: Array<{
    _id: string;
    count: number;
    totalRevenue: number;
    recentBookings: Array<{
      date: string;
      customer: string;
      email: string;
      amount: number;
    }>;
  }>;
  monthlySales: Array<{
    _id: { year: number; month: number };
    count: number;
    revenue: number;
  }>;
  topServices: Array<{
    title: string;
    category: string;
    price: string;
    bookingCount: number;
    rating: number;
  }>;
  totalRevenue: number;
  totalBookings: number;
}

interface ServiceSalesData {
  _id: string;
  serviceName: string;
  category: string;
  price: string;
  totalSales: number;
  totalRevenue: number;
  totalRefunds: number;
  refundAmount: number;
  uniqueUserCount: number;
  netRevenue: number;
  lastSaleDate: string;
}

interface AdvancedMetrics {
  currentPeriod: {
    revenue: number;
    bookings: number;
    customers: number;
    avgOrderValue: number;
  };
  previousPeriod: {
    revenue: number;
    bookings: number;
    customers: number;
  };
  growth: {
    revenue: number;
    bookings: number;
    customers: number;
  };
  metrics: {
    conversionRate: number;
    customerLTV: number;
    avgPurchaseFrequency: number;
    predictedDailyRevenue: number;
    repeatCustomerRate: number;
    customerSatisfactionScore: number;
  };
  trends: {
    dailyRevenue: Array<{
      _id: { year: number; month: number; day: number };
      revenue: number;
      bookings: number;
    }>;
    peakHours: Array<{
      _id: number;
      bookings: number;
      revenue: number;
    }>;
  };
  categoryPerformance: Array<{
    _id: string;
    bookings: number;
    revenue: number;
    avgRevenue: number;
  }>;
  satisfaction: {
    totalCustomers: number;
    repeatCustomers: number;
    repeatRate: number;
    avgPurchasesPerCustomer: number;
  };
}

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];
const GRADIENT_COLORS = {
  green: ['#064e3b', '#10b981'],
  emerald: ['#022c22', '#10b981'],
  purple: ['#3b0764', '#8b5cf6'],
  orange: ['#7c2d12', '#f59e0b'],
  pink: ['#831843', '#ec4899'],
  teal: ['#134e4a', '#14b8a6'],
  amber: ['#78350f', '#f59e0b'],
  rose: ['#881337', '#fb7185']
};

export default function ServicesAnalytics() {
  const [analytics, setAnalytics] = useState<ServicesAnalytics | null>(null);
  const [serviceSalesTable, setServiceSalesTable] = useState<ServiceSalesData[]>([]);
  const [advancedMetrics, setAdvancedMetrics] = useState<AdvancedMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [timeRange, setTimeRange] = useState('90');
  const [activeView, setActiveView] = useState<'standard' | 'advanced'>('standard');
  const [activeTab, setActiveTab] = useState('overview');
  const [currentPage, setCurrentPage] = useState(1);
  const [allServicesCurrentPage, setAllServicesCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Filter states for services tables
  const [servicesWithSalesFilters, setServicesWithSalesFilters] = useState({
    category: 'all',
    search: '',
    minPrice: '',
    maxPrice: '',
    minSales: '',
    maxSales: ''
  });
  
  const [allServicesFilters, setAllServicesFilters] = useState({
    category: 'all',
    search: '',
    minPrice: '',
    maxPrice: '',
    minSales: '',
    maxSales: ''
  });
  
  const { isDarkMode } = useDarkMode();

  useEffect(() => {
    fetchAnalytics();
    fetchAdvancedMetrics();
    fetchServiceSalesTable(); // Load sales table data on component mount
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(() => {
        fetchAnalytics();
      }, 60000); // Refresh every minute
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  // Reset pagination when data changes
  useEffect(() => {
    setCurrentPage(1);
    setAllServicesCurrentPage(1);
  }, [serviceSalesTable]);

  // Reset pagination when filters change
  useEffect(() => {
    setAllServicesCurrentPage(1);
  }, [allServicesFilters]);

  const fetchAnalytics = async () => {
    try {
      console.log('📊 ServicesAnalytics: Starting to fetch analytics data...');

      const token = localStorage.getItem("authToken");
      if (!token) {
        console.error('❌ ServicesAnalytics: No auth token found');
        toast.error("Authentication required");
        setLoading(false);
        return;
      }

      console.log('🔑 ServicesAnalytics: Auth token found, making API call...');

      const response = await api.get('/admin/analytics/services');

      console.log('📈 ServicesAnalytics: Raw response received:', response);
      console.log('📊 ServicesAnalytics: Response data:', response.data);

      if (response.data.success && response.data.data) {
        console.log('✅ ServicesAnalytics: Setting analytics data:', response.data.data);

        // Validate data structure
        if (!response.data.data.serviceBreakdown || !Array.isArray(response.data.data.serviceBreakdown)) {
          console.error('❌ ServicesAnalytics: Invalid serviceBreakdown data:', response.data.data.serviceBreakdown);
          throw new Error('Invalid service breakdown data structure');
        }

        if (!response.data.data.monthlySales || !Array.isArray(response.data.data.monthlySales)) {
          console.error('❌ ServicesAnalytics: Invalid monthlySales data:', response.data.data.monthlySales);
          throw new Error('Invalid monthly sales data structure');
        }

        setAnalytics(response.data.data);
        setLastUpdated(new Date());
        if (!metricsLoading) {
          toast.success("Services analytics loaded successfully");
        }
      } else {
        console.error('❌ ServicesAnalytics: Invalid response structure:', response.data);
        throw new Error('Invalid response structure');
      }
    } catch (error: any) {
      console.error("❌ ServicesAnalytics: Error fetching analytics:", error);

      if (error.response) {
        console.error('❌ ServicesAnalytics: Response error:', {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers
        });

        if (error.response.status === 401) {
          toast.error("Authentication failed. Please log in again.");
        } else if (error.response.status === 403) {
          toast.error("Access denied. Admin privileges required.");
        } else {
          toast.error(`Failed to load analytics: ${error.response.data?.error || 'Unknown error'}`);
        }
      } else if (error.request) {
        console.error('❌ ServicesAnalytics: Network error:', error.request);
        toast.error("Network error. Please check your connection.");
      } else {
        console.error('❌ ServicesAnalytics: Request setup error:', error.message);
        toast.error("Failed to load services analytics");
      }
    } finally {
      console.log('🏁 ServicesAnalytics: Fetch operation completed');
      setLoading(false);
    }
  };

  const fetchServiceSalesTable = async () => {
    try {
      setTableLoading(true);
      console.log('📊 ServicesAnalytics: Fetching service sales table data...');

      const token = localStorage.getItem("authToken");
      if (!token) {
        console.error('❌ ServicesAnalytics: No auth token found');
        toast.error("Authentication required");
        return;
      }

      const response = await api.get('/admin/analytics/services/table');

      if (response.data.success && response.data.data) {
        console.log('✅ ServicesAnalytics: Service sales table data loaded:', response.data.data);
        setServiceSalesTable(response.data.data);
        toast.success("Service sales table loaded successfully");
      } else {
        console.error('❌ ServicesAnalytics: Invalid table response structure:', response.data);
        throw new Error('Invalid table response structure');
      }
    } catch (error: any) {
      console.error("❌ ServicesAnalytics: Error fetching service sales table:", error);

      if (error.response) {
        if (error.response.status === 401) {
          toast.error("Authentication failed. Please log in again.");
        } else if (error.response.status === 403) {
          toast.error("Access denied. Admin privileges required.");
        } else {
          toast.error(`Failed to load sales table: ${error.response.data?.error || 'Unknown error'}`);
        }
      } else if (error.request) {
        toast.error("Network error. Please check your connection.");
      } else {
        toast.error("Failed to load service sales table");
      }
    } finally {
      setTableLoading(false);
    }
  };

  const fetchAdvancedMetrics = async () => {
    try {
      setMetricsLoading(true);
      const token = localStorage.getItem("authToken");
      if (!token) return;

      const response = await api.get(`/admin/analytics/advanced/metrics?timeRange=${timeRange}`);
      
      if (response.data.success && response.data.data) {
        setAdvancedMetrics(response.data.data);
      }
    } catch (error: any) {
      console.error("Error fetching advanced metrics:", error);
    } finally {
      setMetricsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD'
    }).format(amount);
  };

  const formatMonth = (year: number, month: number) => {
    return new Date(year, month - 1).toLocaleDateString('en-CA', {
      year: 'numeric',
      month: 'short'
    });
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const formatDate = (dateObj: { year: number; month: number; day: number }) => {
    return `${dateObj.year}-${String(dateObj.month).padStart(2, '0')}-${String(dateObj.day).padStart(2, '0')}`;
  };

  if (loading) {
    console.log('⏳ ServicesAnalytics: Rendering loading state...');
    return (
      <div className={`p-6 min-h-screen ${isDarkMode ? 'bg-black' : 'bg-white'}`}>
        <div className={`text-center py-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-900'}`}>Loading services analytics...</div>
        <div className={`mt-4 text-sm text-center ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>
          Fetching consultation booking data from the server...
        </div>
      </div>
    );
  }

  if (!analytics) {
    console.log('❌ ServicesAnalytics: Rendering error state - no analytics data');
    return (
      <div className={`p-6 min-h-screen ${isDarkMode ? 'bg-black' : 'bg-white'}`}>
        <div className={`text-center py-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-900'}`}>Failed to load analytics data</div>
        <div className={`mt-4 text-sm text-center ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>
          Check the browser console for detailed error information.
        </div>
      </div>
    );
  }

  // Prepare chart data
  console.log('📊 ServicesAnalytics: Processing analytics data for charts...');
  console.log('📈 ServicesAnalytics: Raw analytics data:', analytics);

  const serviceBreakdownData = analytics.serviceBreakdown
    .filter(service => service._id && service._id.trim()) // Filter out null/empty IDs
    .map(service => ({
      name: service._id.charAt(0).toUpperCase() + service._id.slice(1),
      value: service.count,
      revenue: service.totalRevenue
    }));

  console.log('📊 ServicesAnalytics: Service breakdown data:', serviceBreakdownData);

  const monthlyData = analytics.monthlySales
    .filter(month => month._id && month._id.year && month._id.month) // Filter out invalid month data
    .map(month => ({
      month: formatMonth(month._id.year, month._id.month),
      bookings: month.count || 0,
      revenue: month.revenue || 0
    }));

  // Prepare advanced metrics chart data
  const dailyRevenueData = advancedMetrics?.trends.dailyRevenue.map(day => ({
    date: formatDate(day._id),
    revenue: day.revenue,
    bookings: day.bookings
  })) || [];

  const peakHoursData = advancedMetrics?.trends.peakHours.map(hour => ({
    hour: `${hour._id}:00`,
    bookings: hour.bookings,
    revenue: hour.revenue
  })) || [];

  return (
    <>
      <div className={`min-h-screen ${isDarkMode ? 'bg-black' : 'bg-white'} p-2 sm:p-3 md:p-4 lg:p-6`}>
      <div className="max-w-full xl:max-w-[1400px] mx-auto space-y-3 sm:space-y-4 md:space-y-6">
        {/* Modern Header with Dark Elegance */}
        <div className={`${isDarkMode ? 'bg-gradient-to-br from-black via-gray-900 to-black border border-gray-800/50 shadow-2xl shadow-emerald-500/5' : 'bg-white/80 border-white/20'} backdrop-blur-xl rounded-2xl border p-3 sm:p-4 md:p-6`}>
          <div className="flex flex-col space-y-4 xl:flex-row xl:justify-between xl:items-start xl:space-y-0">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 sm:gap-3 mb-2">
                <div className="p-2 sm:p-3 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-xl shadow-lg shadow-emerald-500/30 flex-shrink-0">
                  <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className={`text-lg sm:text-xl md:text-2xl xl:text-3xl font-bold truncate ${isDarkMode ? 'bg-gradient-to-r from-white via-emerald-400 to-teal-400 bg-clip-text text-transparent' : 'bg-gradient-to-r from-gray-900 via-emerald-800 to-teal-800 bg-clip-text text-transparent'}`}>
                    Services Analytics
                  </h1>
                  <p className={`text-xs sm:text-sm mt-1 flex flex-wrap items-center gap-1 sm:gap-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    <Calendar className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span className="truncate">Last updated: {lastUpdated.toLocaleTimeString()}</span>
                    {advancedMetrics && (
                      <Badge variant="outline" className={`text-xs flex-shrink-0 ${isDarkMode ? 'border-gray-700 text-gray-300' : ''}`}>
                        <Activity className="h-3 w-3 mr-1" />
                        <span className="hidden xs:inline">Live Data</span>
                        <span className="xs:hidden">Live</span>
                      </Badge>
                    )}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:gap-4">
              {/* View Toggle */}
              <div className={`flex w-full sm:w-auto ${isDarkMode ? 'bg-black border border-gray-800' : 'bg-gray-100'} rounded-lg p-1`}>
                <button
                  onClick={() => setActiveView('standard')}
                  className={`flex-1 sm:flex-none px-2 sm:px-3 md:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-all ${
                    activeView === 'standard'
                      ? `${isDarkMode ? 'bg-gradient-to-r from-emerald-900/50 to-teal-900/50 text-emerald-300 border border-emerald-800/50' : 'bg-white text-emerald-600'} shadow-sm`
                      : `${isDarkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'}`
                  }`}
                >
                  <Eye className="h-3 w-3 sm:h-4 sm:w-4 inline mr-1 sm:mr-2" />
                  <span className="hidden xs:inline">Standard</span>
                </button>
                <button
                  onClick={() => setActiveView('advanced')}
                  className={`flex-1 sm:flex-none px-2 sm:px-3 md:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-all ${
                    activeView === 'advanced'
                      ? `${isDarkMode ? 'bg-gradient-to-r from-purple-900/50 to-pink-900/50 text-purple-300 border border-purple-800/50' : 'bg-white text-purple-600'} shadow-sm`
                      : `${isDarkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'}`
                  }`}
                >
                  <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 inline mr-1 sm:mr-2" />
                  <span className="hidden xs:inline">Advanced</span>
                </button>
              </div>

              {/* Controls Row */}
              <div className="flex flex-wrap gap-2 sm:gap-3 w-full lg:w-auto">
                {/* Time Range Selector (for advanced view) */}
                {activeView === 'advanced' && (
                  <select
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value)}
                    className={`flex-1 sm:flex-none min-w-0 px-2 sm:px-3 md:px-4 py-2 border rounded-lg bg-transparent text-xs sm:text-sm font-medium hover:border-gray-300 transition-colors ${isDarkMode ? 'border-gray-600 text-gray-200 bg-gray-800' : 'border-gray-200 bg-white text-gray-700'}`}
                  >
                    <option value="30">Last 30 Days</option>
                    <option value="60">Last 60 Days</option>
                    <option value="90">Last 90 Days</option>
                    <option value="180">Last 6 Months</option>
                  </select>
                )}

                {/* Auto Refresh */}
                <button
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={`flex-1 sm:flex-none px-2 sm:px-3 md:px-4 py-2 rounded-lg transition-all flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm font-medium shadow-sm ${
                    autoRefresh
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-green-200'
                      : `${isDarkMode ? 'bg-gray-800 text-gray-300 border-gray-600 hover:border-gray-500' : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300'}`
                  }`}
                >
                  <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 ${autoRefresh ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">{autoRefresh ? 'Auto ON' : 'Auto OFF'}</span>
                  <span className="sm:hidden">{autoRefresh ? 'ON' : 'OFF'}</span>
                </button>

                {/* Refresh Button */}
                <button
                  onClick={() => {
                    fetchAnalytics();
                    fetchAdvancedMetrics();
                  }}
                  className={`flex-1 sm:flex-none px-2 sm:px-3 md:px-4 py-2 ${isDarkMode ? 'bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 border border-gray-700 shadow-lg shadow-gray-900/50' : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-emerald-200'} text-white rounded-lg transition-all flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm font-medium shadow-sm`}
                >
                  <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Refresh</span>
                </button>

                {/* Export Button */}
                <button
                  onClick={() => {
                    const dataStr = JSON.stringify({ analytics, advancedMetrics }, null, 2);
                    const dataBlob = new Blob([dataStr], { type: 'application/json' });
                    const url = URL.createObjectURL(dataBlob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `services-analytics-${new Date().toISOString().split('T')[0]}.json`;
                    link.click();
                    toast.success('Analytics data exported');
                  }}
                  className={`flex-1 sm:flex-none px-2 sm:px-3 md:px-4 py-2 ${isDarkMode ? 'bg-gradient-to-r from-emerald-900/80 to-teal-900/80 hover:from-emerald-800/80 hover:to-teal-800/80 border border-emerald-800/50 shadow-lg shadow-emerald-900/30' : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-green-200'} text-white rounded-lg transition-all flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm font-medium shadow-sm`}
                >
                  <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Export</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Beautiful KPI Cards with Dark Elegance */}
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total Revenue Card */}
          <div className={`group relative overflow-hidden ${isDarkMode ? 'bg-gradient-to-br from-black via-gray-950 to-black border border-emerald-900/30 shadow-xl shadow-emerald-500/5' : 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-100'} rounded-2xl p-4 sm:p-6 hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-300 hover:-translate-y-1`}>
            <div className={`absolute top-0 right-0 w-32 h-32 ${isDarkMode ? 'bg-gradient-to-br from-emerald-900/10 to-teal-900/10' : 'bg-gradient-to-br from-green-400/20 to-emerald-400/20'} rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500`}></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 sm:p-3 ${isDarkMode ? 'bg-gradient-to-br from-emerald-900/50 to-teal-900/50 border border-emerald-800/50' : 'bg-gradient-to-br from-green-500 to-emerald-600'} rounded-xl shadow-lg shadow-emerald-500/20`}>
                  <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-300" />
                </div>
                {advancedMetrics && (
                  <Badge variant={advancedMetrics.growth.revenue >= 0 ? "default" : "destructive"} className="text-xs">
                    {advancedMetrics.growth.revenue >= 0 ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                    {formatPercent(advancedMetrics.growth.revenue)}
                  </Badge>
                )}
              </div>
              <h3 className={`text-xs sm:text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Total Revenue</h3>
              <p className={`text-xl sm:text-2xl lg:text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {formatCurrency(analytics.totalRevenue)}
              </p>
              {advancedMetrics && (
                <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'} mt-2`}>
                  Current: {formatCurrency(advancedMetrics.currentPeriod.revenue)}
                </p>
              )}
            </div>
          </div>

          {/* Total Bookings Card */}
          <div className={`group relative overflow-hidden ${isDarkMode ? 'bg-gradient-to-br from-black via-gray-950 to-black border border-teal-900/30 shadow-xl shadow-teal-500/5' : 'bg-gradient-to-br from-teal-50 to-cyan-50 border-teal-100'} rounded-2xl p-4 sm:p-6 hover:shadow-2xl hover:shadow-teal-500/10 transition-all duration-300 hover:-translate-y-1`}>
            <div className={`absolute top-0 right-0 w-32 h-32 ${isDarkMode ? 'bg-gradient-to-br from-teal-900/10 to-cyan-900/10' : 'bg-gradient-to-br from-teal-400/20 to-cyan-400/20'} rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500`}></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 sm:p-3 ${isDarkMode ? 'bg-gradient-to-br from-teal-900/50 to-cyan-900/50 border border-teal-800/50' : 'bg-gradient-to-br from-teal-500 to-cyan-600'} rounded-xl shadow-lg shadow-teal-500/20`}>
                  <ShoppingBag className="h-4 w-4 sm:h-5 sm:w-5 text-teal-300" />
                </div>
                {advancedMetrics && (
                  <Badge variant={advancedMetrics.growth.bookings >= 0 ? "default" : "destructive"} className="text-xs">
                    {advancedMetrics.growth.bookings >= 0 ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                    {formatPercent(advancedMetrics.growth.bookings)}
                  </Badge>
                )}
              </div>
              <h3 className={`text-xs sm:text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Total Bookings</h3>
              <p className={`text-xl sm:text-2xl lg:text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {analytics.totalBookings}
              </p>
              {advancedMetrics && (
                <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'} mt-2`}>
                  Current: {advancedMetrics.currentPeriod.bookings} bookings
                </p>
              )}
            </div>
          </div>

          {/* Avg Booking Value / Conversion Rate Card */}
          <div className={`group relative overflow-hidden ${isDarkMode ? 'bg-gradient-to-br from-black via-gray-950 to-black border border-purple-900/30 shadow-xl shadow-purple-500/5' : 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-100'} rounded-2xl p-4 sm:p-6 hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300 hover:-translate-y-1`}>
            <div className={`absolute top-0 right-0 w-32 h-32 ${isDarkMode ? 'bg-gradient-to-br from-purple-900/10 to-pink-900/10' : 'bg-gradient-to-br from-purple-400/20 to-pink-400/20'} rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500`}></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 sm:p-3 ${isDarkMode ? 'bg-gradient-to-br from-purple-900/50 to-pink-900/50 border border-purple-800/50' : 'bg-gradient-to-br from-purple-500 to-pink-600'} rounded-xl shadow-lg shadow-purple-500/20`}>
                  {activeView === 'advanced' ? <Target className="h-4 w-4 sm:h-5 sm:w-5 text-purple-300" /> : <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-purple-300" />}
                </div>
              </div>
              <h3 className={`text-xs sm:text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
                {activeView === 'advanced' && advancedMetrics ? 'Conversion Rate' : 'Avg. Booking Value'}
              </h3>
              <p className={`text-xl sm:text-2xl lg:text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {activeView === 'advanced' && advancedMetrics 
                  ? `${advancedMetrics.metrics.conversionRate.toFixed(1)}%`
                  : analytics.totalBookings > 0
                    ? formatCurrency(analytics.totalRevenue / analytics.totalBookings)
                    : formatCurrency(0)
                }
              </p>
              {advancedMetrics && activeView === 'advanced' && (
                <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'} mt-2`}>
                  Consultation to booking rate
                </p>
              )}
            </div>
          </div>

          {/* Active Services / Customer LTV Card */}
          <div className={`group relative overflow-hidden ${isDarkMode ? 'bg-gradient-to-br from-black via-gray-950 to-black border border-amber-900/30 shadow-xl shadow-amber-500/5' : 'bg-gradient-to-br from-orange-50 to-amber-50 border-orange-100'} rounded-2xl p-4 sm:p-6 hover:shadow-2xl hover:shadow-amber-500/10 transition-all duration-300 hover:-translate-y-1`}>
            <div className={`absolute top-0 right-0 w-32 h-32 ${isDarkMode ? 'bg-gradient-to-br from-amber-900/10 to-orange-900/10' : 'bg-gradient-to-br from-orange-400/20 to-amber-400/20'} rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500`}></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 sm:p-3 ${isDarkMode ? 'bg-gradient-to-br from-amber-900/50 to-orange-900/50 border border-amber-800/50' : 'bg-gradient-to-br from-orange-500 to-amber-600'} rounded-xl shadow-lg shadow-amber-500/20`}>
                  {activeView === 'advanced' ? <Award className="h-4 w-4 sm:h-5 sm:w-5 text-amber-300" /> : <Briefcase className="h-4 w-4 sm:h-5 sm:w-5 text-amber-300" />}
                </div>
              </div>
              <h3 className={`text-xs sm:text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
                {activeView === 'advanced' && advancedMetrics ? 'Customer LTV' : 'Active Services'}
              </h3>
              <p className={`text-xl sm:text-2xl lg:text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {activeView === 'advanced' && advancedMetrics 
                  ? formatCurrency(advancedMetrics.metrics.customerLTV)
                  : analytics.serviceBreakdown.length
                }
              </p>
              {advancedMetrics && activeView === 'advanced' && (
                <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'} mt-2`}>
                  Avg {advancedMetrics.metrics.avgPurchaseFrequency.toFixed(1)} purchases/customer
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Advanced Metrics Row (only in advanced view) */}
        {activeView === 'advanced' && advancedMetrics && (
          <>
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              {/* Predicted Daily Revenue */}
              <div className={`${isDarkMode ? 'bg-gradient-to-br from-black via-gray-950 to-black border border-teal-900/30 shadow-lg shadow-teal-500/5' : 'bg-white/80 border-gray-200'} backdrop-blur-sm rounded-xl p-4 sm:p-6 hover:shadow-xl hover:shadow-teal-500/10 transition-all`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 ${isDarkMode ? 'bg-gradient-to-br from-teal-900/50 to-cyan-900/50 border border-teal-800/50' : 'bg-gradient-to-br from-teal-500 to-cyan-600'} rounded-lg shadow-lg shadow-teal-500/20`}>
                    <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-teal-300" />
                  </div>
                  <div>
                    <h3 className={`text-xs sm:text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Predicted Daily Revenue</h3>
                    <p className={`text-lg sm:text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {formatCurrency(advancedMetrics.metrics.predictedDailyRevenue)}
                    </p>
                  </div>
                </div>
                <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>7-day moving average forecast</p>
              </div>

              {/* Customer Growth */}
              <div className={`${isDarkMode ? 'bg-gradient-to-br from-black via-gray-950 to-black border border-pink-900/30 shadow-lg shadow-pink-500/5' : 'bg-white/80 border-gray-200'} backdrop-blur-sm rounded-xl p-4 sm:p-6 hover:shadow-xl hover:shadow-pink-500/10 transition-all`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 ${isDarkMode ? 'bg-gradient-to-br from-pink-900/50 to-rose-900/50 border border-pink-800/50' : 'bg-gradient-to-br from-pink-500 to-rose-600'} rounded-lg shadow-lg shadow-pink-500/20`}>
                    <Users className="h-4 w-4 sm:h-5 sm:w-5 text-pink-300" />
                  </div>
                  <div>
                    <h3 className={`text-xs sm:text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Customer Growth</h3>
                    <p className={`text-lg sm:text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {advancedMetrics.currentPeriod.customers}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={advancedMetrics.growth.customers >= 0 ? "default" : "destructive"} className="text-xs">
                    {formatPercent(advancedMetrics.growth.customers)}
                  </Badge>
                  <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>vs previous period</span>
                </div>
              </div>

              {/* Avg Order Value */}
              <div className={`${isDarkMode ? 'bg-gradient-to-br from-black via-gray-950 to-black border border-purple-900/30 shadow-lg shadow-purple-500/5' : 'bg-white/80 border-gray-200'} backdrop-blur-sm rounded-xl p-4 sm:p-6 hover:shadow-xl hover:shadow-purple-500/10 transition-all`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 ${isDarkMode ? 'bg-gradient-to-br from-purple-900/50 to-violet-900/50 border border-purple-800/50' : 'bg-gradient-to-br from-purple-500 to-violet-600'} rounded-lg shadow-lg shadow-purple-500/20`}>
                    <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-purple-300" />
                  </div>
                  <div>
                    <h3 className={`text-xs sm:text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Avg Order Value</h3>
                    <p className={`text-lg sm:text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {formatCurrency(advancedMetrics.currentPeriod.avgOrderValue)}
                    </p>
                  </div>
                </div>
                <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>Current period average</p>
              </div>

              {/* Repeat Customer Rate */}
              <div className={`${isDarkMode ? 'bg-gradient-to-br from-black via-gray-950 to-black border border-amber-900/30 shadow-lg shadow-amber-500/5' : 'bg-white/80 border-gray-200'} backdrop-blur-sm rounded-xl p-4 sm:p-6 hover:shadow-xl hover:shadow-amber-500/10 transition-all`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 ${isDarkMode ? 'bg-gradient-to-br from-amber-900/50 to-orange-900/50 border border-amber-800/50' : 'bg-gradient-to-br from-amber-500 to-orange-600'} rounded-lg shadow-lg shadow-amber-500/20`}>
                    <Heart className="h-4 w-4 sm:h-5 sm:w-5 text-amber-300" />
                  </div>
                  <div>
                    <h3 className={`text-xs sm:text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Repeat Customer Rate</h3>
                    <p className={`text-lg sm:text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {advancedMetrics.metrics.repeatCustomerRate.toFixed(1)}%
                    </p>
                  </div>
                </div>
                <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>{advancedMetrics.satisfaction.repeatCustomers} of {advancedMetrics.satisfaction.totalCustomers} customers</p>
              </div>
            </div>

            {/* Category Performance Section */}
            {advancedMetrics.categoryPerformance && advancedMetrics.categoryPerformance.length > 0 && (
              <Card className={`${isDarkMode ? 'bg-gradient-to-br from-black via-gray-950 to-black border-gray-800/50 shadow-lg' : 'bg-white border-gray-200'}`}>
                <CardHeader>
                  <CardTitle className={isDarkMode ? 'text-white' : 'text-gray-900'}>Category Performance Analysis</CardTitle>
                  <CardDescription className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                    Revenue and booking breakdown by service category
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {advancedMetrics.categoryPerformance.map((category, index) => (
                      <div
                        key={index}
                        className={`p-4 rounded-xl ${isDarkMode ? 'bg-gray-800/50 border border-gray-700' : 'bg-gradient-to-br from-gray-50 to-gray-100'} hover:shadow-lg transition-all`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {category._id || 'Uncategorized'}
                          </h4>
                          <Badge variant="outline" className="text-xs">{category.bookings} bookings</Badge>
                        </div>
                        <p className={`text-2xl font-bold mb-1 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                          {formatCurrency(category.revenue)}
                        </p>
                        <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>
                          Avg: {formatCurrency(category.avgRevenue)} per booking
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Sales Tables - Always Visible Below KPI Cards */}
       

        <div className={`${isDarkMode ? 'bg-gradient-to-br from-black via-gray-950 to-black border border-gray-800/50 shadow-2xl' : 'bg-white/80 border-gray-200'} backdrop-blur-sm rounded-2xl shadow-lg p-2 sm:p-4`}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
            <TabsList className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 w-full gap-2 ${isDarkMode ? 'bg-gradient-to-br from-gray-950 to-black border border-gray-800/50' : 'bg-gray-100'} p-2 sm:p-3 rounded-xl h-auto`}>
              <TabsTrigger 
                value="overview" 
                className={`transition-all duration-200 rounded-lg px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium flex items-center justify-center
                  ${isDarkMode 
                    ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-emerald-500/20' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white data-[state=active]:shadow-lg'
                  }`}
              >
                <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Overview</span>
                <span className="sm:hidden">View</span>
              </TabsTrigger>
              
              <TabsTrigger 
                value="breakdown" 
                className={`transition-all duration-200 rounded-lg px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium flex items-center justify-center
                  ${isDarkMode 
                    ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-teal-500/20' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white data-[state=active]:shadow-lg'
                  }`}
              >
                <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Breakdown</span>
                <span className="sm:hidden">Data</span>
              </TabsTrigger>
              
              <TabsTrigger 
                value="trends" 
                className={`transition-all duration-200 rounded-lg px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium flex items-center justify-center
                  ${isDarkMode 
                    ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/20' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-lg'
                  }`}
              >
                <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Trends</span>
                <span className="sm:hidden">Chart</span>
              </TabsTrigger>
              
              <TabsTrigger 
                value="top-services" 
                className={`transition-all duration-200 rounded-lg px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium flex items-center justify-center
                  ${isDarkMode 
                    ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-amber-500/20' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:shadow-lg'
                  }`}
              >
                <Award className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Top Services</span>
                <span className="sm:hidden">Top</span>
              </TabsTrigger>
              
              <TabsTrigger 
                value="services-with-sales" 
                className={`transition-all duration-200 rounded-lg px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium flex items-center justify-center
                  ${isDarkMode 
                    ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-rose-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-rose-500/20' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-rose-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-lg'
                  }`}
              >
                <ShoppingBag className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">With Sales</span>
                <span className="sm:hidden">Sales</span>
              </TabsTrigger>
              
              <TabsTrigger 
                value="all-services" 
                className={`transition-all duration-200 rounded-lg px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium flex items-center justify-center
                  ${isDarkMode 
                    ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-indigo-500/20' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg'
                  }`}
              >
                <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">All Services</span>
                <span className="sm:hidden">All</span>
              </TabsTrigger>
              
              {activeView === 'advanced' && advancedMetrics && (
                <TabsTrigger 
                  value="peak-hours" 
                  className={`transition-all duration-200 rounded-lg px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium flex items-center justify-center
                    ${isDarkMode 
                      ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-cyan-500/20' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg'
                    }`}
                >
                  <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Peak Hours</span>
                  <span className="sm:hidden">Hours</span>
                </TabsTrigger>
              )}
              
              {activeView === 'advanced' && advancedMetrics && (
                <TabsTrigger 
                  value="satisfaction" 
                  className={`transition-all duration-200 rounded-lg px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium flex items-center justify-center
                    ${isDarkMode 
                      ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-red-500/20' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-lg'
                    }`}
                >
                  <Heart className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Insights</span>
                  <span className="sm:hidden">Insights</span>
                </TabsTrigger>
              )}
            </TabsList>

        <TabsContent value="overview" className="space-y-4 sm:space-y-6">
          <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
            <Card className={`${isDarkMode ? 'bg-gradient-to-br from-black via-gray-950 to-black border-gray-800/50 shadow-lg shadow-emerald-500/5' : 'bg-white border-gray-200'} transition-all hover:shadow-xl`}>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2 mb-1">
                  <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-emerald-500/10' : 'bg-emerald-50'}`}>
                    <PieChartIcon className={`h-4 w-4 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
                  </div>
                  <CardTitle className={`text-base sm:text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Service Distribution</CardTitle>
                </div>
                <CardDescription className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Bookings by service type</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={serviceBreakdownData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={window.innerWidth < 640 ? 60 : 85}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {serviceBreakdownData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={isDarkMode ? { backgroundColor: '#1F2937', border: '1px solid #374151', color: '#F9FAFB', borderRadius: '8px' } : { borderRadius: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className={`${isDarkMode ? 'bg-gradient-to-br from-black via-gray-950 to-black border-gray-800/50 shadow-lg shadow-purple-500/5' : 'bg-white border-gray-200'} transition-all hover:shadow-xl`}>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2 mb-1">
                  <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-purple-500/10' : 'bg-purple-50'}`}>
                    <BarChart3 className={`h-4 w-4 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                  </div>
                  <CardTitle className={`text-base sm:text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Revenue by Service</CardTitle>
                </div>
                <CardDescription className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total revenue generated by each service type</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={serviceBreakdownData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#e5e7eb'} />
                    <XAxis 
                      dataKey="name" 
                      stroke={isDarkMode ? '#9CA3AF' : '#6b7280'}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      fontSize={window.innerWidth < 640 ? 10 : 12}
                    />
                    <YAxis 
                      stroke={isDarkMode ? '#9CA3AF' : '#6b7280'} 
                      tickFormatter={(value) => `$${value}`}
                      fontSize={window.innerWidth < 640 ? 10 : 12}
                    />
                    <Tooltip 
                      formatter={(value) => [formatCurrency(Number(value)), 'Revenue']} 
                      contentStyle={isDarkMode ? { backgroundColor: '#1F2937', border: '1px solid #374151', color: '#F9FAFB', borderRadius: '8px' } : { borderRadius: '8px' }} 
                    />
                    <Bar dataKey="revenue" fill={isDarkMode ? '#8b5cf6' : '#a855f7'} radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="breakdown" className="space-y-4 sm:space-y-6">
          <Card className={`${isDarkMode ? 'bg-gradient-to-br from-black via-gray-950 to-black border-gray-800/50 shadow-lg shadow-teal-500/5' : 'bg-white border-gray-200'} transition-all hover:shadow-xl`}>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2 mb-1">
                <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-teal-500/10' : 'bg-teal-50'}`}>
                  <BarChart3 className={`h-4 w-4 ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`} />
                </div>
                <CardTitle className={`text-base sm:text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Service Performance Details</CardTitle>
              </div>
              <CardDescription className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Detailed breakdown of each service type</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 sm:space-y-4">
                {analytics.serviceBreakdown.map((service) => (
                  <div key={service._id} className={`border rounded-xl p-4 sm:p-6 hover:shadow-lg transition-all ${isDarkMode ? 'border-gray-800/50 bg-gradient-to-br from-gray-950/50 to-black/50' : 'border-gray-200 bg-gradient-to-br from-gray-50 to-white'}`}>
                    <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-3 mb-4">
                      <div className="flex-1">
                        <h3 className={`text-lg sm:text-xl font-semibold capitalize mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {service._id}
                        </h3>
                        <div className={`flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          <div className="flex items-center gap-1">
                            <ShoppingBag className="h-3 w-3" />
                            <span>{service.count} bookings</span>
                          </div>
                          <div className={`flex items-center gap-1 ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`}>
                            <DollarSign className="h-3 w-3" />
                            <span>Avg: {formatCurrency(service.totalRevenue / service.count)}</span>
                          </div>
                        </div>
                      </div>
                      <Badge variant="secondary" className={`text-base sm:text-lg px-3 py-1 ${isDarkMode ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-700'}`}>
                        {formatCurrency(service.totalRevenue)}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <h4 className={`font-medium text-sm sm:text-base ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Recent Bookings:</h4>
                      <div className="space-y-1 sm:space-y-2 max-h-32 sm:max-h-40 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                        {service.recentBookings.slice(0, 5).map((booking, index) => (
                          <div key={index} className={`text-xs sm:text-sm p-2 sm:p-3 rounded-lg transition-colors ${isDarkMode ? 'text-gray-400 bg-gray-800/30 hover:bg-gray-800/50' : 'text-gray-600 bg-gray-50 hover:bg-gray-100'}`}>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                              <span className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>{booking.customer}</span>
                              <div className="flex items-center gap-2">
                                <span className={isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}>{formatCurrency(booking.amount)}</span>
                                <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                                  {new Date(booking.date).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Services with Sales Table */}
          {false && serviceSalesTable.length > 0 && (
            <Card className={`${isDarkMode ? 'bg-gradient-to-br from-black via-gray-950 to-black border-gray-800/50 shadow-lg' : 'bg-white border-gray-200'}`}>
              <CardHeader>
                <CardTitle className={`${isDarkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
                  <TrendingUp className="h-5 w-5 text-emerald-400" />
                  Services with Sales
                </CardTitle>
                <CardDescription className={`${isDarkMode ? 'text-gray-400' : ''}`}>Services that have recorded at least one sale</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className={`border-b ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                        <th className={`text-left p-4 font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>Service Name</th>
                        <th className={`text-left p-4 font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>Category</th>
                        <th className={`text-right p-4 font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>Price</th>
                        <th className={`text-right p-4 font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>Total Sales</th>
                        <th className={`text-right p-4 font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>Total Revenue</th>
                        <th className={`text-right p-4 font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>Unique Users</th>
                        <th className={`text-right p-4 font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>Refunds</th>
                        <th className={`text-right p-4 font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>Refund Amount</th>
                        <th className={`text-right p-4 font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>Net Revenue</th>
                        <th className={`text-left p-4 font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>Last Sale</th>
                      </tr>
                    </thead>
                    <tbody>
                      {serviceSalesTable.filter(service => service.totalSales > 0).map((service, index) => (
                        <tr key={service._id} className={`border-b ${isDarkMode ? 'hover:bg-gray-800 border-gray-700' : 'hover:bg-gray-50 border-gray-200'} ${index % 2 === 0 ? (isDarkMode ? 'bg-gray-900' : 'bg-white') : (isDarkMode ? 'bg-gray-800' : 'bg-gray-25')}`}>
                          <td className={`p-4 ${isDarkMode ? 'text-white' : 'text-gray-900'} font-medium`}>{service.serviceName}</td>
                          <td className={`p-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{service.category}</td>
                          <td className={`p-4 text-right ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{service.price}</td>
                          <td className={`p-4 text-right font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{service.totalSales}</td>
                          <td className={`p-4 text-right font-semibold text-green-600`}>{formatCurrency(service.totalRevenue)}</td>
                          <td className={`p-4 text-right ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{service.uniqueUserCount}</td>
                          <td className={`p-4 text-right ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{service.totalRefunds}</td>
                          <td className={`p-4 text-right text-red-600`}>{formatCurrency(service.refundAmount)}</td>
                          <td className={`p-4 text-right font-bold text-green-700`}>{formatCurrency(service.netRevenue)}</td>
                          <td className={`p-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{service.lastSaleDate ? new Date(service.lastSaleDate).toLocaleDateString() : 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className={`border-t-2 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-300'} font-semibold`}>
                        <td className={`p-4 ${isDarkMode ? 'text-white' : 'text-gray-900'} font-bold text-lg`} colSpan={3}>TOTALS (Services with Sales)</td>
                        <td className={`p-4 text-right ${isDarkMode ? 'text-white' : 'text-gray-900'} font-bold text-lg`}>
                          {serviceSalesTable.filter(service => service.totalSales > 0).reduce((sum, service) => sum + service.totalSales, 0)}
                        </td>
                        <td className="p-4 text-right text-green-600 font-bold text-lg">
                          {formatCurrency(serviceSalesTable.filter(service => service.totalSales > 0).reduce((sum, service) => sum + service.totalRevenue, 0))}
                        </td>
                        <td className={`p-4 text-right ${isDarkMode ? 'text-white' : 'text-gray-900'} font-bold text-lg`}>
                          {serviceSalesTable.filter(service => service.totalSales > 0).reduce((sum, service) => sum + service.uniqueUserCount, 0)}
                        </td>
                        <td className={`p-4 text-right ${isDarkMode ? 'text-white' : 'text-gray-900'} font-bold text-lg`}>
                          {serviceSalesTable.filter(service => service.totalSales > 0).reduce((sum, service) => sum + service.totalRefunds, 0)}
                        </td>
                        <td className="p-4 text-right text-red-600 font-bold text-lg">
                          {formatCurrency(serviceSalesTable.filter(service => service.totalSales > 0).reduce((sum, service) => sum + service.refundAmount, 0))}
                        </td>
                        <td className="p-4 text-right text-green-700 font-bold text-xl">
                          {formatCurrency(serviceSalesTable.filter(service => service.totalSales > 0).reduce((sum, service) => sum + service.netRevenue, 0))}
                        </td>
                        <td className="p-4"></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="trends" className="space-y-4 sm:space-y-6">
          <Card className={`${isDarkMode ? 'bg-gradient-to-br from-black via-gray-950 to-black border-gray-800/50 shadow-lg shadow-purple-500/5' : 'bg-white border-gray-200'} transition-all hover:shadow-xl`}>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2 mb-1">
                <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-purple-500/10' : 'bg-purple-50'}`}>
                  <TrendingUp className={`h-4 w-4 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                </div>
                <CardTitle className={`text-base sm:text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Monthly Booking Trends</CardTitle>
              </div>
              <CardDescription className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Service bookings and revenue over time</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <ResponsiveContainer width="100%" height={window.innerWidth < 640 ? 300 : 400}>
                <ComposedChart data={monthlyData}>
                  <defs>
                    <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#e5e7eb'} />
                  <XAxis 
                    dataKey="month" 
                    stroke={isDarkMode ? '#9CA3AF' : '#6b7280'}
                    fontSize={window.innerWidth < 640 ? 10 : 12}
                    angle={window.innerWidth < 640 ? -45 : 0}
                    textAnchor={window.innerWidth < 640 ? "end" : "middle"}
                    height={window.innerWidth < 640 ? 60 : 30}
                  />
                  <YAxis 
                    yAxisId="left" 
                    orientation="left" 
                    stroke={isDarkMode ? '#9CA3AF' : '#6b7280'}
                    fontSize={window.innerWidth < 640 ? 10 : 12}
                  />
                  <YAxis 
                    yAxisId="right" 
                    orientation="right" 
                    stroke={isDarkMode ? '#9CA3AF' : '#6b7280'} 
                    tickFormatter={(value) => `$${value}`}
                    fontSize={window.innerWidth < 640 ? 10 : 12}
                  />
                  <Tooltip 
                    contentStyle={isDarkMode ? { backgroundColor: '#1F2937', border: '1px solid #374151', color: '#F9FAFB', borderRadius: '8px' } : { borderRadius: '8px' }} 
                  />
                  <Bar yAxisId="left" dataKey="bookings" fill="url(#colorBookings)" name="Bookings" radius={[8, 8, 0, 0]} />
                  <Line yAxisId="right" type="monotone" dataKey="revenue" stroke={isDarkMode ? '#10b981' : '#059669'} strokeWidth={3} name="Revenue" dot={{ fill: isDarkMode ? '#10b981' : '#059669', r: 4 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="services-with-sales" className="space-y-4 sm:space-y-6">
          {/* Services with Sales Table */}
          {serviceSalesTable.length > 0 && (
            <Card className={`${isDarkMode ? 'bg-gradient-to-br from-black via-gray-950 to-black border border-emerald-800/30 shadow-2xl shadow-emerald-500/5' : 'bg-gradient-to-br from-white to-emerald-50/30 border border-emerald-200'} backdrop-blur-sm transition-all hover:shadow-3xl`}>
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-emerald-500/10' : 'bg-emerald-50'}`}>
                    <TrendingUp className={`h-4 w-4 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
                  </div>
                  <CardTitle className={`text-base sm:text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Services with Sales</CardTitle>
                </div>
                <CardDescription className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Services that have recorded at least one sale</CardDescription>
              </CardHeader>
              
              {/* Filters */}
              <div className={`p-3 sm:p-4 border-b ${isDarkMode ? 'border-gray-800/50 bg-gray-950/50' : 'border-gray-200 bg-gray-50'}`}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <div>
                    <label className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1 block`}>
                      Search Services
                    </label>
                    <Input
                      placeholder="Search by service name..."
                      value={servicesWithSalesFilters.search}
                      onChange={(e) => setServicesWithSalesFilters(prev => ({ ...prev, search: e.target.value }))}
                      className={isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
                    />
                  </div>
                  
                  <div>
                    <label className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1 block`}>
                      Category
                    </label>
                    <Select value={servicesWithSalesFilters.category} onValueChange={(value) => setServicesWithSalesFilters(prev => ({ ...prev, category: value }))}>
                      <SelectTrigger className={isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}>
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {[...new Set(serviceSalesTable.filter(service => service.totalSales > 0).map(service => service.category))].map(category => (
                          <SelectItem key={category} value={category}>{category}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1 block`}>
                      Min Sales
                    </label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={servicesWithSalesFilters.minSales}
                      onChange={(e) => setServicesWithSalesFilters(prev => ({ ...prev, minSales: e.target.value }))}
                      className={isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
                    />
                  </div>
                  
                  <div>
                    <label className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1 block`}>
                      Max Sales
                    </label>
                    <Input
                      type="number"
                      placeholder="Any"
                      value={servicesWithSalesFilters.maxSales}
                      onChange={(e) => setServicesWithSalesFilters(prev => ({ ...prev, maxSales: e.target.value }))}
                      className={isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
                    />
                  </div>
                </div>
              </div>
              
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className={`border-b ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                        <th className={`text-left p-4 font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>Service Name</th>
                        <th className={`text-left p-4 font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>Category</th>
                        <th className={`text-right p-4 font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>Price</th>
                        <th className={`text-right p-4 font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>Total Sales</th>
                        <th className={`text-right p-4 font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>Total Revenue</th>
                        <th className={`text-right p-4 font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>Unique Users</th>
                        <th className={`text-right p-4 font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>Refunds</th>
                        <th className={`text-right p-4 font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>Refund Amount</th>
                        <th className={`text-right p-4 font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>Net Revenue</th>
                        <th className={`text-left p-4 font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>Last Sale</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const filteredServices = serviceSalesTable
                          .filter(service => service.totalSales > 0)
                          .filter(service => {
                            const matchesSearch = servicesWithSalesFilters.search === '' || 
                              service.serviceName.toLowerCase().includes(servicesWithSalesFilters.search.toLowerCase());
                            const matchesCategory = servicesWithSalesFilters.category === 'all' || 
                              service.category === servicesWithSalesFilters.category;
                            const matchesMinSales = servicesWithSalesFilters.minSales === '' || 
                              service.totalSales >= parseInt(servicesWithSalesFilters.minSales);
                            const matchesMaxSales = servicesWithSalesFilters.maxSales === '' || 
                              service.totalSales <= parseInt(servicesWithSalesFilters.maxSales);
                            
                            return matchesSearch && matchesCategory && matchesMinSales && matchesMaxSales;
                          });
                        
                        return filteredServices
                          .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                          .map((service, index) => (
                          <tr key={service._id} className={`border-b ${isDarkMode ? 'hover:bg-gray-800 border-gray-700' : 'hover:bg-gray-50 border-gray-200'} ${index % 2 === 0 ? (isDarkMode ? 'bg-gray-900' : 'bg-white') : (isDarkMode ? 'bg-gray-800' : 'bg-gray-25')}`}>
                            <td className={`p-4 ${isDarkMode ? 'text-white' : 'text-gray-900'} font-medium`}>{service.serviceName}</td>
                            <td className={`p-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{service.category}</td>
                            <td className={`p-4 text-right ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{service.price}</td>
                            <td className={`p-4 text-right font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{service.totalSales}</td>
                            <td className={`p-4 text-right font-semibold text-green-600`}>{formatCurrency(service.totalRevenue)}</td>
                            <td className={`p-4 text-right ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{service.uniqueUserCount}</td>
                            <td className={`p-4 text-right ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{service.totalRefunds}</td>
                            <td className={`p-4 text-right text-red-600`}>{formatCurrency(service.refundAmount)}</td>
                            <td className={`p-4 text-right font-bold text-green-700`}>{formatCurrency(service.netRevenue)}</td>
                            <td className={`p-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{service.lastSaleDate ? new Date(service.lastSaleDate).toLocaleDateString() : 'N/A'}</td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                    <tfoot>
                      <tr className={`border-t-2 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-300'} font-semibold`}>
                        <td className={`p-4 ${isDarkMode ? 'text-white' : 'text-gray-900'} font-bold text-lg`} colSpan={3}>TOTALS (Filtered Services)</td>
                        <td className={`p-4 text-right ${isDarkMode ? 'text-white' : 'text-gray-900'} font-bold text-lg`}>
                          {(() => {
                            const filteredServices = serviceSalesTable
                              .filter(service => service.totalSales > 0)
                              .filter(service => {
                                const matchesSearch = servicesWithSalesFilters.search === '' || 
                                  service.serviceName.toLowerCase().includes(servicesWithSalesFilters.search.toLowerCase());
                                const matchesCategory = servicesWithSalesFilters.category === 'all' || 
                                  service.category === servicesWithSalesFilters.category;
                                const matchesMinSales = servicesWithSalesFilters.minSales === '' || 
                                  service.totalSales >= parseInt(servicesWithSalesFilters.minSales);
                                const matchesMaxSales = servicesWithSalesFilters.maxSales === '' || 
                                  service.totalSales <= parseInt(servicesWithSalesFilters.maxSales);
                                
                                return matchesSearch && matchesCategory && matchesMinSales && matchesMaxSales;
                              });
                            return filteredServices.reduce((sum, service) => sum + service.totalSales, 0);
                          })()}
                        </td>
                        <td className="p-4 text-right text-green-600 font-bold text-lg">
                          {(() => {
                            const filteredServices = serviceSalesTable
                              .filter(service => service.totalSales > 0)
                              .filter(service => {
                                const matchesSearch = servicesWithSalesFilters.search === '' || 
                                  service.serviceName.toLowerCase().includes(servicesWithSalesFilters.search.toLowerCase());
                                const matchesCategory = servicesWithSalesFilters.category === 'all' || 
                                  service.category === servicesWithSalesFilters.category;
                                const matchesMinSales = servicesWithSalesFilters.minSales === '' || 
                                  service.totalSales >= parseInt(servicesWithSalesFilters.minSales);
                                const matchesMaxSales = servicesWithSalesFilters.maxSales === '' || 
                                  service.totalSales <= parseInt(servicesWithSalesFilters.maxSales);
                                
                                return matchesSearch && matchesCategory && matchesMinSales && matchesMaxSales;
                              });
                            return formatCurrency(filteredServices.reduce((sum, service) => sum + service.totalRevenue, 0));
                          })()}
                        </td>
                        <td className={`p-4 text-right ${isDarkMode ? 'text-white' : 'text-gray-900'} font-bold text-lg`}>
                          {(() => {
                            const filteredServices = serviceSalesTable
                              .filter(service => service.totalSales > 0)
                              .filter(service => {
                                const matchesSearch = servicesWithSalesFilters.search === '' || 
                                  service.serviceName.toLowerCase().includes(servicesWithSalesFilters.search.toLowerCase());
                                const matchesCategory = servicesWithSalesFilters.category === 'all' || 
                                  service.category === servicesWithSalesFilters.category;
                                const matchesMinSales = servicesWithSalesFilters.minSales === '' || 
                                  service.totalSales >= parseInt(servicesWithSalesFilters.minSales);
                                const matchesMaxSales = servicesWithSalesFilters.maxSales === '' || 
                                  service.totalSales <= parseInt(servicesWithSalesFilters.maxSales);
                                
                                return matchesSearch && matchesCategory && matchesMinSales && matchesMaxSales;
                              });
                            return filteredServices.reduce((sum, service) => sum + service.uniqueUserCount, 0);
                          })()}
                        </td>
                        <td className={`p-4 text-right ${isDarkMode ? 'text-white' : 'text-gray-900'} font-bold text-lg`}>
                          {(() => {
                            const filteredServices = serviceSalesTable
                              .filter(service => service.totalSales > 0)
                              .filter(service => {
                                const matchesSearch = servicesWithSalesFilters.search === '' || 
                                  service.serviceName.toLowerCase().includes(servicesWithSalesFilters.search.toLowerCase());
                                const matchesCategory = servicesWithSalesFilters.category === 'all' || 
                                  service.category === servicesWithSalesFilters.category;
                                const matchesMinSales = servicesWithSalesFilters.minSales === '' || 
                                  service.totalSales >= parseInt(servicesWithSalesFilters.minSales);
                                const matchesMaxSales = servicesWithSalesFilters.maxSales === '' || 
                                  service.totalSales <= parseInt(servicesWithSalesFilters.maxSales);
                                
                                return matchesSearch && matchesCategory && matchesMinSales && matchesMaxSales;
                              });
                            return filteredServices.reduce((sum, service) => sum + service.totalRefunds, 0);
                          })()}
                        </td>
                        <td className="p-4 text-right text-red-600 font-bold text-lg">
                          {(() => {
                            const filteredServices = serviceSalesTable
                              .filter(service => service.totalSales > 0)
                              .filter(service => {
                                const matchesSearch = servicesWithSalesFilters.search === '' || 
                                  service.serviceName.toLowerCase().includes(servicesWithSalesFilters.search.toLowerCase());
                                const matchesCategory = servicesWithSalesFilters.category === 'all' || 
                                  service.category === servicesWithSalesFilters.category;
                                const matchesMinSales = servicesWithSalesFilters.minSales === '' || 
                                  service.totalSales >= parseInt(servicesWithSalesFilters.minSales);
                                const matchesMaxSales = servicesWithSalesFilters.maxSales === '' || 
                                  service.totalSales <= parseInt(servicesWithSalesFilters.maxSales);
                                
                                return matchesSearch && matchesCategory && matchesMinSales && matchesMaxSales;
                              });
                            return formatCurrency(filteredServices.reduce((sum, service) => sum + service.refundAmount, 0));
                          })()}
                        </td>
                        <td className="p-4 text-right text-green-700 font-bold text-xl">
                          {(() => {
                            const filteredServices = serviceSalesTable
                              .filter(service => service.totalSales > 0)
                              .filter(service => {
                                const matchesSearch = servicesWithSalesFilters.search === '' || 
                                  service.serviceName.toLowerCase().includes(servicesWithSalesFilters.search.toLowerCase());
                                const matchesCategory = servicesWithSalesFilters.category === 'all' || 
                                  service.category === servicesWithSalesFilters.category;
                                const matchesMinSales = servicesWithSalesFilters.minSales === '' || 
                                  service.totalSales >= parseInt(servicesWithSalesFilters.minSales);
                                const matchesMaxSales = servicesWithSalesFilters.maxSales === '' || 
                                  service.totalSales <= parseInt(servicesWithSalesFilters.maxSales);
                                
                                return matchesSearch && matchesCategory && matchesMinSales && matchesMaxSales;
                              });
                            return formatCurrency(filteredServices.reduce((sum, service) => sum + service.netRevenue, 0));
                          })()}
                        </td>
                        <td className="p-4"></td>
                      </tr>
                    </tfoot>
                  </table>
                  {/* Pagination and Add Button */}
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center space-x-2">
                      <Button
                        onClick={() => {/* Add functionality here */}}
                        className={`${isDarkMode ? 'bg-gradient-to-r from-emerald-900/80 to-teal-900/80 hover:from-emerald-800 hover:to-teal-800 border border-emerald-800/50' : 'bg-emerald-600 hover:bg-emerald-700'} text-white`}
                      >
                        Add
                      </Button>
                      <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Showing {Math.min((currentPage - 1) * itemsPerPage + 1, serviceSalesTable.filter(service => service.totalSales > 0).length)} to {Math.min(currentPage * itemsPerPage, serviceSalesTable.filter(service => service.totalSales > 0).length)} of {serviceSalesTable.filter(service => service.totalSales > 0).length} services
                      </span>
                    </div>
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                          />
                        </PaginationItem>
                        {Array.from({ length: Math.ceil(serviceSalesTable.filter(service => service.totalSales > 0).length / itemsPerPage) }, (_, i) => i + 1).map((page) => (
                          <PaginationItem key={page}>
                            <PaginationLink
                              onClick={() => setCurrentPage(page)}
                              isActive={currentPage === page}
                              className="cursor-pointer"
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        ))}
                        <PaginationItem>
                          <PaginationNext
                            onClick={() => setCurrentPage(Math.min(Math.ceil(serviceSalesTable.filter(service => service.totalSales > 0).length / itemsPerPage), currentPage + 1))}
                            className={currentPage === Math.ceil(serviceSalesTable.filter(service => service.totalSales > 0).length / itemsPerPage) ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="top-services" className="space-y-4 sm:space-y-6">
          <Card className={`${isDarkMode ? 'bg-gradient-to-br from-black via-gray-950 to-black border-gray-800/50 shadow-lg shadow-amber-500/5' : 'bg-white border-gray-200'} transition-all hover:shadow-xl`}>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2 mb-1">
                <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-amber-500/10' : 'bg-amber-50'}`}>
                  <Award className={`h-4 w-4 ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`} />
                </div>
                <CardTitle className={`text-base sm:text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Top Performing Services</CardTitle>
              </div>
              <CardDescription className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Services with the highest booking counts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 sm:space-y-4">
                {analytics.topServices.map((service, index) => (
                  <div key={index} className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 p-4 sm:p-6 border rounded-xl hover:shadow-lg transition-all ${isDarkMode ? 'border-gray-800/50 bg-gradient-to-br from-gray-900/50 to-black/50 hover:border-gray-700' : 'border-gray-200 bg-gradient-to-br from-white to-gray-50 hover:bg-gray-50'}`}>
                    <div className="flex items-center space-x-3 sm:space-x-4 w-full sm:w-auto">
                      <div className={`flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full ${index === 0 ? (isDarkMode ? 'bg-amber-500/20 border-2 border-amber-500/50' : 'bg-amber-100 border-2 border-amber-300') : index === 1 ? (isDarkMode ? 'bg-purple-500/20 border-2 border-purple-500/50' : 'bg-purple-100 border-2 border-purple-300') : (isDarkMode ? 'bg-pink-500/20 border-2 border-pink-500/50' : 'bg-pink-100 border-2 border-pink-300')}`}>
                        <span className={`text-lg sm:text-xl font-bold ${index === 0 ? (isDarkMode ? 'text-amber-400' : 'text-amber-600') : index === 1 ? (isDarkMode ? 'text-purple-400' : 'text-purple-600') : (isDarkMode ? 'text-pink-400' : 'text-pink-600')}`}>
                          #{index + 1}
                        </span>
                      </div>
                      <div className="flex items-center space-x-3 flex-1">
                        <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-emerald-500/10' : 'bg-emerald-50'}`}>
                          <Briefcase className={`h-6 w-6 sm:h-8 sm:w-8 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className={`font-semibold text-sm sm:text-base truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{service.title}</h3>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <Badge variant="outline" className={`text-xs ${isDarkMode ? 'border-gray-600 text-gray-300' : ''}`}>{service.category}</Badge>
                            <div className="flex items-center">
                              <Star className={`h-3 w-3 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-500'} mr-1`} />
                              <span className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{service.rating}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4 sm:gap-6 pl-13 sm:pl-0">
                      <div className="text-left sm:text-right">
                        <div className={`text-xl sm:text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {service.bookingCount}
                        </div>
                        <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>bookings</div>
                      </div>
                      <div className={`text-base sm:text-lg font-semibold px-3 py-1 rounded-lg ${isDarkMode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>
                        {service.price}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Services with Sales Table */}
          {false && serviceSalesTable.length > 0 && (
            <Card className={`${isDarkMode ? 'bg-gradient-to-br from-black via-gray-950 to-black border-gray-800/50 shadow-lg' : 'bg-white border-gray-200'}`}>
              <CardHeader>
                <CardTitle className={`${isDarkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
                  <TrendingUp className="h-5 w-5 text-emerald-400" />
                  Services with Sales
                </CardTitle>
                <CardDescription className={`${isDarkMode ? 'text-gray-400' : ''}`}>Services that have recorded at least one sale</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className={`border-b ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                        <th className={`text-left p-4 font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>Service Name</th>
                        <th className={`text-left p-4 font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>Category</th>
                        <th className={`text-right p-4 font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>Price</th>
                        <th className={`text-right p-4 font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>Total Sales</th>
                        <th className={`text-right p-4 font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>Total Revenue</th>
                        <th className={`text-right p-4 font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>Unique Users</th>
                        <th className={`text-right p-4 font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>Refunds</th>
                        <th className={`text-right p-4 font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>Refund Amount</th>
                        <th className={`text-right p-4 font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>Net Revenue</th>
                        <th className={`text-left p-4 font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>Last Sale</th>
                      </tr>
                    </thead>
                    <tbody>
                      {serviceSalesTable.filter(service => service.totalSales > 0).map((service, index) => (
                        <tr key={service._id} className={`border-b ${isDarkMode ? 'hover:bg-gray-800 border-gray-700' : 'hover:bg-gray-50 border-gray-200'} ${index % 2 === 0 ? (isDarkMode ? 'bg-gray-900' : 'bg-white') : (isDarkMode ? 'bg-gray-800' : 'bg-gray-25')}`}>
                          <td className={`p-4 ${isDarkMode ? 'text-white' : 'text-gray-900'} font-medium`}>{service.serviceName}</td>
                          <td className={`p-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{service.category}</td>
                          <td className={`p-4 text-right ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{service.price}</td>
                          <td className={`p-4 text-right font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{service.totalSales}</td>
                          <td className={`p-4 text-right font-semibold text-green-600`}>{formatCurrency(service.totalRevenue)}</td>
                          <td className={`p-4 text-right ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{service.uniqueUserCount}</td>
                          <td className={`p-4 text-right ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{service.totalRefunds}</td>
                          <td className={`p-4 text-right text-red-600`}>{formatCurrency(service.refundAmount)}</td>
                          <td className={`p-4 text-right font-bold text-green-700`}>{formatCurrency(service.netRevenue)}</td>
                          <td className={`p-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{service.lastSaleDate ? new Date(service.lastSaleDate).toLocaleDateString() : 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className={`border-t-2 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-300'} font-semibold`}>
                        <td className={`p-4 ${isDarkMode ? 'text-white' : 'text-gray-900'} font-bold text-lg`} colSpan={3}>TOTALS (Services with Sales)</td>
                        <td className={`p-4 text-right ${isDarkMode ? 'text-white' : 'text-gray-900'} font-bold text-lg`}>
                          {serviceSalesTable.filter(service => service.totalSales > 0).reduce((sum, service) => sum + service.totalSales, 0)}
                        </td>
                        <td className="p-4 text-right text-green-600 font-bold text-lg">
                          {formatCurrency(serviceSalesTable.filter(service => service.totalSales > 0).reduce((sum, service) => sum + service.totalRevenue, 0))}
                        </td>
                        <td className={`p-4 text-right ${isDarkMode ? 'text-white' : 'text-gray-900'} font-bold text-lg`}>
                          {serviceSalesTable.filter(service => service.totalSales > 0).reduce((sum, service) => sum + service.uniqueUserCount, 0)}
                        </td>
                        <td className={`p-4 text-right ${isDarkMode ? 'text-white' : 'text-gray-900'} font-bold text-lg`}>
                          {serviceSalesTable.filter(service => service.totalSales > 0).reduce((sum, service) => sum + service.totalRefunds, 0)}
                        </td>
                        <td className="p-4 text-right text-red-600 font-bold text-lg">
                          {formatCurrency(serviceSalesTable.filter(service => service.totalSales > 0).reduce((sum, service) => sum + service.refundAmount, 0))}
                        </td>
                        <td className="p-4 text-right text-green-700 font-bold text-xl">
                          {formatCurrency(serviceSalesTable.filter(service => service.totalSales > 0).reduce((sum, service) => sum + service.netRevenue, 0))}
                        </td>
                        <td className="p-4"></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Peak Hours Tab (Advanced View Only) */}
        {activeView === 'advanced' && advancedMetrics && (
          <TabsContent value="peak-hours" className="space-y-4">
            <Card className={`${isDarkMode ? 'bg-black border-gray-800' : 'bg-white/90 border-gray-200'} backdrop-blur-sm shadow-xl`}>
              <CardHeader>
                <CardTitle className={`${isDarkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
                  <Clock className="h-5 w-5 text-orange-600" />
                  Peak Performance Hours
                </CardTitle>
                <CardDescription>Identify the most active booking times to optimize operations</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={peakHoursData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#4B5563' : '#e5e7eb'} />
                    <XAxis dataKey="hour" stroke={isDarkMode ? '#9CA3AF' : '#6b7280'} />
                    <YAxis yAxisId="left" orientation="left" stroke={isDarkMode ? '#60A5FA' : '#3b82f6'} />
                    <YAxis yAxisId="right" orientation="right" stroke={isDarkMode ? '#34D399' : '#10b981'} />
                    <Tooltip 
                      contentStyle={isDarkMode ? { backgroundColor: '#374151', border: '1px solid #4B5563', color: '#F9FAFB', borderRadius: '8px' } : { backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                    />
                    <Legend />
                    <Bar yAxisId="left" dataKey="bookings" fill={isDarkMode ? '#60A5FA' : '#3b82f6'} name="Bookings" radius={[8, 8, 0, 0]} />
                    <Bar yAxisId="right" dataKey="revenue" fill={isDarkMode ? '#34D399' : '#10b981'} name="Revenue ($)" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                
                {/* Insights Card */}
                <div className={`mt-6 p-4 ${isDarkMode ? 'bg-gradient-to-r from-gray-900 to-black border-gray-800' : 'bg-gradient-to-r from-purple-50 to-pink-50 border-purple-100'} rounded-xl border`}>
                  <div className="flex items-start gap-3">
                    <div className={`p-2 ${isDarkMode ? 'bg-gradient-to-br from-purple-900/50 to-pink-900/50 border border-purple-800/50' : 'bg-purple-500'} rounded-lg`}>
                      <AlertCircle className={`h-5 w-5 ${isDarkMode ? 'text-purple-300' : 'text-white'}`} />
                    </div>
                    <div>
                      <h4 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-1`}>Optimization Tip</h4>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Schedule promotions and marketing campaigns during peak hours to maximize engagement and conversions. 
                        Consider staffing adjustments based on these patterns.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Daily Revenue Trend */}
            <Card className={`${isDarkMode ? 'bg-gradient-to-br from-black via-gray-950 to-black border-gray-800/50 shadow-xl shadow-emerald-500/5' : 'bg-white/90 border-gray-200'} backdrop-blur-sm shadow-xl`}>
              <CardHeader>
                <CardTitle className={`${isDarkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
                  <Activity className={`h-5 w-5 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
                  Daily Revenue Trend
                </CardTitle>
                <CardDescription className={isDarkMode ? 'text-gray-400' : ''}>Track daily performance over the selected time period</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart data={dailyRevenueData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={isDarkMode ? '#60A5FA' : '#3b82f6'} stopOpacity={0.8}/>
                        <stop offset="95%" stopColor={isDarkMode ? '#60A5FA' : '#3b82f6'} stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#4B5563' : '#e5e7eb'} />
                    <XAxis dataKey="date" stroke={isDarkMode ? '#9CA3AF' : '#6b7280'} angle={-45} textAnchor="end" height={80} />
                    <YAxis stroke={isDarkMode ? '#9CA3AF' : '#6b7280'} />
                    <Tooltip 
                      contentStyle={isDarkMode ? { backgroundColor: '#374151', border: '1px solid #4B5563', color: '#F9FAFB', borderRadius: '8px' } : { backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                      formatter={(value) => [formatCurrency(Number(value)), 'Revenue']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke={isDarkMode ? '#60A5FA' : '#3b82f6'} 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorRevenue)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
        </TabsContent>
        )}

        <TabsContent value="all-services" className="space-y-4 sm:space-y-6">
          {/* All Services Overview Table */}
          {serviceSalesTable.length > 0 && (
            <Card className={`${isDarkMode ? 'bg-gradient-to-br from-black via-gray-950 to-black border-gray-800/50 shadow-lg shadow-pink-500/5' : 'bg-white border-gray-200'} transition-all hover:shadow-xl`}>
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-pink-500/10' : 'bg-pink-50'}`}>
                    <BarChart3 className={`h-4 w-4 ${isDarkMode ? 'text-pink-400' : 'text-pink-600'}`} />
                  </div>
                  <CardTitle className={`text-base sm:text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>All Services Overview</CardTitle>
                </div>
                <CardDescription className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Complete overview of ALL services including those with no sales (shows 0 for unsold services)</CardDescription>
              </CardHeader>
              
              {/* Filters */}
              <div className={`p-3 sm:p-4 border-b ${isDarkMode ? 'border-gray-800/50 bg-gray-950/50' : 'border-gray-200 bg-gray-50'}`}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <div>
                    <label className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1 block`}>
                      Search Services
                    </label>
                    <Input
                      placeholder="Search by service name..."
                      value={allServicesFilters.search}
                      onChange={(e) => setAllServicesFilters(prev => ({ ...prev, search: e.target.value }))}
                      className={isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
                    />
                  </div>
                  
                  <div>
                    <label className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1 block`}>
                      Category
                    </label>
                    <Select value={allServicesFilters.category} onValueChange={(value) => setAllServicesFilters(prev => ({ ...prev, category: value }))}>
                      <SelectTrigger className={isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}>
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {[...new Set(serviceSalesTable.map(service => service.category))].map(category => (
                          <SelectItem key={category} value={category}>{category}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1 block`}>
                      Min Sales
                    </label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={allServicesFilters.minSales}
                      onChange={(e) => setAllServicesFilters(prev => ({ ...prev, minSales: e.target.value }))}
                      className={isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
                    />
                  </div>
                  
                  <div>
                    <label className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1 block`}>
                      Max Sales
                    </label>
                    <Input
                      type="number"
                      placeholder="Any"
                      value={allServicesFilters.maxSales}
                      onChange={(e) => setAllServicesFilters(prev => ({ ...prev, maxSales: e.target.value }))}
                      className={isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
                    />
                  </div>
                </div>
              </div>
              
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className={`border-b ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                        <th className={`text-left p-4 font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>Service Name</th>
                        <th className={`text-left p-4 font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>Category</th>
                        <th className={`text-right p-4 font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>Price</th>
                        <th className={`text-right p-4 font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>Total Sales</th>
                        <th className={`text-right p-4 font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>Total Revenue</th>
                        <th className={`text-right p-4 font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>Unique Users</th>
                        <th className={`text-right p-4 font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>Refunds</th>
                        <th className={`text-right p-4 font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>Refund Amount</th>
                        <th className={`text-right p-4 font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>Net Revenue</th>
                        <th className={`text-left p-4 font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>Last Sale</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const filteredServices = serviceSalesTable.filter(service => {
                          const matchesSearch = allServicesFilters.search === '' || 
                            service.serviceName.toLowerCase().includes(allServicesFilters.search.toLowerCase());
                          const matchesCategory = allServicesFilters.category === 'all' || 
                            service.category === allServicesFilters.category;
                          const matchesMinSales = allServicesFilters.minSales === '' || 
                            service.totalSales >= parseInt(allServicesFilters.minSales);
                          const matchesMaxSales = allServicesFilters.maxSales === '' || 
                            service.totalSales <= parseInt(allServicesFilters.maxSales);
                          
                          return matchesSearch && matchesCategory && matchesMinSales && matchesMaxSales;
                        });
                        
                        return filteredServices
                          .slice((allServicesCurrentPage - 1) * itemsPerPage, allServicesCurrentPage * itemsPerPage)
                          .map((service, index) => (
                          <tr key={service._id} className={`border-b ${isDarkMode ? 'hover:bg-gray-800 border-gray-700' : 'hover:bg-gray-50 border-gray-200'} ${index % 2 === 0 ? (isDarkMode ? 'bg-gray-900' : 'bg-white') : (isDarkMode ? 'bg-gray-800' : 'bg-gray-25')}`}>
                            <td className={`p-4 ${isDarkMode ? 'text-white' : 'text-gray-900'} font-medium`}>{service.serviceName}</td>
                            <td className={`p-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{service.category}</td>
                            <td className={`p-4 text-right ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{service.price}</td>
                            <td className={`p-4 text-right font-semibold ${service.totalSales > 0 ? (isDarkMode ? 'text-white' : 'text-gray-900') : (isDarkMode ? 'text-gray-500' : 'text-gray-400')}`}>{service.totalSales}</td>
                            <td className={`p-4 text-right font-semibold ${service.totalRevenue > 0 ? 'text-green-600' : (isDarkMode ? 'text-gray-500' : 'text-gray-400')}`}>{formatCurrency(service.totalRevenue)}</td>
                            <td className={`p-4 text-right ${service.uniqueUserCount > 0 ? (isDarkMode ? 'text-gray-300' : 'text-gray-600') : (isDarkMode ? 'text-gray-500' : 'text-gray-400')}`}>{service.uniqueUserCount}</td>
                            <td className={`p-4 text-right ${service.totalRefunds > 0 ? (isDarkMode ? 'text-gray-300' : 'text-gray-600') : (isDarkMode ? 'text-gray-500' : 'text-gray-400')}`}>{service.totalRefunds}</td>
                            <td className={`p-4 text-right ${service.refundAmount > 0 ? 'text-red-600' : (isDarkMode ? 'text-gray-500' : 'text-gray-400')}`}>{formatCurrency(service.refundAmount)}</td>
                            <td className={`p-4 text-right font-bold ${service.netRevenue > 0 ? 'text-green-700' : (isDarkMode ? 'text-gray-500' : 'text-gray-400')}`}>{formatCurrency(service.netRevenue)}</td>
                            <td className={`p-4 ${service.lastSaleDate ? (isDarkMode ? 'text-gray-300' : 'text-gray-600') : (isDarkMode ? 'text-gray-500' : 'text-gray-400')}`}>{service.lastSaleDate ? new Date(service.lastSaleDate).toLocaleDateString() : 'Never sold'}</td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                    <tfoot>
                      <tr className={`border-t-2 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-300'} font-semibold`}>
                        <td className={`p-4 ${isDarkMode ? 'text-white' : 'text-gray-900'} font-bold text-lg`} colSpan={3}>TOTALS (Filtered Services)</td>
                        <td className={`p-4 text-right ${isDarkMode ? 'text-white' : 'text-gray-900'} font-bold text-lg`}>
                          {(() => {
                            const filteredServices = serviceSalesTable.filter(service => {
                              const matchesSearch = allServicesFilters.search === '' || 
                                service.serviceName.toLowerCase().includes(allServicesFilters.search.toLowerCase());
                              const matchesCategory = allServicesFilters.category === 'all' || 
                                service.category === allServicesFilters.category;
                              const matchesMinSales = allServicesFilters.minSales === '' || 
                                service.totalSales >= parseInt(allServicesFilters.minSales);
                              const matchesMaxSales = allServicesFilters.maxSales === '' || 
                                service.totalSales <= parseInt(allServicesFilters.maxSales);
                              
                              return matchesSearch && matchesCategory && matchesMinSales && matchesMaxSales;
                            });
                            return filteredServices.reduce((sum, service) => sum + service.totalSales, 0);
                          })()}
                        </td>
                        <td className="p-4 text-right text-green-600 font-bold text-lg">
                          {(() => {
                            const filteredServices = serviceSalesTable.filter(service => {
                              const matchesSearch = allServicesFilters.search === '' || 
                                service.serviceName.toLowerCase().includes(allServicesFilters.search.toLowerCase());
                              const matchesCategory = allServicesFilters.category === 'all' || 
                                service.category === allServicesFilters.category;
                              const matchesMinSales = allServicesFilters.minSales === '' || 
                                service.totalSales >= parseInt(allServicesFilters.minSales);
                              const matchesMaxSales = allServicesFilters.maxSales === '' || 
                                service.totalSales <= parseInt(allServicesFilters.maxSales);
                              
                              return matchesSearch && matchesCategory && matchesMinSales && matchesMaxSales;
                            });
                            return formatCurrency(filteredServices.reduce((sum, service) => sum + service.totalRevenue, 0));
                          })()}
                        </td>
                        <td className={`p-4 text-right ${isDarkMode ? 'text-white' : 'text-gray-900'} font-bold text-lg`}>
                          {(() => {
                            const filteredServices = serviceSalesTable.filter(service => {
                              const matchesSearch = allServicesFilters.search === '' || 
                                service.serviceName.toLowerCase().includes(allServicesFilters.search.toLowerCase());
                              const matchesCategory = allServicesFilters.category === 'all' || 
                                service.category === allServicesFilters.category;
                              const matchesMinSales = allServicesFilters.minSales === '' || 
                                service.totalSales >= parseInt(allServicesFilters.minSales);
                              const matchesMaxSales = allServicesFilters.maxSales === '' || 
                                service.totalSales <= parseInt(allServicesFilters.maxSales);
                              
                              return matchesSearch && matchesCategory && matchesMinSales && matchesMaxSales;
                            });
                            return filteredServices.reduce((sum, service) => sum + service.uniqueUserCount, 0);
                          })()}
                        </td>
                        <td className={`p-4 text-right ${isDarkMode ? 'text-white' : 'text-gray-900'} font-bold text-lg`}>
                          {(() => {
                            const filteredServices = serviceSalesTable.filter(service => {
                              const matchesSearch = allServicesFilters.search === '' || 
                                service.serviceName.toLowerCase().includes(allServicesFilters.search.toLowerCase());
                              const matchesCategory = allServicesFilters.category === 'all' || 
                                service.category === allServicesFilters.category;
                              const matchesMinSales = allServicesFilters.minSales === '' || 
                                service.totalSales >= parseInt(allServicesFilters.minSales);
                              const matchesMaxSales = allServicesFilters.maxSales === '' || 
                                service.totalSales <= parseInt(allServicesFilters.maxSales);
                              
                              return matchesSearch && matchesCategory && matchesMinSales && matchesMaxSales;
                            });
                            return filteredServices.reduce((sum, service) => sum + service.totalRefunds, 0);
                          })()}
                        </td>
                        <td className="p-4 text-right text-red-600 font-bold text-lg">
                          {(() => {
                            const filteredServices = serviceSalesTable.filter(service => {
                              const matchesSearch = allServicesFilters.search === '' || 
                                service.serviceName.toLowerCase().includes(allServicesFilters.search.toLowerCase());
                              const matchesCategory = allServicesFilters.category === 'all' || 
                                service.category === allServicesFilters.category;
                              const matchesMinSales = allServicesFilters.minSales === '' || 
                                service.totalSales >= parseInt(allServicesFilters.minSales);
                              const matchesMaxSales = allServicesFilters.maxSales === '' || 
                                service.totalSales <= parseInt(allServicesFilters.maxSales);
                              
                              return matchesSearch && matchesCategory && matchesMinSales && matchesMaxSales;
                            });
                            return formatCurrency(filteredServices.reduce((sum, service) => sum + service.refundAmount, 0));
                          })()}
                        </td>
                        <td className="p-4 text-right text-green-700 font-bold text-xl">
                          {(() => {
                            const filteredServices = serviceSalesTable.filter(service => {
                              const matchesSearch = allServicesFilters.search === '' || 
                                service.serviceName.toLowerCase().includes(allServicesFilters.search.toLowerCase());
                              const matchesCategory = allServicesFilters.category === 'all' || 
                                service.category === allServicesFilters.category;
                              const matchesMinSales = allServicesFilters.minSales === '' || 
                                service.totalSales >= parseInt(allServicesFilters.minSales);
                              const matchesMaxSales = allServicesFilters.maxSales === '' || 
                                service.totalSales <= parseInt(allServicesFilters.maxSales);
                              
                              return matchesSearch && matchesCategory && matchesMinSales && matchesMaxSales;
                            });
                            return formatCurrency(filteredServices.reduce((sum, service) => sum + service.netRevenue, 0));
                          })()}
                        </td>
                        <td className="p-4"></td>
                      </tr>
                    </tfoot>
                  </table>
                  {/* Pagination and Add Button */}
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center space-x-2">
                      <Button
                        onClick={() => {/* Add functionality here */}}
                        className={`${isDarkMode ? 'bg-gradient-to-r from-purple-900/80 to-pink-900/80 hover:from-purple-800 hover:to-pink-800 border border-purple-800/50' : 'bg-purple-600 hover:bg-purple-700'} text-white`}
                      >
                        Add
                      </Button>
                      <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Showing {Math.min((allServicesCurrentPage - 1) * itemsPerPage + 1, (() => {
                          const filteredServices = serviceSalesTable.filter(service => {
                            const matchesSearch = allServicesFilters.search === '' || 
                              service.serviceName.toLowerCase().includes(allServicesFilters.search.toLowerCase());
                            const matchesCategory = allServicesFilters.category === 'all' || 
                              service.category === allServicesFilters.category;
                            const matchesMinSales = allServicesFilters.minSales === '' || 
                              service.totalSales >= parseInt(allServicesFilters.minSales);
                            const matchesMaxSales = allServicesFilters.maxSales === '' || 
                              service.totalSales <= parseInt(allServicesFilters.maxSales);
                            
                            return matchesSearch && matchesCategory && matchesMinSales && matchesMaxSales;
                          });
                          return filteredServices.length;
                        })())} to {Math.min(allServicesCurrentPage * itemsPerPage, (() => {
                          const filteredServices = serviceSalesTable.filter(service => {
                            const matchesSearch = allServicesFilters.search === '' || 
                              service.serviceName.toLowerCase().includes(allServicesFilters.search.toLowerCase());
                            const matchesCategory = allServicesFilters.category === 'all' || 
                              service.category === allServicesFilters.category;
                            const matchesMinSales = allServicesFilters.minSales === '' || 
                              service.totalSales >= parseInt(allServicesFilters.minSales);
                            const matchesMaxSales = allServicesFilters.maxSales === '' || 
                              service.totalSales <= parseInt(allServicesFilters.maxSales);
                            
                            return matchesSearch && matchesCategory && matchesMinSales && matchesMaxSales;
                          });
                          return filteredServices.length;
                        })())} of {(() => {
                          const filteredServices = serviceSalesTable.filter(service => {
                            const matchesSearch = allServicesFilters.search === '' || 
                              service.serviceName.toLowerCase().includes(allServicesFilters.search.toLowerCase());
                            const matchesCategory = allServicesFilters.category === 'all' || 
                              service.category === allServicesFilters.category;
                            const matchesMinSales = allServicesFilters.minSales === '' || 
                              service.totalSales >= parseInt(allServicesFilters.minSales);
                            const matchesMaxSales = allServicesFilters.maxSales === '' || 
                              service.totalSales <= parseInt(allServicesFilters.maxSales);
                            
                            return matchesSearch && matchesCategory && matchesMinSales && matchesMaxSales;
                          });
                          return filteredServices.length;
                        })()} services
                      </span>
                    </div>
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={() => setAllServicesCurrentPage(Math.max(1, allServicesCurrentPage - 1))}
                            className={allServicesCurrentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                          />
                        </PaginationItem>
                        {(() => {
                          const filteredServices = serviceSalesTable.filter(service => {
                            const matchesSearch = allServicesFilters.search === '' || 
                              service.serviceName.toLowerCase().includes(allServicesFilters.search.toLowerCase());
                            const matchesCategory = allServicesFilters.category === 'all' || 
                              service.category === allServicesFilters.category;
                            const matchesMinSales = allServicesFilters.minSales === '' || 
                              service.totalSales >= parseInt(allServicesFilters.minSales);
                            const matchesMaxSales = allServicesFilters.maxSales === '' || 
                              service.totalSales <= parseInt(allServicesFilters.maxSales);
                            
                            return matchesSearch && matchesCategory && matchesMinSales && matchesMaxSales;
                          });
                          const totalPages = Math.ceil(filteredServices.length / itemsPerPage);
                          
                          return Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <PaginationItem key={page}>
                              <PaginationLink
                                onClick={() => setAllServicesCurrentPage(page)}
                                isActive={allServicesCurrentPage === page}
                                className="cursor-pointer"
                              >
                                {page}
                              </PaginationLink>
                            </PaginationItem>
                          ));
                        })()}
                        <PaginationItem>
                          <PaginationNext
                            onClick={() => {
                              const filteredServices = serviceSalesTable.filter(service => {
                                const matchesSearch = allServicesFilters.search === '' || 
                                  service.serviceName.toLowerCase().includes(allServicesFilters.search.toLowerCase());
                                const matchesCategory = allServicesFilters.category === 'all' || 
                                  service.category === allServicesFilters.category;
                                const matchesMinSales = allServicesFilters.minSales === '' || 
                                  service.totalSales >= parseInt(allServicesFilters.minSales);
                                const matchesMaxSales = allServicesFilters.maxSales === '' || 
                                  service.totalSales <= parseInt(allServicesFilters.maxSales);
                                
                                return matchesSearch && matchesCategory && matchesMinSales && matchesMaxSales;
                              });
                              const totalPages = Math.ceil(filteredServices.length / itemsPerPage);
                              setAllServicesCurrentPage(Math.min(totalPages, allServicesCurrentPage + 1));
                            }}
                            className={(() => {
                              const filteredServices = serviceSalesTable.filter(service => {
                                const matchesSearch = allServicesFilters.search === '' || 
                                  service.serviceName.toLowerCase().includes(allServicesFilters.search.toLowerCase());
                                const matchesCategory = allServicesFilters.category === 'all' || 
                                  service.category === allServicesFilters.category;
                                const matchesMinSales = allServicesFilters.minSales === '' || 
                                  service.totalSales >= parseInt(allServicesFilters.minSales);
                                const matchesMaxSales = allServicesFilters.maxSales === '' || 
                                  service.totalSales <= parseInt(allServicesFilters.maxSales);
                                
                                return matchesSearch && matchesCategory && matchesMinSales && matchesMaxSales;
                              });
                              const totalPages = Math.ceil(filteredServices.length / itemsPerPage);
                              return allServicesCurrentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer';
                            })()}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Customer Insights Tab (Advanced View Only) */}
        {activeView === 'advanced' && advancedMetrics && (
          <TabsContent value="satisfaction" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Customer Satisfaction Overview */}
              <Card className={`${isDarkMode ? 'bg-gradient-to-br from-black via-gray-950 to-black border-gray-800/50 shadow-lg' : 'bg-white border-gray-200'}`}>
                <CardHeader>
                  <CardTitle className={`${isDarkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
                    <Heart className="h-5 w-5 text-pink-500" />
                    Customer Satisfaction Metrics
                  </CardTitle>
                  <CardDescription className={isDarkMode ? 'text-gray-400' : ''}>Key indicators of customer loyalty and satisfaction</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-gray-800/50 border border-gray-700' : 'bg-gradient-to-br from-pink-50 to-rose-50'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Repeat Customer Rate</span>
                        <Badge variant="default" className="bg-pink-600">{advancedMetrics.metrics.repeatCustomerRate.toFixed(1)}%</Badge>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3 dark:bg-gray-700">
                        <div className="bg-gradient-to-r from-pink-500 to-rose-600 h-3 rounded-full transition-all duration-500" style={{ width: `${advancedMetrics.metrics.repeatCustomerRate}%` }}></div>
                      </div>
                      <p className={`text-xs mt-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>
                        {advancedMetrics.satisfaction.repeatCustomers} out of {advancedMetrics.satisfaction.totalCustomers} customers made repeat purchases
                      </p>
                    </div>

                    <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-gray-800/50 border border-gray-700' : 'bg-gradient-to-br from-purple-50 to-violet-50'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Avg Purchases per Customer</span>
                        <Badge variant="outline" className="text-purple-600 border-purple-600">{advancedMetrics.satisfaction.avgPurchasesPerCustomer.toFixed(2)}</Badge>
                      </div>
                      <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>
                        On average, each customer makes {advancedMetrics.satisfaction.avgPurchasesPerCustomer.toFixed(2)} purchases
                      </p>
                    </div>

                    <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-gray-800/50 border border-gray-700' : 'bg-gradient-to-br from-emerald-50 to-teal-50'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Customer Lifetime Value</span>
                        <Badge variant="outline" className="text-emerald-600 border-emerald-600">{formatCurrency(advancedMetrics.metrics.customerLTV)}</Badge>
                      </div>
                      <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>
                        Average total value generated per customer over their lifetime
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Customer Behavior Insights */}
              <Card className={`${isDarkMode ? 'bg-gradient-to-br from-black via-gray-950 to-black border-gray-800/50 shadow-lg' : 'bg-white border-gray-200'}`}>
                <CardHeader>
                  <CardTitle className={`${isDarkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
                    <Users className="h-5 w-5 text-blue-500" />
                    Customer Behavior Insights
                  </CardTitle>
                  <CardDescription className={isDarkMode ? 'text-gray-400' : ''}>Understanding customer patterns and trends</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800/30' : 'bg-gray-50'}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Customers</p>
                          <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{advancedMetrics.satisfaction.totalCustomers}</p>
                        </div>
                        <div className={`p-3 ${isDarkMode ? 'bg-blue-900/30' : 'bg-blue-100'} rounded-lg`}>
                          <Users className={`h-6 w-6 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                        </div>
                      </div>
                    </div>

                    <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800/30' : 'bg-gray-50'}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Repeat Customers</p>
                          <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{advancedMetrics.satisfaction.repeatCustomers}</p>
                        </div>
                        <div className={`p-3 ${isDarkMode ? 'bg-pink-900/30' : 'bg-pink-100'} rounded-lg`}>
                          <Heart className={`h-6 w-6 ${isDarkMode ? 'text-pink-400' : 'text-pink-600'}`} />
                        </div>
                      </div>
                    </div>

                    <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800/30' : 'bg-gray-50'}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>One-Time Customers</p>
                          <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{advancedMetrics.satisfaction.totalCustomers - advancedMetrics.satisfaction.repeatCustomers}</p>
                        </div>
                        <div className={`p-3 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-lg`}>
                          <Users className={`h-6 w-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Actionable Insights */}
            <Card className={`${isDarkMode ? 'bg-gradient-to-br from-black via-gray-950 to-black border-gray-800/50 shadow-lg' : 'bg-white border-gray-200'}`}>
              <CardHeader>
                <CardTitle className={`${isDarkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
                  <Target className="h-5 w-5 text-amber-500" />
                  Actionable Insights & Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-gradient-to-br from-emerald-900/20 to-teal-900/20 border border-emerald-800/30' : 'bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200'}`}>
                    <div className="flex items-start gap-3">
                      <div className={`p-2 ${isDarkMode ? 'bg-emerald-900/50' : 'bg-emerald-500'} rounded-lg flex-shrink-0`}>
                        <TrendingUp className={`h-5 w-5 ${isDarkMode ? 'text-emerald-300' : 'text-white'}`} />
                      </div>
                      <div>
                        <h4 className={`font-semibold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Retention Strategy</h4>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          With a {advancedMetrics.metrics.repeatCustomerRate.toFixed(1)}% repeat rate, focus on loyalty programs and personalized follow-ups to increase retention.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-gradient-to-br from-purple-900/20 to-pink-900/20 border border-purple-800/30' : 'bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200'}`}>
                    <div className="flex items-start gap-3">
                      <div className={`p-2 ${isDarkMode ? 'bg-purple-900/50' : 'bg-purple-500'} rounded-lg flex-shrink-0`}>
                        <Award className={`h-5 w-5 ${isDarkMode ? 'text-purple-300' : 'text-white'}`} />
                      </div>
                      <div>
                        <h4 className={`font-semibold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Upsell Opportunities</h4>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          Average {advancedMetrics.satisfaction.avgPurchasesPerCustomer.toFixed(2)} purchases per customer. Target customers with complementary services to increase this metric.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-gradient-to-br from-amber-900/20 to-orange-900/20 border border-amber-800/30' : 'bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200'}`}>
                    <div className="flex items-start gap-3">
                      <div className={`p-2 ${isDarkMode ? 'bg-amber-900/50' : 'bg-amber-500'} rounded-lg flex-shrink-0`}>
                        <DollarSign className={`h-5 w-5 ${isDarkMode ? 'text-amber-300' : 'text-white'}`} />
                      </div>
                      <div>
                        <h4 className={`font-semibold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Revenue Optimization</h4>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          Customer LTV is {formatCurrency(advancedMetrics.metrics.customerLTV)}. Focus on high-value customers with premium service offerings.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-gradient-to-br from-blue-900/20 to-cyan-900/20 border border-blue-800/30' : 'bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200'}`}>
                    <div className="flex items-start gap-3">
                      <div className={`p-2 ${isDarkMode ? 'bg-blue-900/50' : 'bg-blue-500'} rounded-lg flex-shrink-0`}>
                        <Target className={`h-5 w-5 ${isDarkMode ? 'text-blue-300' : 'text-white'}`} />
                      </div>
                      <div>
                        <h4 className={`font-semibold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Conversion Focus</h4>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {advancedMetrics.metrics.conversionRate.toFixed(1)}% conversion rate. Optimize consultation process and follow-up strategies to improve conversions.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
        </Tabs>
      </div>
      </div>
    </div>
  </>
  );
}
