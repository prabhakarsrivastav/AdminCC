import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Mail, Calendar, User, Phone, MessageSquare, Send, Link2, Clock, Search, Filter, Download, BarChart3, CheckCircle, AlertCircle, Users, CalendarDays, TrendingUp } from 'lucide-react';
import { useDarkMode } from '@/contexts/DarkModeContext';

interface Consultation {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  consultationType: string;
  preferredDate: string;
  message?: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  scheduledDate?: string;
  notes?: string;
  createdAt: string;
}

export default function Consultations() {
  const { isDarkMode } = useDarkMode();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [replyForm, setReplyForm] = useState({
    meetingLink: '',
    scheduledDate: '',
    message: ''
  });
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchConsultations();
  }, []);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalConsultations = consultations.length;
    const pendingConsultations = consultations.filter(c => c.status === 'pending').length;
    const confirmedConsultations = consultations.filter(c => c.status === 'confirmed').length;
    const completedConsultations = consultations.filter(c => c.status === 'completed').length;
    const cancelledConsultations = consultations.filter(c => c.status === 'cancelled').length;

    return {
      totalConsultations,
      pendingConsultations,
      confirmedConsultations,
      completedConsultations,
      cancelledConsultations
    };
  }, [consultations]);

  // Filter consultations based on search and status
  const filteredConsultations = useMemo(() => {
    return consultations.filter(consultation => {
      const matchesSearch = (consultation.name && consultation.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                           (consultation.email && consultation.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
                           (consultation.consultationType && consultation.consultationType.toLowerCase().includes(searchTerm.toLowerCase())) ||
                           (consultation.message && consultation.message.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus = statusFilter === 'all' || consultation.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [consultations, searchTerm, statusFilter]);

  const fetchConsultations = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${API_URL}/consultations/admin/all`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch consultations');

      const data = await response.json();
      setConsultations(data.data);
    } catch (error) {
      toast.error('Failed to load consultations');
    } finally {
      setLoading(false);
    }
  };

  const handleSendReply = async () => {
    if (!selectedConsultation) return;

    if (!replyForm.meetingLink || !replyForm.scheduledDate) {
      toast.error('Please fill in meeting link and scheduled date');
      return;
    }

    setSending(true);
    try {
      const token = localStorage.getItem('authToken');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${API_URL}/consultations/admin/${selectedConsultation._id}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(replyForm)
      });

      if (!response.ok) throw new Error('Failed to send reply');

      toast.success('Reply sent successfully!');
      setReplyForm({ meetingLink: '', scheduledDate: '', message: '' });
      setSelectedConsultation(null);
      fetchConsultations();
    } catch (error) {
      toast.error('Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500 hover:bg-yellow-600';
      case 'confirmed': return 'bg-green-500 hover:bg-green-600';
      case 'completed': return 'bg-blue-500 hover:bg-blue-600';
      case 'cancelled': return 'bg-red-500 hover:bg-red-600';
      default: return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  const exportConsultationsData = () => {
    const dataStr = JSON.stringify(filteredConsultations, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `consultations-data-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    toast.success('Consultations data exported successfully');
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-black' : 'bg-white'} flex items-center justify-center py-12`}>
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
          <p className={`mt-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading consultations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-black' : 'bg-white'}`}>
      {/* Header Section */}
      <div className={`${isDarkMode ? 'bg-black text-white border-b border-gray-800' : 'bg-white text-black border-b border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className={`text-4xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-black'}`}>Consultation Management</h1>
              <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Manage and respond to consultation requests</p>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <Card className={`${isDarkMode ? 'bg-black backdrop-blur-sm border-gray-700 text-white hover:bg-gray-800' : 'bg-white border-gray-200 text-black hover:bg-gray-50'} transition-all duration-300`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Consultations</p>
                    <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>{stats.totalConsultations}</p>
                  </div>
                  <BarChart3 className={`h-8 w-8 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                </div>
              </CardContent>
            </Card>

            <Card className={`${isDarkMode ? 'bg-black backdrop-blur-sm border-gray-700 text-white hover:bg-gray-800' : 'bg-white border-gray-200 text-black hover:bg-gray-50'} transition-all duration-300`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Pending</p>
                    <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>{stats.pendingConsultations}</p>
                  </div>
                  <Clock className={`h-8 w-8 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`} />
                </div>
              </CardContent>
            </Card>

            <Card className={`${isDarkMode ? 'bg-black backdrop-blur-sm border-gray-700 text-white hover:bg-gray-800' : 'bg-white border-gray-200 text-black hover:bg-gray-50'} transition-all duration-300`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Confirmed</p>
                    <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>{stats.confirmedConsultations}</p>
                  </div>
                  <CheckCircle className={`h-8 w-8 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                </div>
              </CardContent>
            </Card>

            <Card className={`${isDarkMode ? 'bg-black backdrop-blur-sm border-gray-700 text-white hover:bg-gray-800' : 'bg-white border-gray-200 text-black hover:bg-gray-50'} transition-all duration-300`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Completed</p>
                    <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>{stats.completedConsultations}</p>
                  </div>
                  <Users className={`h-8 w-8 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                </div>
              </CardContent>
            </Card>

            <Card className={`${isDarkMode ? 'bg-black backdrop-blur-sm border-gray-700 text-white hover:bg-gray-800' : 'bg-white border-gray-200 text-black hover:bg-gray-50'} transition-all duration-300`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Cancelled</p>
                    <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>{stats.cancelledConsultations}</p>
                  </div>
                  <AlertCircle className={`h-8 w-8 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} />
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
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search consultations by name, email, type, or message..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`pl-10 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder:text-gray-500' : 'bg-white border-gray-300 text-black placeholder:text-gray-500'}`}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className={`w-full md:w-48 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-black'}`}>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={exportConsultationsData}
                variant="outline"
                className={`${isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
              >
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Consultations List */}
        {filteredConsultations.length === 0 ? (
          <Card className={`${isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'} backdrop-blur-sm`}>
            <CardContent className="p-12 text-center">
              <CalendarDays className={`h-16 w-16 mx-auto mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
              <h3 className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                {searchTerm || statusFilter !== 'all' ? 'No consultations found' : 'No consultations yet'}
              </h3>
              <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filter criteria' 
                  : 'Consultation requests will appear here'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {filteredConsultations.map((consultation) => (
              <Card key={consultation._id} className={`group relative overflow-hidden ${isDarkMode ? 'bg-gray-800/50 border-gray-700 hover:bg-gray-800/70' : 'bg-white border-gray-200 hover:bg-gray-50'} backdrop-blur-sm shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:scale-[1.02]`}>
                {/* Background Gradient */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>

                <CardContent className="p-6 relative">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-black'} group-hover:text-blue-400 transition-colors duration-300`}>
                          {consultation.name}
                        </h3>
                        <Badge className={`${getStatusColor(consultation.status)} text-white shadow-sm`}>
                          {consultation.status}
                        </Badge>
                      </div>
                      <p className={`mb-4 capitalize ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {consultation.consultationType?.replace('-', ' ') || 'General Consultation'}
                      </p>

                      {/* Consultation Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className={`flex items-center gap-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          <Mail className={`w-4 h-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                          <span>{consultation.email}</span>
                        </div>
                        {consultation.phone && (
                          <div className={`flex items-center gap-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            <Phone className={`w-4 h-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                            <span>{consultation.phone}</span>
                          </div>
                        )}
                        <div className={`flex items-center gap-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          <Calendar className={`w-4 h-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                          <span>Preferred: {new Date(consultation.preferredDate).toLocaleString()}</span>
                        </div>
                        <div className={`flex items-center gap-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          <Clock className={`w-4 h-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                          <span>Created: {new Date(consultation.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {/* Message */}
                      {consultation.message && (
                        <div className={`${isDarkMode ? 'bg-gray-900/50 border-gray-700' : 'bg-gray-100 border-gray-200'} border rounded-lg p-4 mb-4`}>
                          <div className="flex items-start gap-3">
                            <MessageSquare className={`w-5 h-5 mt-0.5 flex-shrink-0 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                            <div className={`text-sm leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              {consultation.message}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Scheduled Date (if confirmed) */}
                      {consultation.scheduledDate && (
                        <div className={`${isDarkMode ? 'bg-blue-900/20 border-blue-700/50' : 'bg-blue-50 border-blue-200'} border rounded-lg p-3 mb-4`}>
                          <div className={`flex items-center gap-2 text-sm ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                            <Calendar className="w-4 h-4" />
                            <span className="font-medium">Scheduled for: {new Date(consultation.scheduledDate).toLocaleString()}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Button */}
                    {consultation.status === 'pending' && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                            onClick={() => setSelectedConsultation(consultation)}
                          >
                            <Send className="w-4 h-4 mr-2" />
                            Reply
                          </Button>
                        </DialogTrigger>
                        <DialogContent className={`max-w-2xl ${isDarkMode ? 'bg-gradient-to-br from-black via-gray-950 to-black border-gray-800/50 text-white' : 'bg-white border-gray-200 text-black'}`}>
                          <DialogHeader className="pb-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20' : 'bg-purple-100'}`}>
                                <Send className={`w-6 h-6 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                              </div>
                              <div>
                                <DialogTitle className={`text-2xl ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Send Consultation Reply</DialogTitle>
                                <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Reply to {selectedConsultation?.name}</p>
                              </div>
                            </div>
                          </DialogHeader>

                          <div className="space-y-6 py-4">
                            <div className="space-y-2">
                              <Label className={`flex items-center gap-2 text-base font-semibold ${isDarkMode ? 'text-white' : 'text-black'}`}>
                                <Link2 className={`w-4 h-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                                Meeting Link *
                              </Label>
                              <Input
                                placeholder="https://meet.google.com/..."
                                value={replyForm.meetingLink}
                                onChange={(e) => setReplyForm({ ...replyForm, meetingLink: e.target.value })}
                                className={`h-11 ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white placeholder:text-gray-500' : 'bg-white border-gray-300 text-black placeholder:text-gray-400'}`}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label className={`flex items-center gap-2 text-base font-semibold ${isDarkMode ? 'text-white' : 'text-black'}`}>
                                <Clock className={`w-4 h-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                                Scheduled Date & Time *
                              </Label>
                              <Input
                                type="datetime-local"
                                value={replyForm.scheduledDate}
                                onChange={(e) => setReplyForm({ ...replyForm, scheduledDate: e.target.value })}
                                className={`h-11 ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-black'}`}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label className={`flex items-center gap-2 text-base font-semibold ${isDarkMode ? 'text-white' : 'text-black'}`}>
                                <MessageSquare className={`w-4 h-4 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                                Additional Message
                              </Label>
                              <Textarea
                                placeholder="Add any additional information for the client..."
                                value={replyForm.message}
                                onChange={(e) => setReplyForm({ ...replyForm, message: e.target.value })}
                                rows={4}
                                className={`resize-none ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white placeholder:text-gray-500' : 'bg-white border-gray-300 text-black placeholder:text-gray-400'}`}
                              />
                            </div>
                          </div>

                          <div className={`flex gap-3 pt-4 border-t ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
                            <Button
                              variant="outline"
                              onClick={() => setSelectedConsultation(null)}
                              className={`flex-1 h-11 ${isDarkMode ? 'border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'}`}
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={handleSendReply}
                              disabled={sending}
                              className="flex-1 h-11 bg-blue-600 hover:bg-blue-700"
                            >
                              {sending ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                  Sending...
                                </>
                              ) : (
                                <>
                                  <Send className="w-4 h-4 mr-2" />
                                  Send Reply Email
                                </>
                              )}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
