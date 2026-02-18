import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Users as UsersIcon,
  Mail,
  Calendar,
  Shield,
  Edit,
  Ban,
  CheckCircle,
  Search,
  Filter,
  Download,
  BarChart3,
  UserCheck,
  UserX,
  Crown,
  Phone,
} from 'lucide-react';
import { useDarkMode } from '@/contexts/DarkModeContext';

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: 'user' | 'admin';
  isActive: boolean;
  createdAt: string;
}

export default function Users() {
  const { isDarkMode } = useDarkMode();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState<'user' | 'admin'>('user');
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // New state variables for enhanced functionality
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchUsers();
  }, []);

  // Statistics calculation
  const stats = useMemo(() => {
    const totalUsers = users.length;
    const activeUsers = users.filter(user => user.isActive).length;
    const inactiveUsers = users.filter(user => !user.isActive).length;
    const adminUsers = users.filter(user => user.role === 'admin').length;
    const regularUsers = users.filter(user => user.role === 'user').length;

    return {
      totalUsers,
      activeUsers,
      inactiveUsers,
      adminUsers,
      regularUsers,
    };
  }, [users]);

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
      const matchesSearch = fullName.includes(searchTerm.toLowerCase()) ||
                          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (user.phone && user.phone.includes(searchTerm));

      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      const matchesStatus = statusFilter === 'all' ||
                          (statusFilter === 'active' && user.isActive) ||
                          (statusFilter === 'inactive' && !user.isActive);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, roleFilter, statusFilter]);

  // Export users data
  const exportUsersData = () => {
    const dataToExport = filteredUsers.map(user => ({
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      status: user.isActive ? 'Active' : 'Inactive',
      joinedDate: new Date(user.createdAt).toLocaleDateString(),
    }));

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Users data exported successfully!');
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${API_URL}/admin/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch users');

      const data = await response.json();
      setUsers(data.data);
    } catch (error) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async () => {
    if (!selectedUser) return;

    setActionLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${API_URL}/admin/users/${selectedUser._id}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      });

      if (!response.ok) throw new Error('Failed to update role');

      toast.success('User role updated successfully');
      setShowRoleDialog(false);
      fetchUsers();
    } catch (error) {
      toast.error('Failed to update user role');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!selectedUser) return;

    setActionLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${API_URL}/admin/users/${selectedUser._id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: !selectedUser.isActive })
      });

      if (!response.ok) throw new Error('Failed to update status');

      toast.success(`User ${!selectedUser.isActive ? 'activated' : 'deactivated'} successfully`);
      setShowStatusDialog(false);
      fetchUsers();
    } catch (error) {
      toast.error('Failed to update user status');
    } finally {
      setActionLoading(false);
    }
  };

  const openRoleDialog = (user: User) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setShowRoleDialog(true);
  };

  const openStatusDialog = (user: User) => {
    setSelectedUser(user);
    setShowStatusDialog(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading users...</p>
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
                <UsersIcon className="w-10 h-10" />
                User Management
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300">Manage user accounts and permissions</p>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <Card className="bg-white dark:bg-black backdrop-blur-sm border-gray-200 dark:border-gray-700 text-black dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Users</p>
                    <p className="text-2xl font-bold text-black dark:text-white">{stats.totalUsers}</p>
                  </div>
                  <UsersIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-black backdrop-blur-sm border-gray-200 dark:border-gray-700 text-black dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Users</p>
                    <p className="text-2xl font-bold text-black dark:text-white">{stats.activeUsers}</p>
                  </div>
                  <UserCheck className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-black backdrop-blur-sm border-gray-200 dark:border-gray-700 text-black dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Inactive Users</p>
                    <p className="text-2xl font-bold text-black dark:text-white">{stats.inactiveUsers}</p>
                  </div>
                  <UserX className="h-8 w-8 text-red-600 dark:text-red-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-black backdrop-blur-sm border-gray-200 dark:border-gray-700 text-black dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Admin Users</p>
                    <p className="text-2xl font-bold text-black dark:text-white">{stats.adminUsers}</p>
                  </div>
                  <Crown className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-black backdrop-blur-sm border-gray-200 dark:border-gray-700 text-black dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Regular Users</p>
                    <p className="text-2xl font-bold text-black dark:text-white">{stats.regularUsers}</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-blue-600 dark:text-blue-400" />
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
                  placeholder="Search users by name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full md:w-40 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                  <Shield className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="user">Users</SelectItem>
                  <SelectItem value="admin">Admins</SelectItem>
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
                onClick={exportUsersData}
                variant="outline"
                className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Users Grid */}
        {filteredUsers.length === 0 ? (
          <Card className="bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 backdrop-blur-sm">
            <CardContent className="p-12 text-center">
              <UsersIcon className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold mb-2 text-black dark:text-white">
                {searchTerm || roleFilter !== 'all' || statusFilter !== 'all' ? 'No users found' : 'No users yet'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {searchTerm || roleFilter !== 'all' || statusFilter !== 'all'
                  ? 'Try adjusting your search or filter criteria'
                  : 'User accounts will appear here'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredUsers.map((user) => (
              <Card key={user._id} className="group relative overflow-hidden bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/70 backdrop-blur-sm shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:scale-[1.02]">
                {/* Background Gradient */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>

                <CardHeader className="relative bg-white dark:bg-gradient-to-br dark:from-gray-800/80 dark:to-gray-900/80 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                          {user.firstName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-black dark:text-white group-hover:text-blue-400 transition-colors duration-300">
                            {user.firstName} {user.lastName}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={`${user.role === 'admin' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' : 'bg-blue-500/20 text-blue-400 border-blue-500/30'} border`}>
                              {user.role === 'admin' && <Shield className="w-3 h-3 mr-1" />}
                              {user.role}
                            </Badge>
                            <Badge className={`${user.isActive ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'} border`}>
                              {user.isActive ? <CheckCircle className="w-3 h-3 mr-1" /> : <Ban className="w-3 h-3 mr-1" />}
                              {user.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-4 relative">
                  {/* Contact Information */}
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">{user.email}</span>
                    </div>
                    {user.phone && (
                      <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                        <Phone className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">{user.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openRoleDialog(user)}
                      className="flex-1 border-blue-500/30 text-blue-400 hover:bg-blue-500/10 hover:border-blue-500/50 transition-all duration-300"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Role
                    </Button>
                    <Button
                      variant={user.isActive ? 'destructive' : 'default'}
                      size="sm"
                      onClick={() => openStatusDialog(user)}
                      className={`flex-1 transition-all duration-300 ${
                        user.isActive
                          ? 'bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50'
                          : 'bg-green-600 hover:bg-green-700'
                      }`}
                    >
                      {user.isActive ? <Ban className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Update Role Dialog */}
      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent className={`max-w-md ${isDarkMode ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900'}`}>
          <DialogHeader className="pb-4 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-blue-950 flex items-center justify-center">
                <Shield className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <DialogTitle className="text-2xl text-white">Update User Role</DialogTitle>
                <p className="text-sm mt-1 text-gray-400">Change role for {selectedUser?.firstName} {selectedUser?.lastName}</p>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-base font-semibold text-white">
                <Shield className="w-4 h-4 text-purple-400" />
                Select New Role
              </Label>
              <Select value={newRole} onValueChange={(value: 'user' | 'admin') => setNewRole(value)}>
                <SelectTrigger className="h-11 bg-gray-800 border-gray-700 text-white focus:ring-blue-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="user" className="text-white hover:bg-gray-700">
                    <div className="flex items-center gap-2">
                      <UsersIcon className="w-4 h-4" />
                      User
                    </div>
                  </SelectItem>
                  <SelectItem value="admin" className="text-white hover:bg-gray-700">
                    <div className="flex items-center gap-2">
                      <Crown className="w-4 h-4" />
                      Admin
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-800">
            <Button
              variant="outline"
              onClick={() => setShowRoleDialog(false)}
              className="flex-1 h-11 border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateRole}
              disabled={actionLoading}
              className="flex-1 h-11 bg-blue-600 hover:bg-blue-700"
            >
              {actionLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Updating...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4 mr-2" />
                  Update Role
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Toggle Status Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent className={`max-w-md ${isDarkMode ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900'}`}>
          <DialogHeader className="pb-4 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${selectedUser?.isActive ? 'bg-red-950' : 'bg-green-950'}`}>
                {selectedUser?.isActive ? (
                  <Ban className="w-6 h-6 text-red-400" />
                ) : (
                  <CheckCircle className="w-6 h-6 text-green-400" />
                )}
              </div>
              <div>
                <DialogTitle className="text-2xl text-white">
                  {selectedUser?.isActive ? 'Deactivate' : 'Activate'} User
                </DialogTitle>
                <p className="text-sm mt-1 text-gray-400">
                  {selectedUser?.firstName} {selectedUser?.lastName}
                </p>
              </div>
            </div>
          </DialogHeader>

          <div className="py-6">
            <div className={`p-4 rounded-lg border ${selectedUser?.isActive ? 'bg-red-950/20 border-red-900/50' : 'bg-green-950/20 border-green-900/50'}`}>
              <p className="text-gray-300 leading-relaxed">
                Are you sure you want to <span className={`font-semibold ${selectedUser?.isActive ? 'text-red-400' : 'text-green-400'}`}>
                  {selectedUser?.isActive ? 'deactivate' : 'activate'}
                </span> this user account?
                {selectedUser?.isActive && (
                  <span className="block mt-2 text-sm text-red-300">
                    They will not be able to login until the account is reactivated.
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-800">
            <Button
              variant="outline"
              onClick={() => setShowStatusDialog(false)}
              className="flex-1 h-11 border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button
              variant={selectedUser?.isActive ? 'destructive' : 'default'}
              onClick={handleToggleStatus}
              disabled={actionLoading}
              className={`flex-1 h-11 ${
                selectedUser?.isActive
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {actionLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Updating...
                </>
              ) : (
                <>
                  {selectedUser?.isActive ? <Ban className="w-4 h-4 mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                  {selectedUser?.isActive ? 'Deactivate' : 'Activate'}
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
