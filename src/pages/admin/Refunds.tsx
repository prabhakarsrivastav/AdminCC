import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  CheckCircle,
  Clock,
  XCircle,
  DollarSign,
  Calendar,
  User,
  RefreshCw,
  Filter,
  MessageCircle,
  Loader2,
  Search,
  Download,
  Receipt,
  AlertTriangle,
  TrendingUp,
  CreditCard,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useDarkMode } from "@/contexts/DarkModeContext";

interface Refund {
  _id: string;
  paymentId: string;
  userEmail: string;
  serviceId: number;
  serviceTitle: string;
  amount: number;
  currency: string;
  status: string;
  reason: string;
  notes?: string;
  stripeRefundId?: string;
  createdAt: string;
  updatedAt: string;
}

const Refunds = () => {
  const { isDarkMode } = useDarkMode();
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedRefund, setSelectedRefund] = useState<Refund | null>(null);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // New state variables for enhanced functionality
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [amountFilter, setAmountFilter] = useState("all");

  useEffect(() => {
    fetchRefunds();
  }, []);

  const fetchRefunds = async () => {
    setLoading(true);
    try {
      const response = await api.admin.refunds.getAll();
      if (response.success) {
        // Backend returns response.data.refunds (nested)
        const refundsData = response.data?.refunds || response.data || [];
        setRefunds(Array.isArray(refundsData) ? refundsData : []);
      }
    } catch (error: any) {
      toast.error(error.message || "Error fetching refunds");
      setRefunds([]); // Set empty array on error
    }
    setLoading(false);
  };

  const updateRefundStatus = async (refundId: string, newStatus: string, notes?: string) => {
    try {
      setIsProcessing(true);
      const response = await api.admin.refunds.updateStatus(refundId, newStatus, notes);
      if (response.success) {
        const statusMessage = newStatus === 'approved' 
          ? 'Refund approved! Stripe refund has been initiated.'
          : newStatus === 'rejected'
          ? 'Refund request has been rejected.'
          : `Refund status updated to ${newStatus}`;
        toast.success(statusMessage);
        fetchRefunds();
      }
    } catch (error: any) {
      toast.error(error.message || "Error updating refund status");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApproveRefund = async (refund: Refund) => {
    if (window.confirm(`Are you sure you want to approve this refund for $${(refund.amount / 100).toFixed(2)}? This will initiate a Stripe refund.`)) {
      await updateRefundStatus(refund._id, 'approved');
    }
  };

  const handleRejectRefund = (refund: Refund) => {
    setSelectedRefund(refund);
    setRejectReason("");
    setIsRejectDialogOpen(true);
  };

  const submitRejection = async () => {
    if (!selectedRefund) return;
    
    if (!rejectReason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    await updateRefundStatus(selectedRefund._id, 'rejected', rejectReason.trim());
    setIsRejectDialogOpen(false);
    setSelectedRefund(null);
    setRejectReason("");
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
      case 'completed':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'rejected':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const filteredRefunds = useMemo(() => {
    return refunds.filter(refund => {
      const fullName = refund.userEmail.toLowerCase();
      const serviceTitle = refund.serviceTitle.toLowerCase();
      const reason = refund.reason.toLowerCase();
      const matchesSearch = fullName.includes(searchTerm.toLowerCase()) ||
                          serviceTitle.includes(searchTerm.toLowerCase()) ||
                          reason.includes(searchTerm.toLowerCase()) ||
                          refund.paymentId.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = filterStatus === "all" || refund.status.toLowerCase() === filterStatus;

      // Date filter logic
      const refundDate = new Date(refund.createdAt);
      const now = new Date();
      let matchesDate = true;

      if (dateFilter === "today") {
        matchesDate = refundDate.toDateString() === now.toDateString();
      } else if (dateFilter === "week") {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        matchesDate = refundDate >= weekAgo;
      } else if (dateFilter === "month") {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        matchesDate = refundDate >= monthAgo;
      }

      // Amount filter logic
      const amount = refund.amount / 100;
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
  }, [refunds, searchTerm, filterStatus, dateFilter, amountFilter]);

  // Enhanced statistics calculation
  const refundStats = useMemo(() => {
    const total = refunds.length;
    const approved = refunds.filter(r => r.status.toLowerCase() === 'approved' || r.status.toLowerCase() === 'completed').length;
    const pending = refunds.filter(r => r.status.toLowerCase() === 'pending').length;
    const rejected = refunds.filter(r => r.status.toLowerCase() === 'rejected').length;
    const processing = refunds.filter(r => r.status.toLowerCase() === 'processing').length;
    const totalAmount = refunds
      .filter(r => ['approved', 'completed', 'succeeded'].includes(r.status.toLowerCase()))
      .reduce((sum, r) => sum + r.amount, 0);
    const pendingAmount = refunds
      .filter(r => r.status.toLowerCase() === 'pending')
      .reduce((sum, r) => sum + r.amount, 0);

    return {
      total,
      approved,
      pending,
      rejected,
      processing,
      totalAmount,
      pendingAmount,
    };
  }, [refunds]);

  // Export refunds data
  const exportRefundsData = () => {
    const dataToExport = filteredRefunds.map(refund => ({
      serviceTitle: refund.serviceTitle,
      userEmail: refund.userEmail,
      amount: `$${(refund.amount / 100).toFixed(2)} ${refund.currency.toUpperCase()}`,
      status: refund.status,
      reason: refund.reason,
      notes: refund.notes || '',
      paymentId: refund.paymentId,
      stripeRefundId: refund.stripeRefundId || '',
      requestDate: new Date(refund.createdAt).toLocaleDateString(),
      updatedDate: new Date(refund.updatedAt).toLocaleDateString(),
    }));

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `refunds-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Refunds data exported successfully!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading refunds...</p>
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
                <Receipt className="w-10 h-10" />
                Refund Management
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300">Review and process refund requests from users</p>
            </div>
            <Button
              onClick={fetchRefunds}
              variant="outline"
              className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
            <Card className="bg-white dark:bg-black backdrop-blur-sm border-gray-200 dark:border-gray-700 text-black dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Refunds</p>
                    <p className="text-2xl font-bold text-black dark:text-white">{refundStats.total}</p>
                  </div>
                  <Receipt className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-black backdrop-blur-sm border-gray-200 dark:border-gray-700 text-black dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Approved</p>
                    <p className="text-2xl font-bold text-black dark:text-white">{refundStats.approved}</p>
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
                    <p className="text-2xl font-bold text-black dark:text-white">{refundStats.pending}</p>
                  </div>
                  <Clock className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-black backdrop-blur-sm border-gray-200 dark:border-gray-700 text-black dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Rejected</p>
                    <p className="text-2xl font-bold text-black dark:text-white">{refundStats.rejected}</p>
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
                    <p className="text-2xl font-bold text-black dark:text-white">{refundStats.processing}</p>
                  </div>
                  <Loader2 className="h-8 w-8 text-purple-600 dark:text-purple-400 animate-spin" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-black backdrop-blur-sm border-gray-200 dark:border-gray-700 text-black dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Refunded</p>
                    <p className="text-2xl font-bold text-black dark:text-white">${(refundStats.totalAmount / 100).toFixed(2)}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-red-600 dark:text-red-400" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Search and Filter Section */}
        <Card className="bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 backdrop-blur-sm shadow-lg mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search refunds by service, email, reason, or payment ID..."
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
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
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
                onClick={exportRefundsData}
                variant="outline"
                className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Refunds List */}
        <div className="grid gap-6">
          {filteredRefunds.map((refund) => (
            <Card key={refund._id} className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(refund.status)}
                    <div>
                      <CardTitle className="text-lg text-gray-900 dark:text-white">
                        {refund.serviceTitle}
                      </CardTitle>
                      <CardDescription className="text-gray-600 dark:text-gray-500">
                        Service ID: {refund.serviceId} | Payment ID: {refund.paymentId}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge
                    variant={getStatusBadgeVariant(refund.status)}
                    className="px-3 py-1 text-xs font-medium"
                  >
                    {refund.status.charAt(0).toUpperCase() + refund.status.slice(1)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-600 dark:text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-600">Customer</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-300">{refund.userEmail}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-gray-600 dark:text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-600">Amount</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-300">
                        ${(refund.amount / 100).toFixed(2)} {refund.currency.toUpperCase()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-600 dark:text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-600">Request Date</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-300">
                        {new Date(refund.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 text-gray-600 dark:text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-600">Reason</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-300 truncate" title={refund.reason}>
                        {refund.reason.length > 20 ? `${refund.reason.substring(0, 20)}...` : refund.reason}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Reason Details */}
                <div className="mt-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    <span className="font-medium">Reason:</span> {refund.reason}
                  </p>
                </div>

                {/* Action Buttons */}
                {refund.status.toLowerCase() === 'pending' && (
                  <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                    <Button
                      size="sm"
                      onClick={() => handleApproveRefund(refund)}
                      className="bg-green-600 hover:bg-green-700"
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve & Refund
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleRejectRefund(refund)}
                      className="bg-red-500 hover:bg-red-600"
                      disabled={isProcessing}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject Request
                    </Button>
                  </div>
                )}

                {/* Processing Status */}
                {refund.status.toLowerCase() === 'processing' && (
                  <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-2 text-sm text-blue-600">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Stripe refund is being processed...</span>
                    </div>
                  </div>
                )}

                {/* Succeeded Status */}
                {refund.status.toLowerCase() === 'succeeded' && (
                  <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span>Refund completed successfully via Stripe</span>
                    </div>
                  </div>
                )}

                {/* Status Notes */}
                {refund.notes && (
                  <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                    <p className="text-xs mb-1 text-gray-500 dark:text-gray-600">Admin Notes:</p>
                    <p className="text-sm p-2 rounded border-l-4 border-amber-200 text-gray-700 dark:text-gray-300 bg-amber-50 dark:bg-amber-950">
                      {refund.notes}
                    </p>
                  </div>
                )}

                <div className="mt-4 pt-4 border-t flex gap-4 text-xs border-gray-100 dark:border-gray-800 text-gray-500 dark:text-gray-600">
                  <span>Refund ID: {refund._id}</span>
                  {refund.stripeRefundId && <span>Stripe ID: {refund.stripeRefundId}</span>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredRefunds.length === 0 && (
          <Card className="col-span-full border-2 border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <CardContent className="py-16 text-center">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-blue-100 dark:bg-blue-950">
                  <MessageCircle className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-200">
                  {filterStatus === "all" ? "No Refund Requests" : `No ${filterStatus} Refunds`}
                </h3>
                <p className="mb-4 text-gray-600 dark:text-gray-500">
                  {filterStatus === "all"
                    ? "Refund requests from users will appear here for review."
                    : `No refund requests found with ${filterStatus} status.`
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Reject Refund Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent className={`sm:max-w-[500px] ${isDarkMode ? 'bg-gradient-to-br from-black via-gray-950 to-black border-gray-800/50 text-white' : 'bg-white'}`}>
          <DialogHeader>
            <DialogTitle className={isDarkMode ? 'text-white' : 'text-gray-900'}>Reject Refund Request</DialogTitle>
            <DialogDescription className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
              Please provide a reason for rejecting this refund request. This will be visible to the customer.
            </DialogDescription>
          </DialogHeader>
          {selectedRefund && (
            <div className="space-y-4 py-4">
              <div className={`rounded-lg p-4 space-y-2 border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{selectedRefund.serviceTitle}</p>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Customer: {selectedRefund.userEmail}
                </p>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Amount: ${(selectedRefund.amount / 100).toFixed(2)} {selectedRefund.currency.toUpperCase()}
                </p>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Customer's Reason: "{selectedRefund.reason}"
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reject-reason" className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                  Reason for Rejection *
                </Label>
                <Textarea
                  id="reject-reason"
                  placeholder="Explain why this refund request is being rejected..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={4}
                  className={`resize-none ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white placeholder:text-gray-500' : 'bg-white border-gray-300'}`}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRejectDialogOpen(false)}
              disabled={isProcessing}
              className={isDarkMode ? 'border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700'}
            >
              Cancel
            </Button>
            <Button 
              onClick={submitRejection} 
              disabled={isProcessing || !rejectReason.trim()}
              className="bg-red-600 hover:bg-red-700"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Rejecting...
                </>
              ) : (
                "Reject Refund"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Refunds;
