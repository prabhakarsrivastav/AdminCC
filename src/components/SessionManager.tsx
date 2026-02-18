import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { authHelpers } from '@/lib/api';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const SessionManager = () => {
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(300); // 5 minutes
  const navigate = useNavigate();

  useEffect(() => {
    // Wait 10 seconds before starting session checks to avoid conflicts with initial auth
    const initialDelay = setTimeout(() => {
      startSessionChecks();
    }, 10000);

    return () => clearTimeout(initialDelay);
  }, [navigate]);

  const startSessionChecks = () => {
    const checkSession = () => {
      if (!authHelpers.isAuthenticated()) {
        return;
      }

      const tokenTime = localStorage.getItem('authTokenTime');
      if (!tokenTime) return;

      const tokenAge = Date.now() - parseInt(tokenTime);
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      const warningThreshold = 23 * 60 * 60 * 1000; // 23 hours (1 hour before expiry)

      if (tokenAge > maxAge) {
        // Session expired
        authHelpers.removeToken();
        toast.error('Session expired. Please log in again.');
        navigate('/', { replace: true });
      } else if (tokenAge > warningThreshold && !showWarning) {
        // Show warning
        setShowWarning(true);
        const remainingTime = Math.max(0, Math.floor((maxAge - tokenAge) / 1000));
        setCountdown(remainingTime);
      }
    };

    // Check every 5 minutes (not immediately)
    const interval = setInterval(checkSession, 300000);

    return () => clearInterval(interval);
  };

  useEffect(() => {
    if (showWarning && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(prev => prev - 1);
      }, 1000);

      return () => clearTimeout(timer);
    } else if (showWarning && countdown <= 0) {
      // Time's up, logout
      handleSessionExpired();
    }
  }, [showWarning, countdown]);

  const handleSessionExpired = () => {
    authHelpers.removeToken();
    toast.error('Session expired. Please log in again.');
    navigate('/', { replace: true });
    setShowWarning(false);
  };

  const handleExtendSession = () => {
    // In a real app, you might want to refresh the token here
    // For now, just dismiss the warning
    setShowWarning(false);
    toast.success('Session acknowledged. Please save your work and log in again when convenient.');
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <AlertDialog open={showWarning} onOpenChange={setShowWarning}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Session Expiring Soon</AlertDialogTitle>
          <AlertDialogDescription>
            Your session will expire in {formatTime(countdown)}. Please save your work.
            You will be automatically logged out when the timer reaches zero.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={handleExtendSession}>
            I Understand
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default SessionManager;