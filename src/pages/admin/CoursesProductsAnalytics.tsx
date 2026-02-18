import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Package, DollarSign, ShoppingBag, TrendingUp, Search, Filter, Download, RefreshCw, Sparkles, Eye, Calendar, Activity, BarChart3, Award } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from "recharts";
import { api } from "@/lib/api";
import { useDarkMode } from "@/contexts/DarkModeContext";
import { toast } from "sonner";

interface ProductAnalytics {
  totalRevenue: number;
  totalSales: number;
  averageOrderValue: number;
  activeProducts: number;
  topProducts: Array<{
    name: string;
    revenue: number;
    sales: number;
  }>;
  salesByCategory: Array<{
    category: string;
    count: number;
    revenue: number;
  }>;
  salesByType: Array<{
    type: string;
    count: number;
    revenue: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    revenue: number;
    sales: number;
  }>;
}

interface ProductSalesTableData {
  id: string;
  productName: string;
  category: string;
  type: string;
  price: number;
  sales: number;
  revenue: number;
}

interface AllProductsTableData {
  id: string;
  productName: string;
  category: string;
  type: string;
  price: number;
  sales: number;
  revenue: number;
  status: string;
  lastSaleDate: string | null;
}

export default function CoursesProductsAnalytics() {
  const { isDarkMode } = useDarkMode();
  const [analytics, setAnalytics] = useState<ProductAnalytics | null>(null);
  const [allProducts, setAllProducts] = useState<AllProductsTableData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchAnalytics = async () => {
    try {
      setIsRefreshing(true);
      const [analyticsResponse, productsTableResponse] = await Promise.all([
        api.admin.analytics.getProducts(),
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/admin/analytics/products/table`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        }).then(res => res.json())
      ]);
      
      setAnalytics(analyticsResponse);
      setLastUpdated(new Date());
      
      // Transform the products table data
      if (productsTableResponse.success && productsTableResponse.data) {
        const transformedProducts = productsTableResponse.data.map((product: any, index: number) => ({
          id: product._id || String(index),
          productName: product.productName || 'Unknown Product',
          category: product.category || 'Uncategorized',
          type: product.type || 'general',
          price: typeof product.price === 'string' ? parseFloat(product.price.replace('$', '')) : product.price || 0,
          sales: product.totalSales || 0,
          revenue: product.totalRevenue || 0,
          status: product.totalSales > 0 ? 'Active' : 'No Sales',
          lastSaleDate: product.lastSaleDate ? new Date(product.lastSaleDate).toLocaleDateString() : 'Never'
        }));
        setAllProducts(transformedProducts);
      }
      toast.success("Analytics loaded successfully");
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 60000);
    return () => clearInterval(interval);
  }, []);

  const columns: ColumnDef<ProductSalesTableData>[] = [
    {
      accessorKey: "productName",
      header: "Product Name",
      cell: ({ row }) => <div className="font-medium">{row.getValue("productName")}</div>,
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => <Badge variant="outline">{row.getValue("category")}</Badge>,
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => <Badge>{row.getValue("type")}</Badge>,
    },
    {
      accessorKey: "price",
      header: "Price",
      cell: ({ row }) => <div>${(row.getValue("price") as number).toFixed(2)}</div>,
    },
    {
      accessorKey: "sales",
      header: "Sales",
      cell: ({ row }) => <div>{row.getValue("sales")}</div>,
    },
    {
      accessorKey: "revenue",
      header: "Revenue",
      cell: ({ row }) => <div className="font-semibold">${(row.getValue("revenue") as number).toFixed(2)}</div>,
    },
  ];

  const allProductsColumns: ColumnDef<AllProductsTableData>[] = [
    {
      accessorKey: "productName",
      header: "Product Name",
      cell: ({ row }) => <div className="font-medium">{row.getValue("productName")}</div>,
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => {
        const type = row.getValue("type") as string;
        return (
          <Badge className={type === "course" ? "bg-teal-500" : "bg-purple-500"}>
            {type}
          </Badge>
        );
      },
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => <Badge variant="outline">{row.getValue("category")}</Badge>,
    },
    {
      accessorKey: "price",
      header: "Price",
      cell: ({ row }) => <div>${(row.getValue("price") as number).toFixed(2)}</div>,
    },
    {
      accessorKey: "sales",
      header: "Total Sales",
      cell: ({ row }) => {
        const sales = row.getValue("sales") as number;
        return (
          <div className={sales > 0 ? "text-green-600 font-semibold" : "text-gray-400"}>
            {sales}
          </div>
        );
      },
    },
    {
      accessorKey: "revenue",
      header: "Total Revenue",
      cell: ({ row }) => {
        const revenue = row.getValue("revenue") as number;
        return (
          <div className={revenue > 0 ? "font-semibold text-green-600" : "text-gray-400"}>
            ${revenue.toFixed(2)}
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return (
          <Badge variant={status === "Active" ? "default" : "secondary"}>
            {status}
          </Badge>
        );
      },
    },
    {
      accessorKey: "lastSaleDate",
      header: "Last Sale",
      cell: ({ row }) => {
        const date = row.getValue("lastSaleDate") as string;
        return <div className="text-sm">{date}</div>;
      },
    },
  ];

  const tableData = useMemo(() => {
    // Filter products that have sales (same data as allProducts but only with sales > 0)
    return allProducts.filter(product => product.sales > 0).map(product => ({
      id: product.id,
      productName: product.productName,
      category: product.category,
      type: product.type,
      price: product.price,
      sales: product.sales,
      revenue: product.revenue,
    }));
  }, [allProducts]);

  const filteredData = useMemo(() => {
    return tableData.filter((item) => {
      const matchesSearch = item.productName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = selectedType === "all" || item.type.toLowerCase() === selectedType.toLowerCase();
      const matchesCategory = selectedCategory === "all" || item.category.toLowerCase() === selectedCategory.toLowerCase();
      return matchesSearch && matchesType && matchesCategory;
    });
  }, [tableData, searchTerm, selectedType, selectedCategory]);

  const filteredAllProducts = useMemo(() => {
    return allProducts.filter((item) => {
      const matchesSearch = item.productName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = selectedType === "all" || item.type.toLowerCase() === selectedType.toLowerCase();
      const matchesCategory = selectedCategory === "all" || item.category.toLowerCase() === selectedCategory.toLowerCase();
      return matchesSearch && matchesType && matchesCategory;
    });
  }, [allProducts, searchTerm, selectedType, selectedCategory]);

  const COLORS = ["#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#14b8a6"];

  const exportData = () => {
    const dataStr = JSON.stringify(analytics, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `analytics-${new Date().toISOString()}.json`;
    link.click();
  };

  if (loading) {
    return (
      <div className={`p-6 min-h-screen ${isDarkMode ? 'bg-black' : 'bg-white'}`}>
        <div className={`text-center py-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-900'}`}>Loading courses & products analytics...</div>
        <div className={`mt-4 text-sm text-center ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>
          Fetching product data from the server...
        </div>
      </div>
    );
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
          body { overflow-x: hidden !important; }
          html { overflow-x: hidden !important; }
        `
      }} />
      <div className={`min-h-screen ${isDarkMode ? 'bg-black' : 'bg-white'} p-3 sm:p-4 md:p-6 lg:p-8 overflow-x-hidden`}>
        <div className="max-w-[1600px] mx-auto space-y-4 sm:space-y-6">
          {/* Modern Header with Dark Elegance */}
          <div className={`${isDarkMode ? 'bg-gradient-to-br from-black via-gray-900 to-black border border-gray-800/50 shadow-2xl shadow-purple-500/5' : 'bg-white/80 border-white/20'} backdrop-blur-xl rounded-2xl border p-3 sm:p-4 md:p-6 lg:p-8`}>
            <div className="flex flex-col space-y-4 lg:flex-row lg:justify-between lg:items-start lg:space-y-0">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 sm:gap-3 mb-2">
                  <div className="p-2 sm:p-3 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl shadow-lg shadow-purple-500/30 flex-shrink-0">
                    <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h1 className={`text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold truncate ${isDarkMode ? 'bg-gradient-to-r from-white via-purple-400 to-pink-400 bg-clip-text text-transparent' : 'bg-gradient-to-r from-gray-900 via-purple-800 to-pink-800 bg-clip-text text-transparent'}`}>
                      Courses & Products Analytics
                    </h1>
                    <p className={`text-xs sm:text-sm mt-1 flex flex-wrap items-center gap-1 sm:gap-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      <Calendar className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                      <span className="truncate">Last updated: {lastUpdated.toLocaleTimeString()}</span>
                      <Badge variant="outline" className={`text-xs flex-shrink-0 ${isDarkMode ? 'border-gray-700 text-gray-300' : ''}`}>
                        <Activity className="h-3 w-3 mr-1" />
                        <span className="hidden xs:inline">Live Data</span>
                        <span className="xs:hidden">Live</span>
                      </Badge>
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 sm:gap-3 lg:flex-nowrap lg:items-end">
                {/* Refresh Button */}
                <button
                  onClick={fetchAnalytics}
                  disabled={isRefreshing}
                  className={`flex-1 sm:flex-none px-2 sm:px-3 md:px-4 py-2 ${isDarkMode ? 'bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 border border-gray-700 shadow-lg shadow-gray-900/50' : 'bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 shadow-purple-200'} text-white rounded-lg transition-all flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm font-medium shadow-sm`}
                >
                  <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Refresh</span>
                </button>

                {/* Export Button */}
                <button
                  onClick={exportData}
                  className={`flex-1 sm:flex-none px-2 sm:px-3 md:px-4 py-2 ${isDarkMode ? 'bg-gradient-to-r from-purple-900/80 to-pink-900/80 hover:from-purple-800/80 hover:to-pink-800/80 border border-purple-800/50 shadow-lg shadow-purple-900/30' : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-green-200'} text-white rounded-lg transition-all flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm font-medium shadow-sm`}
                >
                  <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Export</span>
                </button>
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
                </div>
                <h3 className={`text-xs sm:text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Total Revenue</h3>
                <p className={`text-xl sm:text-2xl lg:text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  ${analytics?.totalRevenue.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Total Sales Card */}
            <div className={`group relative overflow-hidden ${isDarkMode ? 'bg-gradient-to-br from-black via-gray-950 to-black border border-purple-900/30 shadow-xl shadow-purple-500/5' : 'bg-gradient-to-br from-purple-50 to-violet-50 border-purple-100'} rounded-2xl p-4 sm:p-6 hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300 hover:-translate-y-1`}>
              <div className={`absolute top-0 right-0 w-32 h-32 ${isDarkMode ? 'bg-gradient-to-br from-purple-900/10 to-violet-900/10' : 'bg-gradient-to-br from-purple-400/20 to-violet-400/20'} rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500`}></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2 sm:p-3 ${isDarkMode ? 'bg-gradient-to-br from-purple-900/50 to-violet-900/50 border border-purple-800/50' : 'bg-gradient-to-br from-purple-500 to-violet-600'} rounded-xl shadow-lg shadow-purple-500/20`}>
                    <ShoppingBag className="h-4 w-4 sm:h-5 sm:w-5 text-purple-300" />
                  </div>
                </div>
                <h3 className={`text-xs sm:text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Total Sales</h3>
                <p className={`text-xl sm:text-2xl lg:text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {analytics?.totalSales}
                </p>
              </div>
            </div>

            {/* Avg Order Value Card */}
            <div className={`group relative overflow-hidden ${isDarkMode ? 'bg-gradient-to-br from-black via-gray-950 to-black border border-pink-900/30 shadow-xl shadow-pink-500/5' : 'bg-gradient-to-br from-pink-50 to-rose-50 border-pink-100'} rounded-2xl p-4 sm:p-6 hover:shadow-2xl hover:shadow-pink-500/10 transition-all duration-300 hover:-translate-y-1`}>
              <div className={`absolute top-0 right-0 w-32 h-32 ${isDarkMode ? 'bg-gradient-to-br from-pink-900/10 to-rose-900/10' : 'bg-gradient-to-br from-pink-400/20 to-rose-400/20'} rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500`}></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2 sm:p-3 ${isDarkMode ? 'bg-gradient-to-br from-pink-900/50 to-rose-900/50 border border-pink-800/50' : 'bg-gradient-to-br from-pink-500 to-rose-600'} rounded-xl shadow-lg shadow-pink-500/20`}>
                    <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-pink-300" />
                  </div>
                </div>
                <h3 className={`text-xs sm:text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Avg. Order Value</h3>
                <p className={`text-xl sm:text-2xl lg:text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  ${analytics?.averageOrderValue.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Active Products Card */}
            <div className={`group relative overflow-hidden ${isDarkMode ? 'bg-gradient-to-br from-black via-gray-950 to-black border border-amber-900/30 shadow-xl shadow-amber-500/5' : 'bg-gradient-to-br from-orange-50 to-amber-50 border-orange-100'} rounded-2xl p-4 sm:p-6 hover:shadow-2xl hover:shadow-amber-500/10 transition-all duration-300 hover:-translate-y-1`}>
              <div className={`absolute top-0 right-0 w-32 h-32 ${isDarkMode ? 'bg-gradient-to-br from-amber-900/10 to-orange-900/10' : 'bg-gradient-to-br from-orange-400/20 to-amber-400/20'} rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500`}></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2 sm:p-3 ${isDarkMode ? 'bg-gradient-to-br from-amber-900/50 to-orange-900/50 border border-amber-800/50' : 'bg-gradient-to-br from-orange-500 to-amber-600'} rounded-xl shadow-lg shadow-amber-500/20`}>
                    <Package className="h-4 w-4 sm:h-5 sm:w-5 text-amber-300" />
                  </div>
                </div>
                <h3 className={`text-xs sm:text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Active Products</h3>
                <p className={`text-xl sm:text-2xl lg:text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {analytics?.activeProducts}
                </p>
              </div>
            </div>
          </div>

          <div className={`${isDarkMode ? 'bg-gradient-to-br from-black via-gray-950 to-black border border-gray-800/50 shadow-2xl' : 'bg-white/80 border-gray-200'} backdrop-blur-sm rounded-2xl shadow-lg p-2 sm:p-4`}>
            <Tabs defaultValue="overview" className="space-y-4 sm:space-y-6">
              <TabsList className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 w-full gap-2 ${isDarkMode ? 'bg-gradient-to-br from-gray-950 to-black border border-gray-800/50' : 'bg-gray-100'} p-2 sm:p-3 rounded-xl h-auto`}>
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
                  value="allproducts" 
                  className={`transition-all duration-200 rounded-lg px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium flex items-center justify-center
                    ${isDarkMode 
                      ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/20' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-lg'
                    }`}
                >
                  <Package className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">All Products</span>
                  <span className="sm:hidden">All</span>
                </TabsTrigger>
                
                <TabsTrigger 
                  value="products" 
                  className={`transition-all duration-200 rounded-lg px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium flex items-center justify-center
                    ${isDarkMode 
                      ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-amber-500/20' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:shadow-lg'
                    }`}
                >
                  <Award className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Top Products</span>
                  <span className="sm:hidden">Top</span>
                </TabsTrigger>
                
                <TabsTrigger 
                  value="table" 
                  className={`transition-all duration-200 rounded-lg px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium flex items-center justify-center
                    ${isDarkMode 
                      ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-rose-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-rose-500/20' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-rose-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-lg'
                    }`}
                >
                  <ShoppingBag className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Sales Table</span>
                  <span className="sm:hidden">Sales</span>
                </TabsTrigger>
                
                <TabsTrigger 
                  value="categories" 
                  className={`transition-all duration-200 rounded-lg px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium flex items-center justify-center
                    ${isDarkMode 
                      ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-teal-500/20' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white data-[state=active]:shadow-lg'
                    }`}
                >
                  <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Categories</span>
                  <span className="sm:hidden">Cat</span>
                </TabsTrigger>
                
                <TabsTrigger 
                  value="types" 
                  className={`transition-all duration-200 rounded-lg px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium flex items-center justify-center
                    ${isDarkMode 
                      ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-indigo-500/20' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg'
                    }`}
                >
                  <Filter className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Types</span>
                  <span className="sm:hidden">Type</span>
                </TabsTrigger>
                
                <TabsTrigger 
                  value="trends" 
                  className={`transition-all duration-200 rounded-lg px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium flex items-center justify-center
                    ${isDarkMode 
                      ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-rose-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-pink-500/20' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-rose-500 data-[state=active]:text-white data-[state=active]:shadow-lg'
                    }`}
                >
                  <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Trends</span>
                  <span className="sm:hidden">Trend</span>
                </TabsTrigger>
              </TabsList>

          <TabsContent value="overview" className="space-y-4 sm:space-y-6">
            <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
              {/* Revenue by Category - Enhanced Pie Chart */}
              <Card className={`${isDarkMode ? 'bg-gradient-to-br from-black via-gray-950 to-black border-gray-800/50 shadow-xl' : 'bg-white border-gray-200 shadow-lg'} hover:shadow-2xl transition-shadow duration-300`}>
                <CardHeader className={`${isDarkMode ? 'border-b border-gray-800/50' : 'border-b border-gray-100'} pb-4`}>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 ${isDarkMode ? 'bg-gradient-to-br from-emerald-900/30 to-teal-900/30 border border-emerald-800/30' : 'bg-gradient-to-br from-emerald-100 to-teal-100'} rounded-lg`}>
                      <BarChart3 className={`h-5 w-5 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
                    </div>
                    <CardTitle className={`text-lg sm:text-xl ${isDarkMode ? 'bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent' : 'text-gray-900'}`}>
                      Revenue by Category
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <ResponsiveContainer width="100%" height={350}>
                    <PieChart>
                      <Pie
                        data={analytics?.salesByCategory.filter(cat => cat.revenue > 0)}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ category, percent }) => percent > 0.05 ? `${category} ${(percent * 100).toFixed(1)}%` : ''}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="revenue"
                        strokeWidth={2}
                        stroke={isDarkMode ? '#000' : '#fff'}
                      >
                        {analytics?.salesByCategory.filter(cat => cat.revenue > 0).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
                          border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
                          borderRadius: '8px',
                          color: isDarkMode ? '#f9fafb' : '#111827'
                        }}
                        formatter={(value: any) => `$${value.toFixed(2)}`}
                      />
                      <Legend 
                        verticalAlign="bottom" 
                        height={36}
                        iconType="circle"
                        wrapperStyle={{
                          paddingTop: '20px',
                          fontSize: '12px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  {/* Category Stats */}
                  <div className="mt-4 pt-4 border-t border-gray-800/30 grid grid-cols-2 gap-3">
                    <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
                      <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Total Categories</p>
                      <p className={`text-lg font-bold ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                        {analytics?.salesByCategory.filter(cat => cat.revenue > 0).length || 0}
                      </p>
                    </div>
                    <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
                      <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Avg Revenue</p>
                      <p className={`text-lg font-bold ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`}>
                        ${(analytics?.totalRevenue / (analytics?.salesByCategory.filter(cat => cat.revenue > 0).length || 1)).toFixed(0)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Sales by Type - Enhanced Bar Chart */}
              <Card className={`${isDarkMode ? 'bg-gradient-to-br from-black via-gray-950 to-black border-gray-800/50 shadow-xl' : 'bg-white border-gray-200 shadow-lg'} hover:shadow-2xl transition-shadow duration-300`}>
                <CardHeader className={`${isDarkMode ? 'border-b border-gray-800/50' : 'border-b border-gray-100'} pb-4`}>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 ${isDarkMode ? 'bg-gradient-to-br from-purple-900/30 to-pink-900/30 border border-purple-800/30' : 'bg-gradient-to-br from-purple-100 to-pink-100'} rounded-lg`}>
                      <Package className={`h-5 w-5 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                    </div>
                    <CardTitle className={`text-lg sm:text-xl ${isDarkMode ? 'bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent' : 'text-gray-900'}`}>
                      Sales by Type
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={analytics?.salesByType} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <defs>
                        <linearGradient id="colorCountGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.9}/>
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.6}/>
                        </linearGradient>
                        <linearGradient id="colorRevenueGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ec4899" stopOpacity={0.9}/>
                          <stop offset="95%" stopColor="#ec4899" stopOpacity={0.6}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#e5e7eb'} />
                      <XAxis 
                        dataKey="type" 
                        stroke={isDarkMode ? '#9ca3af' : '#6b7280'}
                        style={{ fontSize: '12px' }}
                      />
                      <YAxis 
                        stroke={isDarkMode ? '#9ca3af' : '#6b7280'}
                        style={{ fontSize: '12px' }}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
                          border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
                          borderRadius: '8px',
                          color: isDarkMode ? '#f9fafb' : '#111827'
                        }}
                        cursor={{ fill: isDarkMode ? 'rgba(75, 85, 99, 0.2)' : 'rgba(229, 231, 235, 0.5)' }}
                      />
                      <Legend 
                        wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }}
                        iconType="circle"
                      />
                      <Bar 
                        dataKey="count" 
                        fill="url(#colorCountGrad)" 
                        radius={[8, 8, 0, 0]}
                        name="Sales Count"
                      />
                      <Bar 
                        dataKey="revenue" 
                        fill="url(#colorRevenueGrad)" 
                        radius={[8, 8, 0, 0]}
                        name="Revenue ($)"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                  
                  {/* Type Stats */}
                  <div className="mt-4 pt-4 border-t border-gray-800/30 grid grid-cols-2 gap-3">
                    <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
                      <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Product Types</p>
                      <p className={`text-lg font-bold ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                        {analytics?.salesByType.length || 0}
                      </p>
                    </div>
                    <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
                      <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Best Seller</p>
                      <p className={`text-lg font-bold ${isDarkMode ? 'text-pink-400' : 'text-pink-600'} truncate`}>
                        {analytics?.salesByType.sort((a, b) => b.revenue - a.revenue)[0]?.type || 'N/A'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="allproducts" className="space-y-4">
            <Card className={`${isDarkMode ? 'bg-gradient-to-br from-black via-gray-950 to-black border-gray-800/50 shadow-lg' : 'bg-white border-gray-200'}`}>
              <CardContent className="p-6">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-xl font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                    All Products & Courses
                  </h3>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      {allProducts.filter(p => p.sales > 0).length} Active
                    </Badge>
                    <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                      {allProducts.filter(p => p.sales === 0).length} No Sales
                    </Badge>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="relative">
                    <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} />
                    <Input
                      placeholder="Search products..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className={`pl-10 ${isDarkMode ? "bg-gray-700 border-gray-600" : ""}`}
                    />
                  </div>
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger className={isDarkMode ? "bg-gray-700 border-gray-600" : ""}>
                      <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="course">Courses</SelectItem>
                      <SelectItem value="ebook">E-books</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className={isDarkMode ? "bg-gray-700 border-gray-600" : ""}>
                      <SelectValue placeholder="Filter by category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="employment">Employment</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                      <SelectItem value="immigration">Immigration</SelectItem>
                      <SelectItem value="healthcare">Healthcare</SelectItem>
                      <SelectItem value="housing">Housing</SelectItem>
                      <SelectItem value="documentation">Documentation</SelectItem>
                      <SelectItem value="education">Education</SelectItem>
                      <SelectItem value="culture">Culture</SelectItem>
                      <SelectItem value="legal">Legal</SelectItem>
                      <SelectItem value="transportation">Transportation</SelectItem>
                      <SelectItem value="general">General</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DataTable columns={allProductsColumns} data={filteredAllProducts} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products" className="space-y-4 sm:space-y-6">
            <Card className={`${isDarkMode ? 'bg-gradient-to-br from-black via-gray-950 to-black border-gray-800/50 shadow-xl' : 'bg-white border-gray-200 shadow-lg'} hover:shadow-2xl transition-shadow duration-300`}>
              <CardHeader className={`${isDarkMode ? 'border-b border-gray-800/50' : 'border-b border-gray-100'} pb-4`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 ${isDarkMode ? 'bg-gradient-to-br from-amber-900/30 to-orange-900/30 border border-amber-800/30' : 'bg-gradient-to-br from-amber-100 to-orange-100'} rounded-lg`}>
                      <Award className={`h-5 w-5 ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`} />
                    </div>
                    <div>
                      <CardTitle className={`text-lg sm:text-xl ${isDarkMode ? 'bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent' : 'text-gray-900'}`}>
                        Top Performing Products
                      </CardTitle>
                      <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Best sellers ranked by revenue
                      </p>
                    </div>
                  </div>
                  <Badge className={`${isDarkMode ? 'bg-amber-900/30 text-amber-400 border-amber-800/50' : 'bg-amber-100 text-amber-700 border-amber-200'}`}>
                    Top {analytics?.topProducts.length || 0}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-3 sm:space-y-4">
                  {analytics?.topProducts.map((product, index) => {
                    const rankColors = [
                      { bg: 'from-amber-500 to-yellow-500', text: 'text-amber-500', badge: 'bg-amber-500/10 text-amber-500 border-amber-500/30' },
                      { bg: 'from-gray-400 to-gray-500', text: 'text-gray-400', badge: 'bg-gray-500/10 text-gray-400 border-gray-500/30' },
                      { bg: 'from-orange-600 to-amber-700', text: 'text-orange-500', badge: 'bg-orange-500/10 text-orange-500 border-orange-500/30' },
                      { bg: 'from-purple-500 to-pink-500', text: 'text-purple-400', badge: 'bg-purple-500/10 text-purple-400 border-purple-500/30' },
                      { bg: 'from-emerald-500 to-teal-500', text: 'text-emerald-400', badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' }
                    ];
                    const colorScheme = rankColors[Math.min(index, rankColors.length - 1)];
                    const revenuePerSale = product.revenue / product.sales;
                    
                    return (
                      <div
                        key={index}
                        className={`group relative overflow-hidden flex items-center justify-between p-4 sm:p-5 rounded-xl ${
                          isDarkMode 
                            ? 'bg-gradient-to-br from-gray-900/50 to-gray-800/30 border border-gray-800/50 hover:border-gray-700/70' 
                            : 'bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-50'
                        } hover:shadow-lg transition-all duration-300 hover:-translate-y-1`}
                      >
                        {/* Rank Badge */}
                        <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                          <div className={`relative flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br ${colorScheme.bg} flex items-center justify-center text-white font-bold text-lg sm:text-xl shadow-lg`}>
                            {index + 1}
                            {index === 0 && (
                              <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center">
                                <span className="text-xs">👑</span>
                              </div>
                            )}
                          </div>
                          
                          {/* Product Info */}
                          <div className="flex-1 min-w-0">
                            <h4 className={`font-semibold text-sm sm:text-base truncate ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                              {product.name}
                            </h4>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              <Badge variant="outline" className={`text-xs ${colorScheme.badge}`}>
                                {product.sales} sales
                              </Badge>
                              <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>•</span>
                              <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                ${revenuePerSale.toFixed(2)} avg
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Revenue */}
                        <div className="text-right flex-shrink-0 ml-3">
                          <p className={`text-xl sm:text-2xl font-bold bg-gradient-to-r ${colorScheme.bg} bg-clip-text text-transparent`}>
                            ${product.revenue.toFixed(2)}
                          </p>
                          <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-600'} mt-1`}>
                            {((product.revenue / (analytics?.totalRevenue || 1)) * 100).toFixed(1)}% of total
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Summary Stats */}
                <div className={`mt-6 pt-6 ${isDarkMode ? 'border-t border-gray-800/50' : 'border-t border-gray-200'} grid grid-cols-1 sm:grid-cols-3 gap-4`}>
                  <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gradient-to-br from-emerald-900/20 to-teal-900/20 border border-emerald-800/30' : 'bg-gradient-to-br from-emerald-50 to-teal-50'}`}>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Top Product Revenue</p>
                    <p className={`text-lg sm:text-xl font-bold ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                      ${analytics?.topProducts[0]?.revenue.toFixed(2) || '0.00'}
                    </p>
                  </div>
                  <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gradient-to-br from-purple-900/20 to-pink-900/20 border border-purple-800/30' : 'bg-gradient-to-br from-purple-50 to-pink-50'}`}>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Avg Top 5 Revenue</p>
                    <p className={`text-lg sm:text-xl font-bold ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                      ${((analytics?.topProducts.reduce((sum, p) => sum + p.revenue, 0) || 0) / (analytics?.topProducts.length || 1)).toFixed(2)}
                    </p>
                  </div>
                  <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gradient-to-br from-amber-900/20 to-orange-900/20 border border-amber-800/30' : 'bg-gradient-to-br from-amber-50 to-orange-50'}`}>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Top Products Share</p>
                    <p className={`text-lg sm:text-xl font-bold ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`}>
                      {(((analytics?.topProducts.reduce((sum, p) => sum + p.revenue, 0) || 0) / (analytics?.totalRevenue || 1)) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="table" className="space-y-4">
            <Card className={`${isDarkMode ? 'bg-gradient-to-br from-black via-gray-950 to-black border-gray-800/50 shadow-lg' : 'bg-white border-gray-200'}`}>
              <CardContent className="p-6">
              <div className="mb-6">
                <h3 className={`text-xl font-semibold mb-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}>Detailed Sales Data</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="relative">
                    <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} />
                    <Input
                      placeholder="Search products..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className={`pl-10 ${isDarkMode ? "bg-gray-700 border-gray-600" : ""}`}
                    />
                  </div>
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger className={isDarkMode ? "bg-gray-700 border-gray-600" : ""}>
                      <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="course">Courses</SelectItem>
                      <SelectItem value="ebook">E-books</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className={isDarkMode ? "bg-gray-700 border-gray-600" : ""}>
                      <SelectValue placeholder="Filter by category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="employment">Employment</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                      <SelectItem value="immigration">Immigration</SelectItem>
                      <SelectItem value="healthcare">Healthcare</SelectItem>
                      <SelectItem value="housing">Housing</SelectItem>
                      <SelectItem value="documentation">Documentation</SelectItem>
                      <SelectItem value="education">Education</SelectItem>
                      <SelectItem value="culture">Culture</SelectItem>
                      <SelectItem value="legal">Legal</SelectItem>
                      <SelectItem value="transportation">Transportation</SelectItem>
                      <SelectItem value="general">General</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DataTable columns={columns} data={filteredData} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="categories" className="space-y-4">
            <Card className={`${isDarkMode ? 'bg-gradient-to-br from-black via-gray-950 to-black border-gray-800/50 shadow-lg' : 'bg-white border-gray-200'}`}>
              <CardHeader>
                <CardTitle className={`${isDarkMode ? "text-white" : "text-gray-900"}`}>Category Performance</CardTitle>
              </CardHeader>
              <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {analytics?.salesByCategory.map((category, index) => (
                  <div
                    key={index}
                    className={`p-6 rounded-xl ${isDarkMode ? "bg-gray-700" : "bg-gradient-to-br from-purple-100 to-pink-100"} hover:shadow-lg transition-all hover:scale-105`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <Package className="w-8 h-8 text-purple-600" />
                      <Badge variant="outline">{category.count} items</Badge>
                    </div>
                    <h4 className={`text-lg font-semibold mb-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}>{category.category}</h4>
                    <p className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      ${category.revenue.toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="types" className="space-y-4">
            <Card className={`${isDarkMode ? 'bg-gradient-to-br from-black via-gray-950 to-black border-gray-800/50 shadow-lg' : 'bg-white border-gray-200'}`}>
              <CardHeader>
                <CardTitle className={`${isDarkMode ? "text-white" : "text-gray-900"}`}>Product Types Distribution</CardTitle>
              </CardHeader>
              <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={analytics?.salesByType} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    </linearGradient>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="url(#colorCount)" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="revenue" fill="url(#colorRevenue)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trends" className="space-y-4 sm:space-y-6">
            <Card className={`${isDarkMode ? 'bg-gradient-to-br from-black via-gray-950 to-black border-gray-800/50 shadow-xl' : 'bg-white border-gray-200 shadow-lg'} hover:shadow-2xl transition-shadow duration-300`}>
              <CardHeader className={`${isDarkMode ? 'border-b border-gray-800/50' : 'border-b border-gray-100'} pb-4`}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 ${isDarkMode ? 'bg-gradient-to-br from-pink-900/30 to-rose-900/30 border border-pink-800/30' : 'bg-gradient-to-br from-pink-100 to-rose-100'} rounded-lg`}>
                      <TrendingUp className={`h-5 w-5 ${isDarkMode ? 'text-pink-400' : 'text-pink-600'}`} />
                    </div>
                    <div>
                      <CardTitle className={`text-lg sm:text-xl ${isDarkMode ? 'bg-gradient-to-r from-pink-400 to-rose-400 bg-clip-text text-transparent' : 'text-gray-900'}`}>
                        Monthly Performance Trends
                      </CardTitle>
                      <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Revenue and sales over time
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Badge className={`${isDarkMode ? 'bg-purple-900/30 text-purple-400 border-purple-800/50' : 'bg-purple-100 text-purple-700 border-purple-200'}`}>
                      Revenue
                    </Badge>
                    <Badge className={`${isDarkMode ? 'bg-pink-900/30 text-pink-400 border-pink-800/50' : 'bg-pink-100 text-pink-700 border-pink-200'}`}>
                      Sales
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <ResponsiveContainer width="100%" height={450}>
                  <AreaChart data={analytics?.monthlyTrends} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                    <defs>
                      <linearGradient id="colorRevenueTrendEnhanced" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.9}/>
                        <stop offset="50%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.05}/>
                      </linearGradient>
                      <linearGradient id="colorSalesTrendEnhanced" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ec4899" stopOpacity={0.9}/>
                        <stop offset="50%" stopColor="#ec4899" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#ec4899" stopOpacity={0.05}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#e5e7eb'} />
                    <XAxis 
                      dataKey="month" 
                      stroke={isDarkMode ? '#9ca3af' : '#6b7280'}
                      style={{ fontSize: '12px' }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis 
                      stroke={isDarkMode ? '#9ca3af' : '#6b7280'}
                      style={{ fontSize: '12px' }}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
                        border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
                        borderRadius: '12px',
                        color: isDarkMode ? '#f9fafb' : '#111827',
                        padding: '12px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                      formatter={(value: any, name: string) => [
                        name === 'revenue' ? `$${value.toFixed(2)}` : value,
                        name === 'revenue' ? 'Revenue' : 'Sales Count'
                      ]}
                    />
                    <Legend 
                      wrapperStyle={{ paddingTop: '20px', fontSize: '13px', fontWeight: '500' }}
                      iconType="circle"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#8b5cf6" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorRevenueTrendEnhanced)"
                      name="Revenue ($)"
                      dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, strokeWidth: 2 }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="sales" 
                      stroke="#ec4899" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorSalesTrendEnhanced)"
                      name="Sales Count"
                      dot={{ fill: '#ec4899', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
                
                {/* Trend Analysis */}
                <div className={`mt-6 pt-6 ${isDarkMode ? 'border-t border-gray-800/50' : 'border-t border-gray-200'} grid grid-cols-1 sm:grid-cols-4 gap-3 sm:gap-4`}>
                  <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gradient-to-br from-emerald-900/20 to-teal-900/20 border border-emerald-800/30' : 'bg-gradient-to-br from-emerald-50 to-teal-50'}`}>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Peak Month</p>
                    <p className={`text-sm sm:text-base font-bold ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'} truncate`}>
                      {analytics?.monthlyTrends.sort((a, b) => b.revenue - a.revenue)[0]?.month || 'N/A'}
                    </p>
                  </div>
                  <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gradient-to-br from-purple-900/20 to-pink-900/20 border border-purple-800/30' : 'bg-gradient-to-br from-purple-50 to-pink-50'}`}>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Avg Monthly Revenue</p>
                    <p className={`text-sm sm:text-base font-bold ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                      ${((analytics?.monthlyTrends.reduce((sum, m) => sum + m.revenue, 0) || 0) / (analytics?.monthlyTrends.length || 1)).toFixed(0)}
                    </p>
                  </div>
                  <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gradient-to-br from-pink-900/20 to-rose-900/20 border border-pink-800/30' : 'bg-gradient-to-br from-pink-50 to-rose-50'}`}>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Avg Monthly Sales</p>
                    <p className={`text-sm sm:text-base font-bold ${isDarkMode ? 'text-pink-400' : 'text-pink-600'}`}>
                      {Math.round((analytics?.monthlyTrends.reduce((sum, m) => sum + m.sales, 0) || 0) / (analytics?.monthlyTrends.length || 1))}
                    </p>
                  </div>
                  <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gradient-to-br from-amber-900/20 to-orange-900/20 border border-amber-800/30' : 'bg-gradient-to-br from-amber-50 to-orange-50'}`}>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Growth Trend</p>
                    <p className={`text-sm sm:text-base font-bold ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`}>
                      {analytics?.monthlyTrends.length && analytics.monthlyTrends.length > 1 
                        ? `${((analytics.monthlyTrends[analytics.monthlyTrends.length - 1].revenue / analytics.monthlyTrends[0].revenue - 1) * 100).toFixed(1)}%`
                        : 'N/A'
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </>
  );
}
