
import React from 'react';
import { AlertCircle } from 'lucide-react';

const UpdateInfoSection = () => {
  return (
    <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/30 p-3 rounded-lg">
      <div className="flex items-start gap-2">
        <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
        <div className="space-y-1">
          <p className="font-medium">Manual Update System:</p>
          <p>• Updates are checked against the configured GitHub repository</p>
          <p>• You control when to install updates by clicking the update button</p>
          <p>• Configure the GitHub repository above to enable update checking</p>
          <p>• The page will refresh automatically after successful updates</p>
        </div>
      </div>
    </div>
  );
};

export default UpdateInfoSection;
