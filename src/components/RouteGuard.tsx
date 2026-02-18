import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { toast } from 'sonner';
import { api, authHelpers } from '@/lib/api';

interface RouteGuardProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

// Singleton validation state
class AuthValidator {
  private static instance: AuthValidator;
  private validating = false;
  private result: { isValid: boolean; timestamp: number } | null = null;
  private promise: Promise<boolean> | null = null;
  private readonly CACHE_DURATION = 5 * 60 * 1000;

  static getInstance(): AuthValidator {
    if (!AuthValidator.instance) {
      AuthValidator.instance = new AuthValidator();
    }
    return AuthValidator.instance;
  }

  clear() {
    this.result = null;
    this.promise = null;
    this.validating = false;
  }

  async validate(requireAdmin: boolean): Promise<boolean> {
    // Check token first
    if (!authHelpers.isAuthenticated()) {
      return false;
    }

    // Use cached result if fresh
    if (this.result && Date.now() - this.result.timestamp < this.CACHE_DURATION) {
      return this.result.isValid;
    }

    // If validation in progress, wait for it
    if (this.promise) {
      return this.promise;
    }

    // Start new validation
    this.promise = this.performValidation(requireAdmin);
    return this.promise;
  }

  private async performValidation(requireAdmin: boolean): Promise<boolean> {
    try {
      const { user } = await api.auth.getMe();
      
      if (requireAdmin && user.role !== 'admin') {
        authHelpers.removeToken();
        toast.error('Access denied. Admin privileges required.');
        this.result = { isValid: false, timestamp: Date.now() };
        return false;
      }
      
      this.result = { isValid: true, timestamp: Date.now() };
      return true;
    } catch (error) {
      authHelpers.removeToken();
      toast.error('Session expired. Please log in again.');
      this.result = { isValid: false, timestamp: Date.now() };
      return false;
    } finally {
      this.promise = null;
    }
  }
}

const validator = AuthValidator.getInstance();

export const clearAuthCache = () => {
  validator.clear();
};

const RouteGuard = ({ children, requireAdmin = true }: RouteGuardProps) => {
  const [isValidating, setIsValidating] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    let mounted = true;

    validator.validate(requireAdmin).then(isValid => {
      if (mounted) {
        setIsAuthorized(isValid);
        setIsValidating(false);
      }
    });

    return () => {
      mounted = false;
    };
  }, [requireAdmin]);

  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Validating session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default RouteGuard;
