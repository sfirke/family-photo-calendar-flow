
import React from 'react';
import { Button } from '@/components/ui/button';
import { Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SecurityDisableSectionProps {
  onDisableSecurity: () => void;
}

const SecurityDisableSection = ({ onDisableSecurity }: SecurityDisableSectionProps) => {
  const { toast } = useToast();

  const handleDisableSecurity = () => {
    if (window.confirm('Are you sure you want to disable security? This will remove encryption from your data.')) {
      onDisableSecurity();
      toast({
        title: "Security disabled",
        description: "Your data is no longer encrypted.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-4">
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
    </div>
  );
};

export default SecurityDisableSection;
