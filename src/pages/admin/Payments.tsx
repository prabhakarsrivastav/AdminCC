import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  CheckCircle,
  Clock,
  XCircle,
  DollarSign,
  Calendar,
  User,
  CreditCard,
  RefreshCw,
  Filter,
  Search,
  Download,
  TrendingUp,
  BarChart3,
  Receipt,
  AlertTriangle,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useDarkMode } from "@/contexts/DarkModeContext";

interface Payment {
  _id: string;
  stripePaymentIntentId: string;
  userEmail: string;
  serviceId: string | null;
  serviceTitle: string;
  amount: number;
  currency: string;
  status: string;
  paymentMethod: string;
  createdAt: string;
  updatedAt: string;
}

const Payments = () => {
  const { isDarkMode } = useDarkMode();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // New state variables for enhanced functionality
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [amountFilter, setAmountFilter] = useState("all");

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const response = await api.admin.payments.getAll();
      if (response.success) {
        const paymentsData = response.data || [];
        setPayments(Array.isArray(paymentsData) ? paymentsData : []);
      }
    } catch (error: any) {
      toast.error(error.message || "Error fetching payments");
      setPayments([]); // Set empty array on error
    }
    setLoading(false);
  };

  const updatePaymentStatus = async (paymentId: string, newStatus: string) => {
    try {
      const response = await api.admin.payments.updateStatus(paymentId, newStatus);
      if (response.success) {
        toast.success(`Payment status updated to ${newStatus}`);
        fetchPayments();
      }
    } catch (error: any) {
      toast.error(error.message || "Error updating payment status");
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'succeeded':
        return 'default'; // 'default' will be green if that's your theme's 'primary'
      case 'pending':
        return 'secondary';
      case 'failed':
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'succeeded':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-amber-500" />;
      case 'failed':
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const filteredPayments = useMemo(() => {
    return payments.filter(payment => {
      const fullName = (payment.userEmail || '').toLowerCase();
      const serviceTitle = (payment.serviceTitle || '').toLowerCase();
      const paymentId = (payment.stripePaymentIntentId || '').toLowerCase();
      const matchesSearch = fullName.includes(searchTerm.toLowerCase()) ||
                          serviceTitle.includes(searchTerm.toLowerCase()) ||
                          paymentId.includes(searchTerm.toLowerCase());

      const matchesStatus = filterStatus === "all" || (payment.status || '').toLowerCase() === filterStatus;

      // Date filter logic
      const paymentDate = new Date(payment.createdAt);
      const now = new Date();
      let matchesDate = true;

      if (dateFilter === "today") {
        matchesDate = paymentDate.toDateString() === now.toDateString();
      } else if (dateFilter === "week") {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        matchesDate = paymentDate >= weekAgo;
      } else if (dateFilter === "month") {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        matchesDate = paymentDate >= monthAgo;
      }

      // Amount filter logic
      const amount = payment.amount / 100;
      let matchesAmount = true;

      if (amountFilter === "under50") {
        matchesAmount = amount < 50;
      } else if (amountFilter === "50to100") {
        matchesAmount = amount >= 50 && amount <= 100;
      } else if (amountFilter === "over100") {
        matchesAmount = amount > 100;
      }

      return matchesSearch && matchesStatus && matchesDate && matchesAmount;
    });
  }, [payments, searchTerm, filterStatus, dateFilter, amountFilter]);

  // Enhanced statistics calculation
  const paymentStats = useMemo(() => {
    const total = payments.length;
    const completed = payments.filter(p => ['completed', 'succeeded'].includes(p.status.toLowerCase())).length;
    const pending = payments.filter(p => p.status.toLowerCase() === 'pending').length;
    const failed = payments.filter(p => ['failed', 'cancelled'].includes(p.status.toLowerCase())).length;
    const processing = payments.filter(p => p.status.toLowerCase() === 'processing').length;
    const totalAmount = payments
      .filter(p => ['completed', 'succeeded'].includes(p.status.toLowerCase()))
      .reduce((sum, p) => sum + p.amount, 0);
    const pendingAmount = payments
      .filter(p => p.status.toLowerCase() === 'pending')
      .reduce((sum, p) => sum + p.amount, 0);

    return {
      total,
      completed,
      pending,
      failed,
      processing,
      totalAmount,
      pendingAmount,
    };
  }, [payments]);

  // Export payments data
  const exportPaymentsData = () => {
    const csvContent = [
      ['Service Title', 'Service ID', 'Customer Email', 'Amount', 'Currency', 'Status', 'Payment Method', 'Payment ID', 'Date'],
      ...filteredPayments.map(payment => [
        payment.serviceTitle,
        payment.serviceId || 'N/A',
        payment.userEmail,
        (payment.amount / 100).toFixed(2),
        payment.currency.toUpperCase(),
        payment.status,
        payment.paymentMethod || 'Stripe',
        payment.stripePaymentIntentId,
        new Date(payment.createdAt).toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payments-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Payments data exported successfully");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading payments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Header Section */}
      <div className="bg-white dark:bg-black text-black dark:text-white border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-4xl font-bold mb-2 flex items-center gap-3 text-black dark:text-white">
                <CreditCard className="w-10 h-10" />
                Payment Management
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300">View and manage all payment transactions</p>
            </div>
            <Button
              onClick={fetchPayments}
              variant="outline"
              className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

      <div className="px-8 py-8">

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
            <Card className="bg-white dark:bg-black backdrop-blur-sm border-gray-200 dark:border-gray-700 text-black dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Payments</p>
                    <p className="text-2xl font-bold text-black dark:text-white">{paymentStats.total}</p>
                  </div>
                  <CreditCard className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-black backdrop-blur-sm border-gray-200 dark:border-gray-700 text-black dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completed</p>
                    <p className="text-2xl font-bold text-black dark:text-white">{paymentStats.completed}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-black backdrop-blur-sm border-gray-200 dark:border-gray-700 text-black dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending</p>
                    <p className="text-2xl font-bold text-black dark:text-white">{paymentStats.pending}</p>
                  </div>
                  <Clock className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-black backdrop-blur-sm border-gray-200 dark:border-gray-700 text-black dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Failed</p>
                    <p className="text-2xl font-bold text-black dark:text-white">{paymentStats.failed}</p>
                  </div>
                  <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-black backdrop-blur-sm border-gray-200 dark:border-gray-700 text-black dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Processing</p>
                    <p className="text-2xl font-bold text-black dark:text-white">{paymentStats.processing}</p>
                  </div>
                  <RefreshCw className="h-8 w-8 text-purple-600 dark:text-purple-400 animate-spin" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-black backdrop-blur-sm border-gray-200 dark:border-gray-700 text-black dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Revenue</p>
                    <p className="text-2xl font-bold text-black dark:text-white">${(paymentStats.totalAmount / 100).toFixed(2)}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

        {/* Search and Filter Section */}
        <Card className="bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 backdrop-blur-sm shadow-lg mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search payments by service, email, or payment ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full lg:w-40 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="succeeded">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                </SelectContent>
              </Select>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-full lg:w-40 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>
              <Select value={amountFilter} onValueChange={setAmountFilter}>
                <SelectTrigger className="w-full lg:w-40 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                  <DollarSign className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Amount" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Amounts</SelectItem>
                  <SelectItem value="under50">Under $50</SelectItem>
                  <SelectItem value="50to100">$50 - $100</SelectItem>
                  <SelectItem value="over100">Over $100</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={exportPaymentsData}
                variant="outline"
                className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Payments List */}
        <div className="grid gap-6">
          {filteredPayments.length > 0 ? (
            filteredPayments.map((payment) => (
              <Card key={payment._id} className="group relative overflow-hidden bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/70 backdrop-blur-sm shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:scale-[1.02]">
                {/* Background Gradient */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>

                <CardHeader className="relative bg-white dark:bg-gradient-to-br dark:from-gray-800/80 dark:to-gray-900/80 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-100 dark:bg-gray-700/50 rounded-lg">
                        {getStatusIcon(payment.status)}
                      </div>
                      <div>
                        <CardTitle className="text-xl font-bold text-black dark:text-white group-hover:text-blue-400 transition-colors duration-300">
                          {payment.serviceTitle}
                        </CardTitle>
                        <CardDescription className="text-gray-600 dark:text-gray-400">
                          Service ID: {payment.serviceId || 'N/A'}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge
                      variant={getStatusBadgeVariant(payment.status)}
                      className="px-3 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600"
                    >
                      {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 relative">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                      <User className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-500">Customer</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-300">{payment.userEmail}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                      <DollarSign className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-500">Amount</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-300">
                          ${(payment.amount / 100).toFixed(2)} {payment.currency.toUpperCase()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                      <CreditCard className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-500">Method</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-300 capitalize">
                          {payment.paymentMethod || 'Stripe'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                      <Calendar className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-500">Date</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-300">
                          {new Date(payment.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {payment.status.toLowerCase() === 'pending' && (
                    <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <Button
                        size="sm"
                        onClick={() => updatePaymentStatus(payment._id, 'succeeded')}
                        className="bg-green-600 hover:bg-green-700 text-white flex-1"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Mark Complete
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => updatePaymentStatus(payment._id, 'failed')}
                        className="flex-1"
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Mark Failed
                      </Button>
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-600">Payment ID: {payment.stripePaymentIntentId}</p>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="col-span-full border-2 border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <CardContent className="py-16 text-center">
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-blue-100 dark:bg-blue-950">
                    <CreditCard className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-200">
                    {filterStatus === "all" ? "No Payments Yet" : `No ${filterStatus} Payments`}
                  </h3>
                  <p className="mb-4 text-gray-600 dark:text-gray-500">
                    {filterStatus === "all"
                      ? "Payments will appear here once users start booking services."
                      : `No payments found with ${filterStatus} status.`}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Payments;
