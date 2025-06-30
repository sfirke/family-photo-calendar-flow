
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface SecurityUnlockFormProps {
  onUnlock: (password: string) => Promise<boolean>;
}

const SecurityUnlockForm = ({ onUnlock }: SecurityUnlockFormProps) => {
  const [password, setPassword] = useState('');
  const [isUnlocking, setIsUnlocking] = useState(false);
  const { toast } = useToast();

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
      const success = await onUnlock(password);
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
      setIsUnlocking(false);
    }
  };

  return (
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
        disabled={isUnlocking || !password}
        className="w-full"
      >
        {isUnlocking ? 'Unlocking...' : 'Unlock Security'}
      </Button>
    </div>
  );
};

export default SecurityUnlockForm;
