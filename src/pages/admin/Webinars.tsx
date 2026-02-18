import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, Calendar, Users, Eye, X, Search, Filter, Download, Mail, BarChart3, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { useDarkMode } from "@/contexts/DarkModeContext";

interface Webinar {
  _id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  duration_minutes: number;
  speaker_name: string;
  speaker_title: string;
  speaker_image?: string;
  cover_image?: string;
  webinar_link?: string;
  status: string;
  price: number;
  is_free: boolean;
  registration_count: number;
}

export default function AdminWebinars() {
  const [webinars, setWebinars] = useState<Webinar[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWebinar, setSelectedWebinar] = useState<string | null>(null);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loadingRegistrations, setLoadingRegistrations] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const navigate = useNavigate();
  const { isDarkMode } = useDarkMode();

  useEffect(() => {
    fetchWebinars();
  }, []);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalWebinars = webinars.length;
    const totalRegistrations = webinars.reduce((sum, w) => sum + w.registration_count, 0);
    const upcomingWebinars = webinars.filter(w => w.status === 'upcoming').length;
    const completedWebinars = webinars.filter(w => w.status === 'completed').length;
    const totalRevenue = webinars.reduce((sum, w) => sum + (w.is_free ? 0 : w.price * w.registration_count), 0);

    return {
      totalWebinars,
      totalRegistrations,
      upcomingWebinars,
      completedWebinars,
      totalRevenue
    };
  }, [webinars]);

  // Filter webinars based on search and status
  const filteredWebinars = useMemo(() => {
    return webinars.filter(webinar => {
      const matchesSearch = webinar.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           webinar.speaker_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           webinar.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || webinar.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [webinars, searchTerm, statusFilter]);

  const fetchWebinars = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/webinars/admin/all`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setWebinars(response.data.data);
    } catch (error) {
      toast.error("Failed to fetch webinars");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this webinar?")) return;

    try {
      const token = localStorage.getItem("authToken");
      await axios.delete(
        `${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/webinars/admin/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Webinar deleted successfully");
      fetchWebinars();
    } catch (error) {
      toast.error("Failed to delete webinar");
    }
  };

  const viewRegistrations = async (id: string) => {
    setSelectedWebinar(id);
    setLoadingRegistrations(true);
    try {
      const token = localStorage.getItem("authToken");
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/webinars/admin/${id}/registrations`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRegistrations(response.data.data);
    } catch (error) {
      toast.error("Failed to fetch registrations");
    } finally {
      setLoadingRegistrations(false);
    }
  };

  const removeUserFromWebinar = async (webinarId: string, email: string) => {
    if (!confirm("Are you sure you want to remove this user from the webinar?")) return;

    try {
      const token = localStorage.getItem("authToken");
      await axios.delete(
        `${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/webinars/admin/${webinarId}/remove-user/${encodeURIComponent(email)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("User removed from webinar successfully");
      // Update the registrations list
      setRegistrations(registrations.filter(reg => reg.email !== email));
      // Update the webinar list to reflect the new registration count
      setWebinars(webinars.map(webinar => 
        webinar._id === webinarId 
          ? { ...webinar, registration_count: webinar.registration_count - 1 }
          : webinar
      ));
    } catch (error) {
      toast.error("Failed to remove user from webinar");
    }
  };

  const exportWebinarsData = () => {
    const dataStr = JSON.stringify(filteredWebinars, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `webinars-data-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    toast.success('Webinars data exported successfully');
  };

  const exportRegistrationsData = async (webinarId: string, webinarTitle: string) => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/webinars/admin/${webinarId}/registrations`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const dataStr = JSON.stringify(response.data.data, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${webinarTitle.replace(/\s+/g, '-').toLowerCase()}-registrations-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      toast.success('Registrations data exported successfully');
    } catch (error) {
      toast.error('Failed to export registrations data');
    }
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-black' : 'bg-white'}`}>
      {/* Header Section */}
      <div className={`${isDarkMode ? 'bg-black text-white border-b border-gray-800' : 'bg-white text-black border-b border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className={`text-4xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-black'}`}>Webinar Management</h1>
              <p className="text-gray-300 text-lg">Manage your webinars and track registrations</p>
            </div>
            <Button
              onClick={() => navigate("/admin/webinars/add")}
              className="bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create Webinar
            </Button>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <Card className={`${isDarkMode ? 'bg-black backdrop-blur-sm border-gray-700 text-white hover:bg-gray-800' : 'bg-white border-gray-200 text-black hover:bg-gray-50'} transition-all duration-300`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Webinars</p>
                    <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>{stats.totalWebinars}</p>
                  </div>
                  <BarChart3 className={`h-8 w-8 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                </div>
              </CardContent>
            </Card>

            <Card className={`${isDarkMode ? 'bg-black backdrop-blur-sm border-gray-700 text-white hover:bg-gray-800' : 'bg-white border-gray-200 text-black hover:bg-gray-50'} transition-all duration-300`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Registrations</p>
                    <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>{stats.totalRegistrations}</p>
                  </div>
                  <Users className={`h-8 w-8 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                </div>
              </CardContent>
            </Card>

            <Card className={`${isDarkMode ? 'bg-black backdrop-blur-sm border-gray-700 text-white hover:bg-gray-800' : 'bg-white border-gray-200 text-black hover:bg-gray-50'} transition-all duration-300`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm font-medium">Upcoming</p>
                    <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>{stats.upcomingWebinars}</p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-400" />
                </div>
              </CardContent>
            </Card>

            <Card className={`${isDarkMode ? 'bg-black backdrop-blur-sm border-gray-700 text-white hover:bg-gray-800' : 'bg-white border-gray-200 text-black hover:bg-gray-50'} transition-all duration-300`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} text-sm font-medium`}>Completed</p>
                    <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>{stats.completedWebinars}</p>
                  </div>
                  <CheckCircle className={`h-8 w-8 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                </div>
              </CardContent>
            </Card>

            <Card className={`${isDarkMode ? 'bg-black backdrop-blur-sm border-gray-700 text-white hover:bg-gray-800' : 'bg-white border-gray-200 text-black hover:bg-gray-50'} transition-all duration-300`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} text-sm font-medium`}>Total Revenue</p>
                    <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>${stats.totalRevenue.toFixed(2)}</p>
                  </div>
                  <AlertCircle className={`h-8 w-8 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Search and Filter Section */}
        <Card className={`${isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white/80 border-gray-200'} backdrop-blur-sm shadow-lg mb-6`}>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search webinars by title, speaker, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`pl-10 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className={`w-full md:w-48 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={exportWebinarsData}
                variant="outline"
                className={`${isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
              >
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Webinars List */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${isDarkMode ? 'border-blue-400' : 'border-blue-600'}`}></div>
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredWebinars.length === 0 ? (
              <Card className={`${isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white/80 border-gray-200'} backdrop-blur-sm`}>
                <CardContent className="p-12 text-center">
                  <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <h3 className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {searchTerm || statusFilter !== 'all' ? 'No webinars found' : 'No webinars yet'}
                  </h3>
                  <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
                    {searchTerm || statusFilter !== 'all' 
                      ? 'Try adjusting your search or filter criteria' 
                      : 'Create your first webinar to get started'
                    }
                  </p>
                  {(!searchTerm && statusFilter === 'all') && (
                    <Button onClick={() => navigate("/admin/webinars/add")} className="bg-blue-600 hover:bg-blue-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Create First Webinar
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              filteredWebinars.map((webinar) => (
                <Card key={webinar._id} className={`group relative overflow-hidden ${isDarkMode ? 'bg-gray-800/50 border-gray-700 hover:bg-gray-800/70' : 'bg-white/80 border-gray-200 hover:bg-white/90'} backdrop-blur-sm shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:scale-[1.02]`}>
                  {/* Background Gradient */}
                  <div className={`absolute top-0 right-0 w-32 h-32 ${isDarkMode ? 'bg-gradient-to-br from-blue-500/10 to-purple-500/10' : 'bg-gradient-to-br from-blue-400/20 to-purple-400/20'} rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700`}></div>
                  
                  <CardContent className="p-6 relative">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} group-hover:text-blue-600 transition-colors duration-300`}>
                            {webinar.title}
                          </h3>
                          <Badge className={`${
                            webinar.status === 'upcoming' ? 'bg-green-500 hover:bg-green-600' :
                            webinar.status === 'completed' ? 'bg-blue-500 hover:bg-blue-600' :
                            'bg-red-500 hover:bg-red-600'
                          } text-white shadow-sm`}>
                            {webinar.status}
                          </Badge>
                        </div>
                        <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-4 line-clamp-2`}>
                          {webinar.description}
                        </p>
                        
                        {/* Webinar Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                          <div className={`flex items-center gap-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            <Calendar className="h-4 w-4 text-blue-500" />
                            <span>{webinar.date} at {webinar.time}</span>
                          </div>
                          <div className={`flex items-center gap-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            <Users className="h-4 w-4 text-green-500" />
                            <span>{webinar.registration_count} registered</span>
                          </div>
                          <div className={`flex items-center gap-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            <Clock className="h-4 w-4 text-purple-500" />
                            <span>{webinar.duration_minutes} minutes</span>
                          </div>
                        </div>
                        
                        {/* Speaker Info */}
                        <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-3`}>
                          <span className="font-medium">Speaker:</span> {webinar.speaker_name} - {webinar.speaker_title}
                        </div>
                        
                        {/* Price Badge */}
                        <Badge className={`${
                          webinar.is_free 
                            ? 'bg-green-500 hover:bg-green-600' 
                            : 'bg-blue-500 hover:bg-blue-600'
                        } text-white shadow-sm`}>
                          {webinar.is_free ? 'Free' : `$${webinar.price}`}
                        </Badge>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => viewRegistrations(webinar._id)}
                          className={`border-green-500 text-green-500 hover:bg-green-500/10 ${isDarkMode ? 'hover:bg-green-500/20' : ''} transition-all duration-300`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => exportRegistrationsData(webinar._id, webinar.title)}
                          className={`border-purple-500 text-purple-500 hover:bg-purple-500/10 ${isDarkMode ? 'hover:bg-purple-500/20' : ''} transition-all duration-300`}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/admin/webinars/edit/${webinar._id}`)}
                          className={`border-blue-500 text-blue-500 hover:bg-blue-500/10 ${isDarkMode ? 'hover:bg-blue-500/20' : ''} transition-all duration-300`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(webinar._id)}
                          className={`border-red-500 text-red-500 hover:bg-red-500/10 ${isDarkMode ? 'hover:bg-red-500/20' : ''} transition-all duration-300`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>

      <Dialog open={!!selectedWebinar} onOpenChange={() => setSelectedWebinar(null)}>
        <DialogContent className={`${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} max-w-5xl max-h-[90vh] overflow-hidden`}>
          <DialogHeader className="pb-4">
            <div className="flex justify-between items-center">
              <div>
                <DialogTitle className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Webinar Registrations
                </DialogTitle>
                <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                  Manage registered participants
                </p>
              </div>
              {registrations.length > 0 && (
                <Button
                  onClick={() => {
                    const webinar = webinars.find(w => w._id === selectedWebinar);
                    if (webinar) exportRegistrationsData(selectedWebinar!, webinar.title);
                  }}
                  variant="outline"
                  size="sm"
                  className={`${isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              )}
            </div>
          </DialogHeader>
          
          {loadingRegistrations ? (
            <div className="flex justify-center items-center py-12">
              <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${isDarkMode ? 'border-blue-400' : 'border-blue-600'}`}></div>
            </div>
          ) : (
            <div className="overflow-y-auto max-h-[60vh]">
              {registrations.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    No registrations yet
                  </h3>
                  <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Participants will appear here once they register
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Registration Summary */}
                  <Card className={`${isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-blue-50/50 border-blue-200'} backdrop-blur-sm`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
                            <Users className={`h-5 w-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                          </div>
                          <div>
                            <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              Total Registrations
                            </p>
                            <p className={`text-2xl font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                              {registrations.length}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Last registration
                          </p>
                          <p className={`text-sm mt-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {new Date(Math.max(...registrations.map(r => new Date(r.registered_at).getTime()))).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Registrations List */}
                  <div className="grid gap-3">
                    {registrations.map((reg, idx) => (
                      <Card key={idx} className={`group relative overflow-hidden ${isDarkMode ? 'bg-gray-800/50 border-gray-700 hover:bg-gray-800/70' : 'bg-white/80 border-gray-200 hover:bg-white/90'} backdrop-blur-sm transition-all duration-300 hover:shadow-md`}>
                        <div className={`absolute top-0 left-0 w-1 h-full ${
                          idx % 3 === 0 ? 'bg-blue-500' : 
                          idx % 3 === 1 ? 'bg-green-500' : 'bg-purple-500'
                        }`}></div>
                        
                        <CardContent className="p-4 pl-6">
                          <div className="flex justify-between items-start">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 flex-1">
                              <div>
                                <span className={`text-xs font-medium uppercase tracking-wide ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                                  Name
                                </span>
                                <p className={`font-semibold mt-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                  {reg.name}
                                </p>
                              </div>
                              <div>
                                <span className={`text-xs font-medium uppercase tracking-wide ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                                  Email
                                </span>
                                <p className={`mt-1 break-all ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                  {reg.email}
                                </p>
                              </div>
                              {reg.phone && (
                                <div>
                                  <span className={`text-xs font-medium uppercase tracking-wide ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                                    Phone
                                  </span>
                                  <p className={`mt-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    {reg.phone}
                                  </p>
                                </div>
                              )}
                              {reg.company && (
                                <div>
                                  <span className={`text-xs font-medium uppercase tracking-wide ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                                    Company
                                  </span>
                                  <p className={`mt-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    {reg.company}
                                  </p>
                                </div>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-3 ml-4">
                              <div className="text-right">
                                <span className={`text-xs font-medium uppercase tracking-wide ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                                  Registered
                                </span>
                                <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                  {new Date(reg.registered_at).toLocaleDateString('en-CA', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                              </div>
                              
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removeUserFromWebinar(selectedWebinar!, reg.email)}
                                className="border-red-500 text-red-500 hover:bg-red-500/10 hover:border-red-600 transition-all duration-300"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
