
import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalLink, GitBranch, Key, Database } from 'lucide-react';

const NotionSetupGuide = () => {
  return (
    <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
          <GitBranch className="h-5 w-5" />
          How to Create a Notion Integration
        </CardTitle>
        <CardDescription className="text-gray-600 dark:text-gray-400">
          Follow these steps to create a Notion integration and get your token
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">
              1
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100">Visit Notion Integrations</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Go to the Notion integrations page and click "Create new integration"</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => window.open('https://www.notion.so/my-integrations', '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Notion Integrations
              </Button>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">
              2
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100">Configure Integration</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Give your integration a name (e.g., "Family Calendar") and select the workspace containing your calendar databases
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">
              3
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100">Copy Integration Token</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                After creating the integration, copy the "Internal Integration Token" - it starts with "secret_"
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">
              4
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100">Share Database with Integration</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                For each database you want to use as a calendar, click "..." → "Add connections" → Select your integration
              </p>
            </div>
          </div>
        </div>

        <Alert className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800">
          <Key className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertTitle className="text-amber-900 dark:text-amber-200">Security Note</AlertTitle>
          <AlertDescription className="text-amber-700 dark:text-amber-300">
            Your integration token is stored securely and encrypted in your browser. Never share it with others or post it publicly.
          </AlertDescription>
        </Alert>

        <Alert className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800">
          <Database className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertTitle className="text-blue-900 dark:text-blue-200">Database Requirements</AlertTitle>
          <AlertDescription className="text-blue-700 dark:text-blue-300">
            Your Notion database should have properties for title, date, and optionally description/location. The system will automatically detect and map these fields.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default NotionSetupGuide;
