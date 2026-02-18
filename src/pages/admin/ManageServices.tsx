import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Pencil,
  Trash2,
  Star,
  Search,
  Filter,
  Download,
  BarChart3,
  DollarSign,
  TrendingUp,
  Users,
  Clock,
  Award,
} from "lucide-react";
import { toast } from "sonner";
import ServiceDialog from "@/components/ServiceDialog";
import { api } from "@/lib/api";
import { useDarkMode } from "@/contexts/DarkModeContext";

export interface Service {
  _id: string;
  title: string;
  category: string;
  description: string;
  aboutService: string;
  price: string;
  duration: string;
  rating: number;
  reviews: number;
  consultant: string;
  consultantTitle: string;
  features: string[];
  icon: string;
  status: 'active' | 'inactive';
}

const ManageServices = () => {
  const { isDarkMode } = useDarkMode();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  // New state variables for enhanced functionality
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchServices();
  }, []);

  // Statistics calculation
  const stats = useMemo(() => {
    const totalServices = services.length;
    const totalReviews = services.reduce((sum, service) => sum + service.reviews, 0);
    const averageRating = services.length > 0
      ? (services.reduce((sum, service) => sum + service.rating, 0) / services.length).toFixed(1)
      : "0.0";
    const categories = [...new Set(services.map(service => service.category))].length;

    return {
      totalServices,
      totalReviews,
      averageRating,
      categories,
    };
  }, [services]);

  // Filtered services
  const filteredServices = useMemo(() => {
    return services.filter(service => {
      const matchesSearch = service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          service.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          service.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          service.consultant.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory = categoryFilter === 'all' || service.category === categoryFilter;
      const matchesStatus = statusFilter === 'all' || service.status === statusFilter;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [services, searchTerm, categoryFilter, statusFilter]);

  // Get unique categories for filter
  const categories = useMemo(() => {
    return [...new Set(services.map(service => service.category))];
  }, [services]);

  // Export services data
  const exportServicesData = () => {
    const dataToExport = filteredServices.map(service => ({
      title: service.title,
      category: service.category,
      description: service.description,
      price: service.price,
      duration: service.duration,
      rating: service.rating,
      reviews: service.reviews,
      consultant: service.consultant,
      consultantTitle: service.consultantTitle,
      features: service.features,
    }));

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `services-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Services data exported successfully!');
  };

  const fetchServices = async () => {
    setLoading(true);
    try {
      const response = await api.admin.services.getAll();
      if (response.success) {
        setServices(response.data || []);
      }
    } catch (error: any) {
      toast.error(error.message || "Error fetching services");
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this service?")) return;

    try {
      const response = await api.admin.services.delete(id);
      if (response.success) {
        toast.success("Service deleted successfully");
        fetchServices();
      }
    } catch (error: any) {
      toast.error(error.message || "Error deleting service");
    }
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingService(null);
    setDialogOpen(true);
  };

  const handleDialogClose = (shouldRefresh: boolean) => {
    setDialogOpen(false);
    setEditingService(null);
    if (shouldRefresh) {
      fetchServices();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading services...</p>
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
              <h1 className="text-4xl font-bold mb-2 text-black dark:text-white">Service Management</h1>
              <p className="text-lg text-gray-600 dark:text-gray-300">Manage and organize your settlement services</p>
            </div>
            <Button
              onClick={handleAdd}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Service
            </Button>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className={`${isDarkMode ? 'bg-black backdrop-blur-sm border-gray-700 text-white hover:bg-gray-800' : 'bg-white border-gray-200 text-black hover:bg-gray-50'} transition-all duration-300`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Services</p>
                    <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>{stats.totalServices}</p>
                  </div>
                  <BarChart3 className={`h-8 w-8 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                </div>
              </CardContent>
            </Card>

            <Card className={`${isDarkMode ? 'bg-black backdrop-blur-sm border-gray-700 text-white hover:bg-gray-800' : 'bg-white border-gray-200 text-black hover:bg-gray-50'} transition-all duration-300`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Reviews</p>
                    <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>{stats.totalReviews}</p>
                  </div>
                  <Users className={`h-8 w-8 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                </div>
              </CardContent>
            </Card>

            <Card className={`${isDarkMode ? 'bg-black backdrop-blur-sm border-gray-700 text-white hover:bg-gray-800' : 'bg-white border-gray-200 text-black hover:bg-gray-50'} transition-all duration-300`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Avg Rating</p>
                    <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>{stats.averageRating} ⭐</p>
                  </div>
                  <Award className={`h-8 w-8 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`} />
                </div>
              </CardContent>
            </Card>

            <Card className={`${isDarkMode ? 'bg-black backdrop-blur-sm border-gray-700 text-white hover:bg-gray-800' : 'bg-white border-gray-200 text-black hover:bg-gray-50'} transition-all duration-300`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Categories</p>
                    <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>{stats.categories}</p>
                  </div>
                  <TrendingUp className={`h-8 w-8 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Search and Filter Section */}
        <Card className={`${isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'} backdrop-blur-sm shadow-lg mb-6`}>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="relative flex-1">
                <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                <Input
                  placeholder="Search services by title, description, category, or consultant..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`pl-10 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder:text-gray-500' : 'bg-white border-gray-300 text-black placeholder:text-gray-500'}`}
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className={`w-full md:w-48 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-black'}`}>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className={`w-full md:w-40 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-black'}`}>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={exportServicesData}
                variant="outline"
                className={`${isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
              >
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Services Grid */}
        {filteredServices.length === 0 ? (
          <Card className={`${isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'} backdrop-blur-sm`}>
            <CardContent className="p-12 text-center">
              <BarChart3 className={`h-16 w-16 mx-auto mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
              <h3 className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                {searchTerm || categoryFilter !== 'all' ? 'No services found' : 'No services yet'}
              </h3>
              <p className="text-gray-400 mb-4">
                {searchTerm || categoryFilter !== 'all' 
                  ? 'Try adjusting your search or filter criteria' 
                  : 'Create your first service to get started'
                }
              </p>
              {(!searchTerm && categoryFilter === 'all') && (
                <Button
                  onClick={handleAdd}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Service
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredServices.map((service) => (
              <Card key={service._id} className={`group relative overflow-hidden ${isDarkMode ? 'bg-gray-800/50 border-gray-700 hover:bg-gray-800/70' : 'bg-white border-gray-200 hover:bg-gray-50'} backdrop-blur-sm shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:scale-[1.02]`}>
                {/* Background Gradient */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>

                <CardHeader className={`relative ${isDarkMode ? 'bg-gradient-to-br from-gray-800/80 to-gray-900/80 border-b border-gray-700' : 'bg-gradient-to-br from-gray-100/80 to-gray-200/80 border-b border-gray-300'}`}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-black'} group-hover:text-blue-400 transition-colors duration-300`}>
                        {service.title}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-sm font-medium text-blue-400 bg-blue-500/20 border border-blue-500/30 px-3 py-1 rounded-full">
                          {service.category}
                        </span>
                        <Badge
                          variant={service.status === 'active' ? 'default' : 'secondary'}
                          className={`text-xs ${
                            service.status === 'active'
                              ? 'bg-green-500/20 text-green-400 border-green-500/30'
                              : 'bg-red-500/20 text-red-400 border-red-500/30'
                          }`}
                        >
                          {service.status}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Rating Section */}
                  <div className={`flex items-center gap-2 mt-4 ${isDarkMode ? 'bg-amber-950/50 border-amber-900/50' : 'bg-amber-50 border-amber-200'} border px-3 py-2 rounded-lg`}>
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    <span className={`font-bold ${isDarkMode ? 'text-amber-200' : 'text-amber-800'}`}>{service.rating}</span>
                    <span className={`text-sm ${isDarkMode ? 'text-amber-300' : 'text-amber-700'}`}>
                      ({service.reviews} reviews)
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="pt-4 relative">
                  <p className={`text-sm line-clamp-2 mb-4 leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {service.description}
                  </p>

                  {/* Price and Duration */}
                  <div className={`flex items-center justify-between mb-4 p-3 rounded-lg ${isDarkMode ? 'bg-gray-900/50' : 'bg-gray-100'}`}>
                    <div>
                      <p className={`text-xs mb-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Price</p>
                      <span className="text-xl font-bold text-green-400">
                        {service.price}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className={`text-xs mb-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Duration</p>
                      <span className={`text-sm font-semibold flex items-center gap-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        <Clock className="h-3 w-3" />
                        {service.duration}
                      </span>
                    </div>
                  </div>

                  {/* Consultant Info */}
                  <div className={`mb-4 p-3 rounded-lg ${isDarkMode ? 'bg-blue-950/20 border-blue-900/30' : 'bg-blue-50 border-blue-200'}`}>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-white">
                          {service.consultant.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className={`text-sm font-semibold ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>{service.consultant}</p>
                        <p className={`text-xs ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>{service.consultantTitle}</p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(service)}
                      className="flex-1 border-blue-500/30 text-blue-400 hover:bg-blue-500/10 hover:border-blue-500/50 transition-all duration-300"
                    >
                      <Pencil className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(service._id)}
                      className="flex-1 bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50 transition-all duration-300"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <ServiceDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        service={editingService}
      />
    </div>
  );
};

export default ManageServices;
