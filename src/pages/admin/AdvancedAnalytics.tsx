import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, 
  PolarRadiusAxis, Radar, Legend, ComposedChart, ScatterChart, Scatter
} from "recharts";
import { 
  TrendingUp, TrendingDown, DollarSign, Users, Activity, 
  Target, Clock, Zap, Award, AlertCircle, ArrowUpRight, 
  ArrowDownRight, Calendar, BarChart3, PieChart as PieChartIcon
} from "lucide-react";
import { toast } from "sonner";
import api from "@/utils/api";
import { useDarkMode } from "@/contexts/DarkModeContext";

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
}

interface CohortData {
  cohort: string;
  customers: number;
  revenue: number;
  avgPurchases: number;
  retentionRate: number;
}

interface ServicePerformance {
  _id: string;
  serviceName: string;
  category: string;
  totalBookings: number;
  totalRevenue: number;
  netRevenue: number;
  refundRate: number;
  customerCount: number;
  repeatCustomerRate: number;
  avgRevenue: number;
  revenuePerCustomer: number;
}

interface ForecastData {
  historical: Array<{
    _id: { year: number; month: number; day: number };
    revenue: number;
    bookings: number;
  }>;
  forecast: Array<{
    date: string;
    predictedRevenue: number;
    confidence: number;
  }>;
  summary: {
    avgDailyRevenue: number;
    trend: string;
    trendRate: number;
    projectedMonthlyRevenue: number;
  };
}

const COLORS = {
  primary: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  purple: '#8b5cf6',
  teal: '#14b8a6'
};

