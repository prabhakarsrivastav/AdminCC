import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, Users, DollarSign, Calendar, Star } from "lucide-react";
import { toast } from "sonner";
import { useDarkMode } from "@/contexts/DarkModeContext";

interface ServiceAnalytics {
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

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function ServiceSalesAnalytics() {
  const { isDarkMode } = useDarkMode();
  const [analytics, setAnalytics] = useState<ServiceAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/admin/analytics/services`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }

      const data = await response.json();
      setAnalytics(data.data);
    } catch (error) {
      console.error("Error fetching service analytics:", error);
      toast.error("Failed to load service analytics");
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

  const formatMonth = (year: number, month: number) => {
    return new Date(year, month - 1).toLocaleDateString('en-CA', {
      year: 'numeric',
      month: 'short'
    });
  };

  if (loading) {
    return (
      <div className={`p-6 min-h-screen ${isDarkMode ? 'bg-black' : 'bg-white'}`}>
        <div className={`text-center py-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-900'}`}>Loading service analytics...</div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className={`p-6 min-h-screen ${isDarkMode ? 'bg-black' : 'bg-white'}`}>
        <div className={`text-center py-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-900'}`}>Failed to load analytics data</div>
      </div>
    );
  }

  // Prepare chart data
  const serviceBreakdownData = analytics.serviceBreakdown.map(service => ({
    name: service._id.charAt(0).toUpperCase() + service._id.slice(1),
    value: service.count,
    revenue: service.totalRevenue
  }));

  const monthlyData = analytics.monthlySales.map(month => ({
    month: formatMonth(month._id.year, month._id.month),
    bookings: month.count,
    revenue: month.revenue
  }));

  return (
    <div className={`p-6 space-y-6 min-h-screen ${isDarkMode ? 'bg-black' : 'bg-white'}`}>
      <div className="flex justify-between items-center">
        <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Service Sales Analytics</h1>
        <button
          onClick={fetchAnalytics}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Refresh Data
        </button>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className={`${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {formatCurrency(analytics.totalRevenue)}
            </div>
          </CardContent>
        </Card>

        <Card className={`${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Bookings</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {analytics.totalBookings}
            </div>
          </CardContent>
        </Card>

        <Card className={`${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Avg. Booking Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {analytics.totalBookings > 0
                ? formatCurrency(analytics.totalRevenue / analytics.totalBookings)
                : formatCurrency(0)
              }
            </div>
          </CardContent>
        </Card>

        <Card className={`${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Active Services</CardTitle>
            <Calendar className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {analytics.serviceBreakdown.length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className={`grid w-full grid-cols-4 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'} p-1 rounded-xl`}>
          <TabsTrigger value="overview" className={`data-[state=active]:${isDarkMode ? 'bg-gray-700' : 'bg-white'} data-[state=active]:shadow-sm rounded-lg ${isDarkMode ? 'text-gray-200 data-[state=active]:text-white' : 'text-gray-700 data-[state=active]:text-gray-900'}`}>Overview</TabsTrigger>
          <TabsTrigger value="breakdown" className={`data-[state=active]:${isDarkMode ? 'bg-gray-700' : 'bg-white'} data-[state=active]:shadow-sm rounded-lg ${isDarkMode ? 'text-gray-200 data-[state=active]:text-white' : 'text-gray-700 data-[state=active]:text-gray-900'}`}>Service Breakdown</TabsTrigger>
          <TabsTrigger value="trends" className={`data-[state=active]:${isDarkMode ? 'bg-gray-700' : 'bg-white'} data-[state=active]:shadow-sm rounded-lg ${isDarkMode ? 'text-gray-200 data-[state=active]:text-white' : 'text-gray-700 data-[state=active]:text-gray-900'}`}>Monthly Trends</TabsTrigger>
          <TabsTrigger value="top-services" className={`data-[state=active]:${isDarkMode ? 'bg-gray-700' : 'bg-white'} data-[state=active]:shadow-sm rounded-lg ${isDarkMode ? 'text-gray-200 data-[state=active]:text-white' : 'text-gray-700 data-[state=active]:text-gray-900'}`}>Top Services</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className={`${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
              <CardHeader>
                <CardTitle className={isDarkMode ? 'text-white' : 'text-gray-900'}>Service Distribution</CardTitle>
                <CardDescription>Bookings by service type</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={serviceBreakdownData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {serviceBreakdownData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className={`${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
              <CardHeader>
                <CardTitle className={isDarkMode ? 'text-white' : 'text-gray-900'}>Revenue by Service</CardTitle>
                <CardDescription>Total revenue generated by each service type</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={serviceBreakdownData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(value) => `$${value}`} />
                    <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Revenue']} />
                    <Bar dataKey="revenue" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="breakdown" className="space-y-4">
          <Card className={`${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
            <CardHeader>
              <CardTitle className={isDarkMode ? 'text-white' : 'text-gray-900'}>Service Performance Details</CardTitle>
              <CardDescription>Detailed breakdown of each service type</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.serviceBreakdown.map((service) => (
                  <div key={service._id} className={`border rounded-lg p-4 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className={`text-lg font-semibold capitalize ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {service._id}
                      </h3>
                      <Badge variant="secondary">
                        {service.count} bookings
                      </Badge>
                    </div>
                    <div className="text-2xl font-bold text-green-600 mb-2">
                      {formatCurrency(service.totalRevenue)}
                    </div>
                    <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Avg. value: {formatCurrency(service.totalRevenue / service.count)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card className={`${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
            <CardHeader>
              <CardTitle className={isDarkMode ? 'text-white' : 'text-gray-900'}>Monthly Booking Trends</CardTitle>
              <CardDescription>Service bookings and revenue over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" orientation="left" />
                  <YAxis yAxisId="right" orientation="right" tickFormatter={(value) => `$${value}`} />
                  <Tooltip />
                  <Bar yAxisId="left" dataKey="bookings" fill="#8884d8" name="Bookings" />
                  <Bar yAxisId="right" dataKey="revenue" fill="#82ca9d" name="Revenue" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="top-services" className="space-y-4">
          <Card className={`${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
            <CardHeader>
              <CardTitle className={isDarkMode ? 'text-white' : 'text-gray-900'}>Top Performing Services</CardTitle>
              <CardDescription>Services with the highest booking counts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.topServices.map((service, index) => (
                  <div key={index} className={`flex items-center justify-between p-4 border rounded-lg ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <div className="flex items-center space-x-4">
                      <div className={`text-2xl font-bold ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        #{index + 1}
                      </div>
                      <div>
                        <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{service.title}</h3>
                        <div className={`flex items-center space-x-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          <Badge variant="outline">{service.category}</Badge>
                          <span className="flex items-center">
                            <Star className="h-3 w-3 text-yellow-500 mr-1" />
                            {service.rating}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {service.bookingCount} bookings
                      </div>
                      <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {service.price}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
