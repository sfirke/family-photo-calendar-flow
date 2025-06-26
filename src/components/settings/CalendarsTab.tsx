
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ICalSettings from './ICalSettings';
import { Calendar } from 'lucide-react';

const CalendarsTab = () => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Calendar Sources</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Manage your calendar feeds and data sources
        </p>
      </div>

      <ICalSettings />
      
      <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <Calendar className="h-5 w-5" />
            Local Calendar
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Your family events are stored locally in your browser
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            All your manually created events are stored securely in your browser's local storage. 
            You can export and import these events using the data management features.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default CalendarsTab;