export default function AdvancedAnalytics() {
  const [metrics, setMetrics] = useState<AdvancedMetrics | null>(null);
  const [cohorts, setCohorts] = useState<CohortData[]>([]);
  const [performance, setPerformance] = useState<ServicePerformance[]>([]);
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('90');
  const { isDarkMode } = useDarkMode();

  useEffect(() => {
    fetchAllAnalytics();
  }, [timeRange]);

  const fetchAllAnalytics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("authToken");
      if (!token) {
        toast.error("Authentication required");
        return;
      }

      const [metricsRes, cohortsRes, performanceRes, forecastRes] = await Promise.all([
        api.get(`/admin/analytics/advanced/metrics?timeRange=${timeRange}`),
        api.get('/admin/analytics/advanced/cohorts?months=6'),
        api.get('/admin/analytics/advanced/performance'),
        api.get('/admin/analytics/advanced/forecast?days=30')
      ]);

      if (metricsRes.data.success) setMetrics(metricsRes.data.data);
      if (cohortsRes.data.success) setCohorts(cohortsRes.data.data);
      if (performanceRes.data.success) setPerformance(performanceRes.data.data);
      if (forecastRes.data.success) setForecast(forecastRes.data.data);

      toast.success("Advanced analytics loaded successfully");
    } catch (error: any) {
      console.error("Error fetching advanced analytics:", error);
      toast.error("Failed to load advanced analytics");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD'
    }).format(amount);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const formatDate = (dateObj: { year: number; month: number; day: number }) => {
    return `${dateObj.year}-${String(dateObj.month).padStart(2, '0')}-${String(dateObj.day).padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className={`p-6 min-h-screen ${isDarkMode ? 'bg-black' : 'bg-white'}`}>
        <div className={`text-xl ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Loading advanced analytics...</div>
        <div className={`mt-4 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Analyzing trends, forecasting revenue, and calculating advanced metrics...
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className={`p-6 min-h-screen ${isDarkMode ? 'bg-black' : 'bg-white'}`}>
        <div className={`${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Failed to load analytics data</div>
      </div>
    );
  }

  // Prepare chart data
  const dailyRevenueData = metrics.trends.dailyRevenue.map(day => ({
    date: formatDate(day._id),
    revenue: day.revenue,
    bookings: day.bookings
  }));

  const peakHoursData = metrics.trends.peakHours.map(hour => ({
    hour: `${hour._id}:00`,
    bookings: hour.bookings,
    revenue: hour.revenue
  }));

  const forecastChartData = forecast ? [
    ...forecast.historical.slice(-30).map(day => ({
      date: formatDate(day._id),
      actual: day.revenue,
      predicted: null,
      confidence: null
    })),
    ...forecast.forecast.map(day => ({
      date: day.date,
      actual: null,
      predicted: day.predictedRevenue,
      confidence: day.confidence
    }))
  ] : [];

  return (
    <div className={`p-6 space-y-6 min-h-screen ${isDarkMode ? 'bg-black' : 'bg-white'}`}>
      {/* Header */}
      <div className={`flex justify-between items-center p-6 rounded-xl ${isDarkMode ? 'bg-gradient-to-br from-black via-gray-900 to-black border border-gray-800/50' : 'bg-gradient-to-br from-white to-gray-50'}`}>
        <div>
          <h1 className={`text-3xl font-bold flex items-center gap-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20' : 'bg-purple-100'}`}>
              <BarChart3 className={`h-8 w-8 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
            </div>
            Advanced Analytics Dashboard
          </h1>
          <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>Real-time insights, predictions, and performance metrics</p>
        </div>
        <div className="flex gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className={`px-4 py-2 border rounded-lg ${isDarkMode ? 'bg-gray-900 border-gray-700 text-gray-200' : 'bg-white border-gray-300 text-gray-900'}`}
          >
            <option value="30">Last 30 Days</option>
            <option value="60">Last 60 Days</option>
            <option value="90">Last 90 Days</option>
            <option value="180">Last 6 Months</option>
          </select>
          <button
            onClick={fetchAllAnalytics}
            className={`px-4 py-2 rounded-lg transition-all ${isDarkMode ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg shadow-purple-500/20' : 'bg-purple-600 hover:bg-purple-700 text-white'}`}
          >
            Refresh Data
          </button>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className={`${isDarkMode ? 'bg-gradient-to-br from-black via-gray-950 to-black border-gray-800/50 shadow-lg shadow-emerald-500/5' : 'border-gray-200 bg-gradient-to-br from-emerald-50 to-white'}`}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Revenue Growth</CardTitle>
            {metrics.growth.revenue >= 0 ? (
              <TrendingUp className="h-4 w-4 text-emerald-400" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {formatCurrency(metrics.currentPeriod.revenue)}
            </div>
            <div className={`text-sm flex items-center gap-1 mt-1 ${
              metrics.growth.revenue >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {metrics.growth.revenue >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
              {formatPercent(metrics.growth.revenue)} vs previous period
            </div>
          </CardContent>
        </Card>

        <Card className={`${isDarkMode ? 'bg-gradient-to-br from-black via-gray-950 to-black border-gray-800/50 shadow-lg shadow-purple-500/5' : 'border-gray-200 bg-gradient-to-br from-purple-50 to-white'}`}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Conversion Rate</CardTitle>
            <Target className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {metrics.metrics.conversionRate.toFixed(1)}%
            </div>
            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
              Consultation to booking conversion
            </div>
          </CardContent>
        </Card>

        <Card className={`${isDarkMode ? 'bg-gradient-to-br from-black via-gray-950 to-black border-gray-800/50 shadow-lg shadow-pink-500/5' : 'border-gray-200 bg-gradient-to-br from-pink-50 to-white'}`}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Customer LTV</CardTitle>
            <Award className="h-4 w-4 text-pink-400" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {formatCurrency(metrics.metrics.customerLTV)}
            </div>
            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
              Avg {metrics.metrics.avgPurchaseFrequency.toFixed(1)} purchases per customer
            </div>
          </CardContent>
        </Card>

        <Card className={`${isDarkMode ? 'bg-gradient-to-br from-black via-gray-950 to-black border-gray-800/50 shadow-lg shadow-amber-500/5' : 'border-gray-200 bg-gradient-to-br from-amber-50 to-white'}`}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Predicted Daily Revenue</CardTitle>
            <Zap className="h-4 w-4 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {formatCurrency(metrics.metrics.predictedDailyRevenue)}
            </div>
            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
              7-day moving average forecast
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Period Comparison */}
      <Card className={`${isDarkMode ? 'bg-gradient-to-br from-black via-gray-950 to-black border-gray-800/50 shadow-lg' : 'border-gray-200 bg-white'}`}>
        <CardHeader>
          <CardTitle className={`${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Period Comparison</CardTitle>
          <CardDescription className={`${isDarkMode ? 'text-gray-400' : ''}`}>Current vs previous period performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Revenue</span>
                <Badge variant={metrics.growth.revenue >= 0 ? "default" : "destructive"}>
                  {formatPercent(metrics.growth.revenue)}
                </Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>Current: {formatCurrency(metrics.currentPeriod.revenue)}</span>
                <span className={`${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Previous: {formatCurrency(metrics.previousPeriod.revenue)}</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Bookings</span>
                <Badge variant={metrics.growth.bookings >= 0 ? "default" : "destructive"}>
                  {formatPercent(metrics.growth.bookings)}
                </Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>Current: {metrics.currentPeriod.bookings}</span>
                <span className={`${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Previous: {metrics.previousPeriod.bookings}</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Customers</span>
                <Badge variant={metrics.growth.customers >= 0 ? "default" : "destructive"}>
                  {formatPercent(metrics.growth.customers)}
                </Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>Current: {metrics.currentPeriod.customers}</span>
                <span className={`${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Previous: {metrics.previousPeriod.customers}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList className={`grid w-full grid-cols-5 ${isDarkMode ? 'bg-gray-800' : ''}`}>
          <TabsTrigger value="trends">Revenue Trends</TabsTrigger>
          <TabsTrigger value="forecast">Forecasting</TabsTrigger>
          <TabsTrigger value="performance">Service Performance</TabsTrigger>
          <TabsTrigger value="cohorts">Cohort Analysis</TabsTrigger>
          <TabsTrigger value="insights">Peak Hours</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <Card className={`${isDarkMode ? 'bg-gradient-to-br from-black via-gray-950 to-black border-gray-800/50 shadow-lg' : 'border-gray-200 bg-white'}`}>
            <CardHeader>
              <CardTitle className={`${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Daily Revenue & Bookings Trend</CardTitle>
              <CardDescription className={`${isDarkMode ? 'text-gray-400' : ''}`}>Track daily performance over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={dailyRevenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" angle={-45} textAnchor="end" height={80} />
                  <YAxis yAxisId="left" orientation="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Area yAxisId="left" type="monotone" dataKey="revenue" fill={COLORS.primary} stroke={COLORS.primary} fillOpacity={0.3} name="Revenue ($)" />
                  <Line yAxisId="right" type="monotone" dataKey="bookings" stroke={COLORS.success} strokeWidth={2} name="Bookings" />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="forecast" className="space-y-4">
          <Card className={`${isDarkMode ? 'bg-gradient-to-br from-black via-gray-950 to-black border-gray-800/50 shadow-lg' : 'border-gray-200 bg-white'}`}>
            <CardHeader>
              <CardTitle className={`${isDarkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
                <Activity className="h-5 w-5 text-purple-400" />
                Revenue Forecast (Next 30 Days)
              </CardTitle>
              <CardDescription>
                {forecast && (
                  <div className="flex gap-4 mt-2">
                    <span>Trend: <Badge variant={forecast.summary.trend === 'increasing' ? 'default' : 'secondary'}>{forecast.summary.trend}</Badge></span>
                    <span>Projected Monthly: <strong>{formatCurrency(forecast.summary.projectedMonthlyRevenue)}</strong></span>
                  </div>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={forecastChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="actual" stroke={COLORS.primary} strokeWidth={2} name="Actual Revenue" dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="predicted" stroke={COLORS.warning} strokeWidth={2} strokeDasharray="5 5" name="Predicted Revenue" dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card className={`${isDarkMode ? 'bg-gradient-to-br from-black via-gray-950 to-black border-gray-800/50 shadow-lg' : 'border-gray-200 bg-white'}`}>
            <CardHeader>
              <CardTitle className={`${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Service Performance Comparison</CardTitle>
              <CardDescription className={`${isDarkMode ? 'text-gray-400' : ''}`}>Detailed metrics for each service</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className={`border-b ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                      <th className={`text-left p-3 font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>Service</th>
                      <th className={`text-left p-3 font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>Category</th>
                      <th className={`text-right p-3 font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>Bookings</th>
                      <th className={`text-right p-3 font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>Net Revenue</th>
                      <th className={`text-right p-3 font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>Customers</th>
                      <th className={`text-right p-3 font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>Repeat Rate</th>
                      <th className={`text-right p-3 font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>Refund Rate</th>
                      <th className={`text-right p-3 font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>Avg Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {performance.slice(0, 10).map((service, index) => (
                      <tr key={service._id} className={`border-b ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'} ${index % 2 === 0 ? (isDarkMode ? 'bg-gray-900' : 'bg-white') : (isDarkMode ? 'bg-gray-800' : 'bg-gray-50')}`}>
                        <td className={`p-3 font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>{service.serviceName}</td>
                        <td className="p-3">
                          <Badge variant="outline">{service.category}</Badge>
                        </td>
                        <td className={`p-3 text-right ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>{service.totalBookings}</td>
                        <td className={`p-3 text-right ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'} font-medium`}>{formatCurrency(service.netRevenue)}</td>
                        <td className={`p-3 text-right ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>{service.customerCount}</td>
                        <td className="p-3 text-right">
                          <Badge variant={service.repeatCustomerRate > 20 ? "default" : "secondary"}>
                            {service.repeatCustomerRate.toFixed(1)}%
                          </Badge>
                        </td>
                        <td className="p-3 text-right">
                          <Badge variant={service.refundRate < 5 ? "default" : "destructive"}>
                            {service.refundRate.toFixed(1)}%
                          </Badge>
                        </td>
                        <td className="p-3 text-right text-gray-900">{formatCurrency(service.avgRevenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cohorts" className="space-y-4">
          <Card className={`${isDarkMode ? 'bg-gradient-to-br from-black via-gray-950 to-black border-gray-800/50 shadow-lg' : 'border-gray-200 bg-white'}`}>
            <CardHeader>
              <CardTitle className={`${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Customer Cohort Analysis</CardTitle>
              <CardDescription className={`${isDarkMode ? 'text-gray-400' : ''}`}>Track customer retention and behavior by acquisition month</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {cohorts.map((cohort) => (
                  <div key={cohort.cohort} className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${isDarkMode ? 'border-gray-800/50 bg-gradient-to-br from-gray-950 to-black' : ''}`}>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
                          <Calendar className={`h-4 w-4 ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`} />
                          {cohort.cohort}
                        </h3>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{cohort.customers} customers acquired</p>
                      </div>
                      <Badge variant={cohort.retentionRate > 30 ? "default" : "secondary"} className="text-lg px-3 py-1">
                        {cohort.retentionRate.toFixed(1)}% Retention
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Revenue</span>
                        <div className={`text-lg font-semibold ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>{formatCurrency(cohort.revenue)}</div>
                      </div>
                      <div>
                        <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Avg Purchases</span>
                        <div className={`text-lg font-semibold ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>{cohort.avgPurchases.toFixed(1)}</div>
                      </div>
                      <div>
                        <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Revenue per Customer</span>
                        <div className={`text-lg font-semibold ${isDarkMode ? 'text-pink-400' : 'text-pink-600'}`}>
                          {formatCurrency(cohort.revenue / cohort.customers)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <Card className={`${isDarkMode ? 'bg-gradient-to-br from-black via-gray-950 to-black border-gray-800/50 shadow-lg' : 'border-gray-200 bg-white'}`}>
            <CardHeader>
              <CardTitle className={`${isDarkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
                <Clock className={`h-5 w-5 ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`} />
                Peak Performance Hours
              </CardTitle>
              <CardDescription className={`${isDarkMode ? 'text-gray-400' : ''}`}>Identify the most active booking times</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={peakHoursData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis yAxisId="left" orientation="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="bookings" fill={COLORS.primary} name="Bookings" />
                  <Bar yAxisId="right" dataKey="revenue" fill={COLORS.success} name="Revenue ($)" />
                </BarChart>
              </ResponsiveContainer>
              <div className={`mt-4 p-4 rounded-lg ${isDarkMode ? 'bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20' : 'bg-purple-50'}`}>
                <div className="flex items-start gap-2">
                  <AlertCircle className={`h-5 w-5 mt-0.5 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                  <div>
                    <h4 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Optimization Tip</h4>
                    <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Schedule promotions and marketing campaigns during peak hours to maximize engagement and conversions.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
