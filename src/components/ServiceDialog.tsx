import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { toast } from "sonner";
import { Service } from "@/pages/admin/ManageServices";
import { api } from "@/lib/api";
import { Plus, X } from "lucide-react";
import { useDarkMode } from "@/contexts/DarkModeContext";

interface ServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: Service | null;
}

const ServiceDialog = ({ open, onOpenChange, service }: ServiceDialogProps) => {
  const { isDarkMode } = useDarkMode();
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    description: "",
    aboutService: "",
    price: "",
    duration: "",
    rating: 0,
    reviews: 0,
    consultant: "",
    consultantTitle: "",
    icon: "Briefcase",
    status: "active" as "active" | "inactive",
  });
  const [features, setFeatures] = useState<string[]>([""]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (service) {
      setFormData({
        title: service.title,
        category: service.category,
        description: service.description,
        aboutService: service.aboutService,
        price: service.price,
        duration: service.duration,
        rating: service.rating,
        reviews: service.reviews,
        consultant: service.consultant,
        consultantTitle: service.consultantTitle,
        icon: service.icon || "Briefcase",
        status: service.status || "active",
      });
      setFeatures(service.features && service.features.length > 0 ? service.features : [""]);
    } else {
      setFormData({
        title: "",
        category: "",
        description: "",
        aboutService: "",
        price: "",
        duration: "",
        rating: 0,
        reviews: 0,
        consultant: "",
        consultantTitle: "",
        icon: "Briefcase",
        status: "active",
      });
      setFeatures([""]);
    }
  }, [service, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const featuresArray = features.filter(f => f.trim() !== "");
    const serviceData = {
      title: formData.title,
      category: formData.category,
      description: formData.description,
      aboutService: formData.aboutService,
      price: formData.price,
      duration: formData.duration,
      rating: formData.rating,
      reviews: formData.reviews,
      consultant: formData.consultant,
      consultantTitle: formData.consultantTitle,
      features: featuresArray,
      icon: formData.icon,
    };
    try {
      if (service) {
        const response = await api.admin.services.update(service._id, serviceData);
        if (response.success) {
          toast.success("Service updated successfully");
          onOpenChange(true);
        }
      } else {
        const response = await api.admin.services.create(serviceData);
        if (response.success) {
          toast.success("Service created successfully");
          onOpenChange(true);
        }
      }
    } catch (error: any) {
      toast.error(error.message || "Error saving service");
    }
    setLoading(false);
  };

  const addFeature = () => {
    setFeatures([...features, ""]);
  };

  const removeFeature = (index: number) => {
    if (features.length > 1) {
      const newFeatures = features.filter((_, i) => i !== index);
      setFeatures(newFeatures);
    }
  };

  const updateFeature = (index: number, value: string) => {
    const newFeatures = [...features];
    newFeatures[index] = value;
    setFeatures(newFeatures);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => onOpenChange(false)}>
      <DialogContent className={`max-w-3xl max-h-[90vh] overflow-y-auto ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className={`-m-6 mb-6 ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'} border-b px-6 py-6 rounded-t-lg`}>
          <DialogHeader>
            <DialogTitle className={`text-2xl ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {service ? "Edit Service" : "Add New Service"}
            </DialogTitle>
            <DialogDescription className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
              {service ? "Update the service information below" : "Fill in the details to create a new service"}
            </DialogDescription>
          </DialogHeader>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="category" className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Category</Label>
            <Input id="category" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} required placeholder="e.g., Settlement, Job Support" className={`${isDarkMode ? 'border-gray-600 bg-gray-800 text-white placeholder:text-gray-400 focus:border-blue-400 focus:ring-blue-400' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="title" className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Service Title</Label>
            <Input id="title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required placeholder="Enter service title" className={`${isDarkMode ? 'border-gray-600 bg-gray-800 text-white placeholder:text-gray-400 focus:border-blue-400 focus:ring-blue-400' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description" className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Short Description</Label>
            <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} required placeholder="Brief description of the service" rows={2} className={`${isDarkMode ? 'border-gray-600 bg-gray-800 text-white placeholder:text-gray-400 focus:border-blue-400 focus:ring-blue-400' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="aboutService" className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Detailed Description</Label>
            <Textarea id="aboutService" value={formData.aboutService} onChange={(e) => setFormData({ ...formData, aboutService: e.target.value })} required placeholder="Detailed information about the service" rows={4} className={`${isDarkMode ? 'border-gray-600 bg-gray-800 text-white placeholder:text-gray-400 focus:border-blue-400 focus:ring-blue-400' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`} />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Features</Label>
              <Button type="button" onClick={addFeature} size="sm" variant="outline" className={`${isDarkMode ? 'border-blue-400 text-blue-400 hover:bg-blue-900/20' : 'border-blue-500 text-blue-600 hover:bg-blue-50'}`}>
                <Plus className="h-4 w-4 mr-1" />Add Feature
              </Button>
            </div>
            <div className="space-y-2">
              {features.map((feature, index) => (
                <div key={index} className="flex gap-2">
                  <Input value={feature} onChange={(e) => updateFeature(index, e.target.value)} placeholder={`Feature ${index + 1}`} className={`${isDarkMode ? 'border-gray-600 bg-gray-800 text-white placeholder:text-gray-400 focus:border-blue-400 focus:ring-blue-400' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`} />
                  {features.length > 1 && (
                    <Button type="button" onClick={() => removeFeature(index)} size="icon" variant="outline" className={`${isDarkMode ? 'border-red-400 text-red-400 hover:bg-red-900/20 shrink-0' : 'border-red-300 text-red-600 hover:bg-red-50 shrink-0'}`}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price" className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Price</Label>
              <Input id="price" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} required placeholder="e.g., Free, $99" className={`${isDarkMode ? 'border-gray-600 bg-gray-800 text-white placeholder:text-gray-400 focus:border-blue-400 focus:ring-blue-400' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration" className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Duration</Label>
              <Input id="duration" value={formData.duration} onChange={(e) => setFormData({ ...formData, duration: e.target.value })} required placeholder="e.g., 1-2 weeks" className={`${isDarkMode ? 'border-gray-600 bg-gray-800 text-white placeholder:text-gray-400 focus:border-blue-400 focus:ring-blue-400' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="consultant" className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Consultant Name</Label>
              <Input id="consultant" value={formData.consultant} onChange={(e) => setFormData({ ...formData, consultant: e.target.value })} required placeholder="Enter consultant name" className={`${isDarkMode ? 'border-gray-600 bg-gray-800 text-white placeholder:text-gray-400 focus:border-blue-400 focus:ring-blue-400' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="consultantTitle" className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Consultant Title</Label>
              <Input id="consultantTitle" value={formData.consultantTitle} onChange={(e) => setFormData({ ...formData, consultantTitle: e.target.value })} required placeholder="e.g., Immigration Specialist" className={`${isDarkMode ? 'border-gray-600 bg-gray-800 text-white placeholder:text-gray-400 focus:border-blue-400 focus:ring-blue-400' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rating" className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Rating</Label>
              <Input id="rating" type="number" step="0.1" min="0" max="5" value={formData.rating} onChange={(e) => setFormData({ ...formData, rating: parseFloat(e.target.value) })} required className={`${isDarkMode ? 'border-gray-600 bg-gray-800 text-white focus:border-blue-400 focus:ring-blue-400' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reviews" className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Reviews Count</Label>
              <Input id="reviews" type="number" min="0" value={formData.reviews} onChange={(e) => setFormData({ ...formData, reviews: parseInt(e.target.value) })} required className={`${isDarkMode ? 'border-gray-600 bg-gray-800 text-white focus:border-blue-400 focus:ring-blue-400' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="icon" className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Icon</Label>
              <Input id="icon" value={formData.icon} onChange={(e) => setFormData({ ...formData, icon: e.target.value })} placeholder="Icon name" className={`${isDarkMode ? 'border-gray-600 bg-gray-800 text-white placeholder:text-gray-400 focus:border-blue-400 focus:ring-blue-400' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="status" className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Status</Label>
            <Select value={formData.status} onValueChange={(value: "active" | "inactive") => setFormData({ ...formData, status: value })}>
              <SelectTrigger className={`${isDarkMode ? 'border-gray-600 bg-gray-800 text-white focus:border-blue-400 focus:ring-blue-400' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`}>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className={`flex gap-3 justify-end pt-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading} className={`${isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-800' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}>Cancel</Button>
            <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">{loading ? "Saving..." : service ? "Update Service" : "Create Service"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ServiceDialog;
