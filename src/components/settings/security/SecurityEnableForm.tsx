
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SecurityEnableFormProps {
  onEnableSecurity: (password: string) => Promise<boolean>;
}

const SecurityEnableForm = ({ onEnableSecurity }: SecurityEnableFormProps) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isEnabling, setIsEnabling] = useState(false);
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
      const success = await onEnableSecurity(password);
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

  return (
    <div className="space-y-4">
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
  );
};

export default SecurityEnableForm;
