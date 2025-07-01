
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSettings } from '@/contexts/SettingsContext';
import { useToast } from '@/hooks/use-toast';
import { NotionService } from '@/services/notionService';
import { GitBranch } from 'lucide-react';
import NotionTokenInput from './notion/NotionTokenInput';
import NotionSetupGuide from './notion/NotionSetupGuide';

const NotionTab = () => {
  const { notionIntegrationToken, setNotionIntegrationToken } = useSettings();
  const { toast } = useToast();
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [tokenError, setTokenError] = useState<string>('');

  const handleTokenTest = async () => {
    if (!notionIntegrationToken.trim()) {
      setTokenValid(false);
      setTokenError('Please enter an integration token');
      return;
    }

    try {
      // Test the token by making a simple API call
      const isValid = await NotionService.testToken(notionIntegrationToken);
      if (isValid) {
        setTokenValid(true);
        setTokenError('');
        toast({
          title: "Token validated",
          description: "Your Notion integration token is working correctly!"
        });
      } else {
        setTokenValid(false);
        setTokenError('Invalid token or insufficient permissions');
      }
    } catch (error) {
      setTokenValid(false);
      const errorMessage = error instanceof Error ? error.message : 'Failed to validate token';
      setTokenError(errorMessage);
      toast({
        title: "Token validation failed",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const handleTokenChange = (token: string) => {
    setNotionIntegrationToken(token);
    setTokenValid(null);
    setTokenError('');
  };

  return (
    <div className="space-y-6 bg-gray-50 dark:bg-gray-900 min-h-full p-1 -m-1 rounded-lg">
      <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <GitBranch className="h-5 w-5" />
            Notion Integration
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Connect your Notion workspace to sync database events with your calendar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NotionTokenInput
            token={notionIntegrationToken}
            onTokenChange={handleTokenChange}
            onTest={handleTokenTest}
            isValid={tokenValid}
            error={tokenError}
          />
        </CardContent>
      </Card>

      <NotionSetupGuide />
    </div>
  );
};

export default NotionTab;
