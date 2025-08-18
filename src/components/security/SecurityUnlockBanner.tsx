
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertTriangle, Lock, Eye, EyeOff } from 'lucide-react';
import { useSecurity } from '@/contexts/security/SecurityContext';
import { useToast } from '@/hooks/use-toast';

interface SecurityUnlockBannerProps {
  /** Optional callback when security is unlocked */
  onUnlock?: () => void;
}

const SecurityUnlockBanner = ({ onUnlock }: SecurityUnlockBannerProps) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const { hasLockedData, enableSecurity } = useSecurity();
  const { toast } = useToast();

  if (!hasLockedData) {
    return null;
  }

  const handleUnlock = async () => {
    if (!password) {
      toast({
        title: "Password required",
        description: "Please enter your security password.",
        variant: "destructive"
      });
      return;
    }

    setIsUnlocking(true);
    try {
      const success = await enableSecurity(password);
      if (success) {
        toast({
          title: "Security unlocked",
          description: "Your encrypted data is now accessible.",
        });
        setPassword('');
        onUnlock?.();
      } else {
        toast({
          title: "Incorrect password",
          description: "Please check your password and try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Unlock failed",
        description: "Failed to unlock security. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUnlocking(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleUnlock();
    }
  };

  return (
    <div className="mb-4 p-4 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Lock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <h3 className="font-medium text-amber-800 dark:text-amber-200">
              Encrypted Data Locked
            </h3>
          </div>
          <p className="text-sm text-amber-700 dark:text-amber-300 mb-3">
            Your Google Photos URL, Weather API key, and location data are encrypted. 
            Enter your security password to access and edit them.
          </p>
          
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-xs">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Enter security password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                className="pr-10 bg-white dark:bg-gray-800 border-amber-300 dark:border-amber-600"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-2 text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <Button
              onClick={handleUnlock}
              disabled={isUnlocking || !password}
              size="sm"
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {isUnlocking ? 'Unlocking...' : 'Unlock'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityUnlockBanner;
