import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { z } from "zod";
import { api, authHelpers } from "@/lib/api";
import { clearAuthCache } from "@/components/RouteGuard";

const authSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate input
    const result = authSchema.safeParse({ email, password });
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        // Login
        const response = await api.auth.login(email, password);
        
        // Check if user is admin
        if (response.user.role !== 'admin') {
          toast.error("Access denied. Admin privileges required.");
          return;
        }

        // Save token and clear cache
        authHelpers.saveToken(response.token);
        clearAuthCache();
        
        toast.success("Signed in successfully!");
        navigate("/admin/dashboard", { replace: true });
      } else {
        // Signup for admin users - redirect to contact or show message
        toast.error("Admin account creation is restricted. Please contact the system administrator.");
      }
    } catch (error: any) {
      toast.error(error.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header Section */}
        <div className="bg-white text-gray-900 rounded-t-lg px-8 py-8 text-center border-b border-gray-200">
          <h1 className="text-3xl font-bold mb-2 text-blue-600">ConnectCanada.io</h1>
          <p className="text-gray-600">Admin Portal</p>
        </div>

        {/* Form Section */}
        <Card className="rounded-t-none shadow-lg border-gray-200">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 font-medium">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@canadiannexus.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 border-gray-300 focus:border-blue-500"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700 font-medium">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 border-gray-300 focus:border-blue-500"
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In to Dashboard"}
            </Button>
            </form>

            <div className="mt-6 text-center">
              <div className="inline-flex items-center px-4 py-2 bg-blue-50 rounded-lg">
                <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span className="text-sm font-medium text-blue-800">Admin Access Only</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
