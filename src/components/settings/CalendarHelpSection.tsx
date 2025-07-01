
import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

const CalendarHelpSection = () => {
  return (
    <Alert className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800">
      <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
      <AlertTitle className="text-blue-900 dark:text-blue-200">Tips for Calendar Feeds</AlertTitle>
      <AlertDescription className="text-sm space-y-2 text-blue-700 dark:text-blue-300">
        <p>• <strong>iCal Feeds:</strong> Export calendar from Google, Outlook, or other services as .ics files</p>
        <p>• <strong>Notion Databases:</strong> Share your database publicly and copy the sharing link</p>
        <p>• Calendar data is stored locally in your browser using IndexedDB</p>
        <p>• Click the edit icon to modify calendar name, URL, or color</p>
        <p>• Use the sync buttons to manually refresh calendar data</p>
      </AlertDescription>
    </Alert>
  );
};

export default CalendarHelpSection;
