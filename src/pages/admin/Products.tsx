import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Edit,
  Trash2,
  BookOpen,
  Upload,
  X,
  Image,
  Eye,
  Search,
  Filter,
  Download,
  BarChart3,
  Package,
  DollarSign,
  TrendingUp,
  ShoppingCart,
  Book,
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { useDarkMode } from "@/contexts/DarkModeContext";

interface Product {
  _id: string;
  title: string;
  description: string;
  price: number;
  type: "ebook" | "course";
  coverImage?: string;
  category: string;
  status: "active" | "inactive";
  salesCount: number;
}

export default function AdminProducts() {
  const { isDarkMode } = useDarkMode();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    type: "ebook" as "ebook" | "course",
    category: "",
    status: "active" as "active" | "inactive",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");

  // New state variables for enhanced functionality
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchProducts();
  }, []);

  // Statistics calculation
  const stats = useMemo(() => {
    const totalProducts = products.length;
    const activeProducts = products.filter(p => p.status === 'active').length;
    const inactiveProducts = products.filter(p => p.status === 'inactive').length;
    const totalSales = products.reduce((sum, p) => sum + p.salesCount, 0);
    const totalRevenue = products.reduce((sum, p) => sum + (p.price * p.salesCount), 0);
    const ebooks = products.filter(p => p.type === 'ebook').length;
    const courses = products.filter(p => p.type === 'course').length;

    return {
      totalProducts,
      activeProducts,
      inactiveProducts,
      totalSales,
      totalRevenue,
      ebooks,
      courses,
    };
  }, [products]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          product.category.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = typeFilter === 'all' || product.type === typeFilter;
      const matchesStatus = statusFilter === 'all' || product.status === statusFilter;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [products, searchTerm, typeFilter, statusFilter]);

  // Export products data
  const exportProductsData = () => {
    const dataToExport = filteredProducts.map(product => ({
      title: product.title,
      description: product.description,
      price: product.price,
      type: product.type,
      category: product.category,
      status: product.status,
      salesCount: product.salesCount,
      revenue: product.price * product.salesCount,
    }));

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `products-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Products data exported successfully!');
  };

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await axios.get(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:5000/api"
        }/products/admin/all`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setProducts(response.data.data || []);
    } catch (error) {
      toast.error("Failed to fetch products");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("authToken");
      const url = editingProduct
        ? `${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/products/admin/${
            editingProduct._id
          }`
        : `${
            import.meta.env.VITE_API_URL || "http://localhost:5000/api"
          }/products/admin`;

      const formDataToSend = new FormData();
      formDataToSend.append("title", formData.title);
      formDataToSend.append("description", formData.description);
      formDataToSend.append("price", formData.price);
      formDataToSend.append("type", formData.type);
      formDataToSend.append("category", formData.category);
      formDataToSend.append("status", formData.status);

      if (imageFile) {
        formDataToSend.append("image", imageFile);
      }

      await axios({
        method: editingProduct ? "PUT" : "POST",
        url,
        data: formDataToSend,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success(editingProduct ? "Product updated" : "Product created");
      setShowDialog(false);
      resetForm();
      fetchProducts();
    } catch (error) {
      toast.error("Failed to save product");
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      title: product.title,
      description: product.description,
      price: product.price.toString(),
      type: product.type,
      category: product.category,
      status: product.status,
    });
    setImagePreview(product.coverImage || "");
    setShowDialog(true);
  };

  const handlePreview = (product: Product) => {
    setPreviewProduct(product);
    setShowPreview(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    try {
      const token = localStorage.getItem("authToken");
      await axios.delete(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:5000/api"
        }/products/admin/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Product deleted");
      fetchProducts();
    } catch (error) {
      toast.error("Failed to delete product");
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      price: "",
      type: "ebook",
      category: "",
      status: "active",
    });
    setEditingProduct(null);
    setImageFile(null);
    setImagePreview("");
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be less than 5MB");
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading products...</p>
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
              <h1 className="text-4xl font-bold mb-2 text-black dark:text-white">Product Management</h1>
              <p className="text-lg text-gray-600 dark:text-gray-300">Manage your ebooks and courses</p>
            </div>
            <Button
              onClick={() => {
                resetForm();
                setShowDialog(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="bg-white dark:bg-black backdrop-blur-sm border-gray-200 dark:border-gray-700 text-black dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Total Products</p>
                    <p className="text-2xl font-bold text-black dark:text-white">{stats.totalProducts}</p>
                  </div>
                  <Package className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-black backdrop-blur-sm border-gray-200 dark:border-gray-700 text-black dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Total Sales</p>
                    <p className="text-2xl font-bold text-black dark:text-white">{stats.totalSales}</p>
                  </div>
                  <ShoppingCart className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-black backdrop-blur-sm border-gray-200 dark:border-gray-700 text-black dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Revenue</p>
                    <p className="text-2xl font-bold text-black dark:text-white">${stats.totalRevenue.toFixed(2)}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-black backdrop-blur-sm border-gray-200 dark:border-gray-700 text-black dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Active</p>
                    <p className="text-2xl font-bold text-black dark:text-white">{stats.activeProducts}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-600 dark:text-green-400" />
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
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search products by title, description, or category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full md:w-40 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                  <Book className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="ebook">E-books</SelectItem>
                  <SelectItem value="course">Courses</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-40 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={exportProductsData}
                variant="outline"
                className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Products List */}
        {filteredProducts.length === 0 ? (
          <Card className="bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 backdrop-blur-sm">
            <CardContent className="p-12 text-center">
              <BookOpen className="h-16 w-16 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
              <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-white">
                {searchTerm || typeFilter !== 'all' || statusFilter !== 'all' ? 'No products found' : 'No products yet'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {searchTerm || typeFilter !== 'all' || statusFilter !== 'all'
                  ? 'Try adjusting your search or filter criteria'
                  : 'Create your first product to get started'
                }
              </p>
              {(!searchTerm && typeFilter === 'all' && statusFilter === 'all') && (
                <Button
                  onClick={() => {
                    resetForm();
                    setShowDialog(true);
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Product
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {filteredProducts.map((product) => (
              <Card key={product._id} className="group relative overflow-hidden bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/70 backdrop-blur-sm shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:scale-[1.02]">
                {/* Background Gradient */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>

                <CardContent className="p-6 relative">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex gap-6 flex-1">
                      {/* Product Image */}
                      <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-xl overflow-hidden flex-shrink-0 shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                        {product.coverImage ? (
                          <img
                            src={product.coverImage}
                            alt={product.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Image className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                          </div>
                        )}
                      </div>

                      {/* Product Details */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-blue-400 transition-colors duration-300">
                            {product.title}
                          </h3>
                          <Badge className={`${product.type === "ebook" ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-blue-500/20 text-blue-400 border-blue-500/30"} border`}>
                            {product.type === "ebook" ? "📚 E-book" : "🎓 Course"}
                          </Badge>
                          <Badge className={`${product.status === "active" ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-gray-500/20 text-gray-400 border-gray-500/30"} border`}>
                            {product.status}
                          </Badge>
                        </div>

                        <p className="text-gray-700 dark:text-gray-300 mb-4 line-clamp-2 leading-relaxed">
                          {product.description}
                        </p>

                        {/* Product Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div className="bg-gray-100 dark:bg-gray-900/50 rounded-lg p-3">
                            <div className="text-2xl font-bold text-green-400">${product.price}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Price</div>
                          </div>
                          <div className="bg-gray-100 dark:bg-gray-900/50 rounded-lg p-3">
                            <div className="text-2xl font-bold text-blue-400">{product.salesCount}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Sales</div>
                          </div>
                          <div className="bg-gray-100 dark:bg-gray-900/50 rounded-lg p-3">
                            <div className="text-2xl font-bold text-purple-400">${(product.price * product.salesCount).toFixed(2)}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Revenue</div>
                          </div>
                          <div className="bg-gray-100 dark:bg-gray-900/50 rounded-lg p-3">
                            <div className="text-lg font-bold text-gray-900 dark:text-gray-300 capitalize">{product.category}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Category</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePreview(product)}
                        className="border-green-500/30 text-green-400 hover:bg-green-500/10 hover:border-green-500/50 transition-all duration-300"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(product)}
                        className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10 hover:border-blue-500/50 transition-all duration-300"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(product._id)}
                        className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50 transition-all duration-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl bg-gradient-to-br from-black via-gray-950 to-black border-gray-800/50 text-white max-h-[90vh] overflow-hidden">
          <DialogHeader className="pb-4 border-b border-gray-800/50">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <DialogTitle className="text-2xl text-white">{editingProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
                <p className="text-sm mt-1 text-gray-400">Fill in the details below to {editingProduct ? "update" : "create"} your product</p>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden h-full">
            <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-6 py-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-base font-semibold text-white">
                  <BookOpen className="w-4 h-4 text-blue-400" />
                  Product Title *
                </Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="h-11 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:ring-blue-500"
                  placeholder="Enter product title"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-base font-semibold text-white">
                  <BookOpen className="w-4 h-4 text-blue-400" />
                  Description *
                </Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="min-h-[100px] resize-none bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:ring-blue-500"
                  placeholder="Describe your product in detail"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-base font-semibold text-white">
                    <DollarSign className="w-4 h-4 text-green-400" />
                    Price ($) *
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="h-11 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:ring-blue-500"
                    placeholder="0.00"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-base font-semibold text-white">
                    <Package className="w-4 h-4 text-blue-400" />
                    Type *
                  </Label>
                  <Select value={formData.type} onValueChange={(v: any) => setFormData({ ...formData, type: v })}>
                    <SelectTrigger className="h-11 bg-gray-800 border-gray-700 text-white focus:ring-blue-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="ebook" className="text-white hover:bg-gray-700">📚 E-Book</SelectItem>
                      <SelectItem value="course" className="text-white hover:bg-gray-700">🎓 Course</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-base font-semibold text-white">
                    <BarChart3 className="w-4 h-4 text-purple-400" />
                    Category *
                  </Label>
                  <Input
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="h-11 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:ring-blue-500"
                    placeholder="e.g., Immigration, Career"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-base font-semibold text-white">
                    <TrendingUp className="w-4 h-4 text-green-400" />
                    Status *
                  </Label>
                  <Select value={formData.status} onValueChange={(v: any) => setFormData({ ...formData, status: v })}>
                    <SelectTrigger className="h-11 bg-gray-800 border-gray-700 text-white focus:ring-blue-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="active" className="text-white hover:bg-gray-700">✅ Active</SelectItem>
                      <SelectItem value="inactive" className="text-white hover:bg-gray-700">⏸️ Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-base font-semibold text-white">
                  <Upload className="w-4 h-4 text-blue-400" />
                  Product Image
                </Label>
                {imagePreview ? (
                  <div className="relative inline-block mt-2">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-32 h-32 object-cover rounded-lg border-2 border-gray-600 shadow-lg"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 shadow-md"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview("");
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <Label
                    htmlFor="file-upload"
                    className="mt-2 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-600 hover:border-blue-500 p-8 transition-colors bg-gray-800/50"
                  >
                    <Upload className="h-8 w-8 text-gray-500" />
                    <span className="text-sm font-medium text-blue-400">Click to upload image</span>
                    <p className="text-xs text-gray-400">PNG, JPG up to 5MB</p>
                  </Label>
                )}
                <Input
                  id="file-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-800 mt-auto">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDialog(false)}
                className="flex-1 h-11 border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
              >
                {editingProduct ? "💾 Update Product" : "✨ Create Product"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl bg-gradient-to-br from-black via-gray-950 to-black border-gray-800/50 text-white">
          <DialogHeader className="pb-4 border-b border-gray-800/50">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 flex items-center justify-center">
                <Eye className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <DialogTitle className="text-2xl text-white">Product Preview</DialogTitle>
                <p className="text-sm mt-1 text-gray-400">Review product details before publishing</p>
              </div>
            </div>
          </DialogHeader>

          {previewProduct && (
            <div className="space-y-6 py-4">
              <div className="flex gap-6">
                <div className="w-32 h-32 bg-gray-800 rounded-xl overflow-hidden flex-shrink-0 shadow-lg">
                  {previewProduct.coverImage ? (
                    <img
                      src={previewProduct.coverImage}
                      alt={previewProduct.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Image className="h-8 w-8 text-gray-500" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-2xl font-bold text-white">{previewProduct.title}</h3>
                    <Badge className={`${previewProduct.type === "ebook" ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-blue-500/20 text-blue-400 border-blue-500/30"} border`}>
                      {previewProduct.type === "ebook" ? "📚 E-book" : "🎓 Course"}
                    </Badge>
                    <Badge className={`${previewProduct.status === "active" ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-gray-500/20 text-gray-400 border-gray-500/30"} border`}>
                      {previewProduct.status}
                    </Badge>
                  </div>

                  <div className="text-3xl font-bold text-green-400 mb-3">${previewProduct.price}</div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-300">
                      <BarChart3 className="w-4 h-4 text-purple-400" />
                      <span>Category: {previewProduct.category}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      <ShoppingCart className="w-4 h-4 text-blue-400" />
                      <span>Sales: {previewProduct.salesCount}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-4">
                <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-400" />
                  Description
                </h4>
                <p className="text-gray-300 leading-relaxed">{previewProduct.description}</p>
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-800">
                <Button
                  onClick={() => setShowPreview(false)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Close Preview
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
