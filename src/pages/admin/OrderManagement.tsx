import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import {
  CheckCircle,
  Clock,
  XCircle,
  DollarSign,
  Calendar,
  User,
  Package,
  Wrench,
  RefreshCw,
  Filter,
  Search,
  Download,
  TrendingUp,
  BarChart3,
  AlertTriangle,
  FileText,
  ShoppingCart,
  Settings,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useDarkMode } from "@/contexts/DarkModeContext";

interface Order {
  _id: string;
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  itemType: string;
  itemId: string;
  price: number;
  quantity: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  itemDetails?: {
    title: string;
    category?: string;
    type?: string;
    consultant?: string;
  };
  serviceDetails?: {
    title: string;
    category: string;
    consultant: string;
    price: string;
  };
  productDetails?: {
    title: string;
    type: string;
    category: string;
    price: number;
  };
}

interface OrderStats {
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  completedOrders: number;
}

export default function OrderManagement() {
  const { isDarkMode } = useDarkMode();
  const [serviceOrders, setServiceOrders] = useState<Order[]>([]);
  const [productOrders, setProductOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("services");

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [itemTypeFilter, setItemTypeFilter] = useState<string>("all");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<string>("desc");

  // Bulk actions
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  const handleBulkStatusUpdate = async (newStatus: string) => {
    if (selectedOrders.length === 0) {
      toast.error("Please select orders to update");
      return;
    }

    setBulkActionLoading(true);
    try {
      const promises = selectedOrders.map(orderId =>
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/admin/purchases/${orderId}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
          body: JSON.stringify({ status: newStatus }),
        }).then(res => res.json())
      );

      const results = await Promise.all(promises);
      const successCount = results.filter(result => result.success).length;

      if (successCount === selectedOrders.length) {
        toast.success(`Successfully updated ${successCount} orders to ${newStatus}`);
      } else {
        toast.warning(`Updated ${successCount} out of ${selectedOrders.length} orders`);
      }

      setSelectedOrders([]);
      fetchOrders();
    } catch (error: any) {
      toast.error("Error updating orders");
    }
    setBulkActionLoading(false);
  };

  const exportOrders = () => {
    const orders = activeTab === 'services' ? filteredServiceOrders : filteredProductOrders;
    const csvContent = [
      ['Type', 'Customer Name', 'Email', 'Item', 'Category', 'Unit Price', 'Quantity', 'Total', 'Status', 'Order Date'],
      ...orders.map(order => {
        // Determine the display type
        let displayType = order.itemType;
        if (order.itemType === 'product' || order.itemType === 'webinar') {
          const productType = order.productDetails?.type || order.itemDetails?.type;
          displayType = productType || order.itemType;
        }
        
        return [
          displayType,
          `${order.userId?.firstName} ${order.userId?.lastName}`,
          order.userId?.email,
          order.itemDetails?.title || order.serviceDetails?.title || order.productDetails?.title,
          order.itemDetails?.category || order.serviceDetails?.category || order.productDetails?.category,
          (order.price / 100).toFixed(2), // Convert from cents to dollars
          order.quantity,
          ((order.price * order.quantity) / 100).toFixed(2), // Convert total from cents to dollars
          order.status,
          new Date(order.createdAt).toLocaleDateString()
        ];
      })
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeTab}-orders-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Orders exported successfully");
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const [serviceResponse, productResponse] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/admin/purchases/orders/services?limit=1000`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        }).then(res => res.json()),
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/admin/purchases/orders/products?limit=1000`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        }).then(res => res.json())
      ]);

      if (serviceResponse.success) {
        setServiceOrders(serviceResponse.data.orders || []);
      }
      if (productResponse.success) {
        setProductOrders(productResponse.data.orders || []);
      }

      toast.success("Orders loaded successfully");
    } catch (error: any) {
      toast.error(error.message || "Error fetching orders");
      setServiceOrders([]);
      setProductOrders([]);
    }
    setLoading(false);
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/admin/purchases/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Order status updated to ${newStatus}`);
        fetchOrders(); // Refresh data
      } else {
        toast.error(data.error || "Error updating order status");
      }
    } catch (error: any) {
      toast.error(error.message || "Error updating order status");
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'default';
      case 'confirmed':
        return 'secondary';
      case 'pending':
        return 'outline';
      case 'cancelled':
        return 'destructive';
      case 'refunded':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'confirmed':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-amber-500" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'refunded':
        return <RefreshCw className="h-4 w-4 text-purple-500" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const filterOrders = (orders: Order[]) => {
    let filtered = orders.filter(order => {
      const userName = `${order.userId?.firstName || ''} ${order.userId?.lastName || ''}`.toLowerCase();
      const userEmail = (order.userId?.email || '').toLowerCase();
      const itemTitle = (order.itemDetails?.title || order.serviceDetails?.title || order.productDetails?.title || '').toLowerCase();

      const matchesSearch = userName.includes(searchTerm.toLowerCase()) ||
                          userEmail.includes(searchTerm.toLowerCase()) ||
                          itemTitle.includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === "all" || order.status === statusFilter;

      // Date filter logic
      const orderDate = new Date(order.createdAt);
      const now = new Date();
      let matchesDate = true;

      if (dateFilter === "today") {
        matchesDate = orderDate.toDateString() === now.toDateString();
      } else if (dateFilter === "week") {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        matchesDate = orderDate >= weekAgo;
      } else if (dateFilter === "month") {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        matchesDate = orderDate >= monthAgo;
      }

      // Item type filter
      let displayType = order.itemType;
      if (order.itemType === 'product' || order.itemType === 'webinar') {
        const productType = order.productDetails?.type || order.itemDetails?.type;
        displayType = productType || order.itemType;
      }
      const matchesItemType = itemTypeFilter === "all" || displayType === itemTypeFilter;

      // Price filter (convert to dollars for comparison)
      const priceInDollars = order.price / 100;
      const matchesMinPrice = minPrice === "" || priceInDollars >= parseFloat(minPrice);
      const matchesMaxPrice = maxPrice === "" || priceInDollars <= parseFloat(maxPrice);

      return matchesSearch && matchesStatus && matchesDate && matchesItemType && matchesMinPrice && matchesMaxPrice;
    });

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'price':
          aValue = a.price;
          bValue = b.price;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'createdAt':
        default:
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });

    return filtered;
  };

  const filteredServiceOrders = useMemo(() => filterOrders(serviceOrders), [serviceOrders, searchTerm, statusFilter, dateFilter, itemTypeFilter, minPrice, maxPrice, sortBy, sortOrder]);
  const filteredProductOrders = useMemo(() => filterOrders(productOrders), [productOrders, searchTerm, statusFilter, dateFilter, itemTypeFilter, minPrice, maxPrice, sortBy, sortOrder]);

  const serviceColumns: ColumnDef<Order>[] = [
    {
      accessorKey: "itemType",
      header: "Type",
      cell: ({ row }) => {
        const itemType = row.getValue("itemType") as string;
        const order = row.original;
        
        // For products, show the specific type (ebook/course)
        let displayType = itemType;
        if (itemType === 'product' || itemType === 'webinar') {
          const productType = order.productDetails?.type || order.itemDetails?.type;
          displayType = productType || itemType;
        }
        
        return (
          <Badge variant="outline" className="capitalize">
            {displayType}
          </Badge>
        );
      },
    },
    {
      accessorKey: "userId",
      header: "Customer",
      cell: ({ row }) => {
        const user = row.original.userId;
        return (
          <div className="flex flex-col">
            <div className="font-medium">{user?.firstName} {user?.lastName}</div>
            <div className="text-sm text-muted-foreground">{user?.email}</div>
          </div>
        );
      },
    },
    {
      accessorKey: "serviceDetails",
      header: "Service",
      cell: ({ row }) => {
        const service = row.original.serviceDetails || row.original.itemDetails;
        return (
          <div className="flex flex-col">
            <div className="font-medium">{service?.title || 'Unknown Service'}</div>
            <div className="text-sm text-muted-foreground">{service?.category}</div>
          </div>
        );
      },
    },
    {
      accessorKey: "price",
      header: "Unit Price",
      cell: ({ row }) => {
        const price = row.getValue("price") as number;
        const displayPrice = price / 100; // Convert from cents to dollars
        return <div className="font-semibold">${displayPrice.toFixed(2)}</div>;
      },
    },
    {
      accessorKey: "quantity",
      header: "Quantity",
      cell: ({ row }) => <div>{row.getValue("quantity")}</div>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        const statusLower = status.toLowerCase();
        
        // Special styling for refunded status
        if (statusLower === 'refunded') {
          return (
            <div className="flex flex-col gap-1">
              <Badge 
                variant={getStatusBadgeVariant(status)} 
                className="flex items-center gap-1 w-fit bg-purple-500/10 text-purple-600 border-purple-500/50"
              >
                {getStatusIcon(status)}
                <span className="font-semibold">Refunded</span>
              </Badge>
              <span className="text-xs text-muted-foreground">Payment returned</span>
            </div>
          );
        }
        
        return (
          <Badge variant={getStatusBadgeVariant(status)} className="flex items-center gap-1 w-fit">
            {getStatusIcon(status)}
            <span className="capitalize">{status}</span>
          </Badge>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Order Date",
      cell: ({ row }) => <div className="text-sm">{new Date(row.getValue("createdAt")).toLocaleDateString()}</div>,
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const order = row.original;
        const isRefunded = order.status.toLowerCase() === 'refunded';
        
        return (
          <div className="flex items-center gap-2">
            <Select 
              onValueChange={(value) => updateOrderStatus(order._id, value)}
              disabled={isRefunded}
            >
              <SelectTrigger className={`w-32 ${isRefunded ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <SelectValue placeholder="Update Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
            {isRefunded && (
              <span className="text-xs text-purple-500 font-medium whitespace-nowrap">✓ Refunded</span>
            )}
          </div>
        );
      },
    },
  ];

  const productColumns: ColumnDef<Order>[] = [
    {
      accessorKey: "itemType",
      header: "Type",
      cell: ({ row }) => {
        const itemType = row.getValue("itemType") as string;
        const order = row.original;
        
        // For products, show the specific type (ebook/course)
        let displayType = itemType;
        if (itemType === 'product' || itemType === 'webinar') {
          const productType = order.productDetails?.type || order.itemDetails?.type;
          displayType = productType || itemType;
        }
        
        return (
          <Badge variant="outline" className="capitalize">
            {displayType}
          </Badge>
        );
      },
    },
    {
      accessorKey: "userId",
      header: "Customer",
      cell: ({ row }) => {
        const user = row.original.userId;
        return (
          <div className="flex flex-col">
            <div className="font-medium">{user?.firstName} {user?.lastName}</div>
            <div className="text-sm text-muted-foreground">{user?.email}</div>
          </div>
        );
      },
    },
    {
      accessorKey: "productDetails",
      header: "Product",
      cell: ({ row }) => {
        const product = row.original.productDetails || row.original.itemDetails;
        return (
          <div className="flex flex-col">
            <div className="font-medium">{product?.title || 'Unknown Product'}</div>
            <div className="text-sm text-muted-foreground">{product?.type} • {product?.category}</div>
          </div>
        );
      },
    },
    {
      accessorKey: "price",
      header: "Unit Price",
      cell: ({ row }) => {
        const price = row.getValue("price") as number;
        const displayPrice = price / 100; // Convert from cents to dollars
        return <div className="font-semibold">${displayPrice.toFixed(2)}</div>;
      },
    },
    {
      accessorKey: "quantity",
      header: "Quantity",
      cell: ({ row }) => <div>{row.getValue("quantity")}</div>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return (
          <Badge variant={getStatusBadgeVariant(status)} className="flex items-center gap-1 w-fit">
            {getStatusIcon(status)}
            {status}
          </Badge>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Order Date",
      cell: ({ row }) => <div className="text-sm">{new Date(row.getValue("createdAt")).toLocaleDateString()}</div>,
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const order = row.original;
        return (
          <Select onValueChange={(value) => updateOrderStatus(order._id, value)}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Update Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
            </SelectContent>
          </Select>
        );
      },
    },
  ];

  const getOrderStats = (orders: Order[]) => {
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + ((order.price * order.quantity) / 100), 0); // Convert from cents to dollars
    const pendingOrders = orders.filter(order => order.status === 'pending').length;
    const completedOrders = orders.filter(order => order.status === 'completed').length;

    return { totalOrders, totalRevenue, pendingOrders, completedOrders };
  };

  const serviceStats = getOrderStats(filteredServiceOrders);
  const productStats = getOrderStats(filteredProductOrders);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Order Management</h1>
          <p className="text-muted-foreground">
            Manage and track all service and product orders
          </p>
        </div>
        <Button onClick={fetchOrders} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
        <Button variant="outline" onClick={exportOrders}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Service Orders</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{serviceStats.totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              ${serviceStats.totalRevenue.toFixed(2)} total revenue
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Product Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{productStats.totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              ${productStats.totalRevenue.toFixed(2)} total revenue
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{serviceStats.pendingOrders + productStats.pendingOrders}</div>
            <p className="text-xs text-muted-foreground">
              Require attention
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Orders</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{serviceStats.completedOrders + productStats.completedOrders}</div>
            <p className="text-xs text-muted-foreground">
              Successfully fulfilled
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Sorting
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Customer name, email, or item..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Item Type Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Item Type</label>
              <Select value={itemTypeFilter} onValueChange={setItemTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="service">Service</SelectItem>
                  <SelectItem value="consultation">Consultation</SelectItem>
                  <SelectItem value="ebook">E-book</SelectItem>
                  <SelectItem value="course">Course</SelectItem>
                  <SelectItem value="webinar">Webinar</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Date Range</label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Price Range */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Min Price ($)</label>
              <Input
                type="number"
                placeholder="0"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                min="0"
                step="0.01"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Max Price ($)</label>
              <Input
                type="number"
                placeholder="No limit"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                min="0"
                step="0.01"
              />
            </div>

            {/* Sort Options */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Sort By</label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt">Order Date</SelectItem>
                  <SelectItem value="price">Price</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Sort Order</label>
              <Select value={sortOrder} onValueChange={setSortOrder}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Newest First</SelectItem>
                  <SelectItem value="asc">Oldest First</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Clear Filters Button */}
          <div className="flex justify-end mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
                setDateFilter("all");
                setItemTypeFilter("all");
                setMinPrice("");
                setMaxPrice("");
                setSortBy("createdAt");
                setSortOrder("desc");
              }}
            >
              Clear All Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedOrders.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{selectedOrders.length} orders selected</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedOrders([])}
                >
                  Clear Selection
                </Button>
                <Select onValueChange={handleBulkStatusUpdate} disabled={bulkActionLoading}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Bulk Update Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Set to Pending</SelectItem>
                    <SelectItem value="confirmed">Set to Confirmed</SelectItem>
                    <SelectItem value="completed">Set to Completed</SelectItem>
                    <SelectItem value="cancelled">Set to Cancelled</SelectItem>
                    <SelectItem value="refunded">Set to Refunded</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Orders Tables */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="services" className="flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            Service Orders ({filteredServiceOrders.length})
          </TabsTrigger>
          <TabsTrigger value="products" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Product Orders ({filteredProductOrders.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="services" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Service Orders</CardTitle>
              <CardDescription>
                Manage consultation and service bookings
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : filteredServiceOrders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No service orders found
                </div>
              ) : (
                <DataTable
                  columns={serviceColumns}
                  data={filteredServiceOrders}
                  pageSize={10}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Product Orders</CardTitle>
              <CardDescription>
                Manage ebook and course purchases
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : filteredProductOrders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No product orders found
                </div>
              ) : (
                <DataTable
                  columns={productColumns}
                  data={filteredProductOrders}
                  pageSize={10}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}