
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, Lock, Unlock, AlertTriangle } from 'lucide-react';
import { useSecurity } from '@/contexts/SecurityContext';
import { useToast } from '@/hooks/use-toast';
import SecurityUnlockBanner from '@/components/security/SecurityUnlockBanner';

const SecurityTab = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isEnabling, setIsEnabling] = useState(false);
  const { isSecurityEnabled, hasLockedData, enableSecurity, disableSecurity, getSecurityStatus } = useSecurity();
  const { toast } = useToast();

  const handleEnableSecurity = async () => {
    if (password.length < 8) {
      toast({
        title: "Password too short",
        description: "Password must be at least 8 characters long.",
        variant: "destructive"
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please ensure both password fields match.",
        variant: "destructive"
      });
      return;
    }

    setIsEnabling(true);
    try {
      const success = await enableSecurity(password);
      if (success) {
        toast({
          title: "Security enabled",
          description: "Your data will now be encrypted locally.",
        });
        setPassword('');
        setConfirmPassword('');
      } else {
        toast({
          title: "Failed to enable security",
          description: "Please check your password and try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Security error",
        description: "An error occurred while enabling security.",
        variant: "destructive"
      });
    } finally {
      setIsEnabling(false);
    }
  };

  const handleDisableSecurity = () => {
    if (window.confirm('Are you sure you want to disable security? This will remove encryption from your data.')) {
      disableSecurity();
      toast({
        title: "Security disabled",
        description: "Your data is no longer encrypted.",
        variant: "destructive"
      });
    }
  };

  const handleUnlock = async () => {
    if (!password) {
      toast({
        title: "Password required",
        description: "Please enter your security password.",
        variant: "destructive"
      });
      return;
    }

    setIsEnabling(true);
    try {
      const success = await enableSecurity(password);
      if (success) {
        toast({
          title: "Security unlocked",
          description: "Your encrypted data is now accessible.",
        });
        setPassword('');
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
      setIsEnabling(false);
    }
  };

  const hasSecuritySalt = localStorage.getItem('security_salt') !== null;
  const needsUnlock = hasSecuritySalt && !isSecurityEnabled;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Shield className="h-5 w-5" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Security Settings</h3>
      </div>
      
      <p className="text-sm text-gray-600 dark:text-gray-400">
        {needsUnlock 
          ? "Enter your password to unlock encrypted data"
          : "Configure client-side encryption for your sensitive data"
        }
      </p>

      {/* Show unlock banner if data is locked */}
      <SecurityUnlockBanner />

      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="flex items-center gap-2">
          {isSecurityEnabled ? (
            <Lock className="h-4 w-4 text-green-600" />
          ) : hasLockedData ? (
            <Lock className="h-4 w-4 text-amber-600" />
          ) : (
            <Unlock className="h-4 w-4 text-gray-500" />
          )}
          <span className="text-sm font-medium">{getSecurityStatus()}</span>
        </div>
      </div>

      {needsUnlock ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="unlock-password">Security Password</Label>
            <Input
              id="unlock-password"
              type="password"
              placeholder="Enter your security password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleUnlock()}
            />
          </div>
          
          <Button
            onClick={handleUnlock}
            disabled={isEnabling || !password}
            className="w-full"
          >
            {isEnabling ? 'Unlocking...' : 'Unlock Security'}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {!isSecurityEnabled ? (
            <>
              <div className="p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-start gap-2">
                  <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div className="text-sm text-blue-800 dark:text-blue-200">
                    <p className="font-medium mb-1">Enhanced Security</p>
                    <p>Encrypts API keys and sensitive data locally using AES-256 encryption.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-password">Create Security Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="Enter a strong password (min 8 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleEnableSecurity()}
                />
              </div>

              <Button
                onClick={handleEnableSecurity}
                disabled={isEnabling || password.length < 8 || password !== confirmPassword}
                className="w-full"
              >
                {isEnabling ? 'Enabling...' : 'Enable Security'}
              </Button>
            </>
          ) : (
            <>
              <div className="p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span className="text-sm text-green-800 dark:text-green-200">
                    Security is active - your data is encrypted
                  </span>
                </div>
              </div>

              <Button
                onClick={handleDisableSecurity}
                variant="outline"
                className="w-full text-red-600 border-red-300 hover:bg-red-50"
              >
                Disable Security
              </Button>
            </>
          )}

          <div className="p-3 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div className="text-xs text-amber-800 dark:text-amber-200">
                <p className="font-medium">Important:</p>
                <p>If you forget your password, your encrypted data cannot be recovered. Keep your password safe!</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SecurityTab;
