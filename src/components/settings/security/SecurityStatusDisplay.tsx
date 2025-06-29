
import React from 'react';
import { Shield, Lock, Unlock } from 'lucide-react';

interface SecurityStatusDisplayProps {
  isSecurityEnabled: boolean;
  hasLockedData: boolean;
  getSecurityStatus: () => string;
}

const SecurityStatusDisplay = ({
  isSecurityEnabled,
  hasLockedData,
  getSecurityStatus
}: SecurityStatusDisplayProps) => {
  const getStatusIcon = () => {
    if (isSecurityEnabled) {
      return <Lock className="h-4 w-4 text-green-600" />;
    }
    if (hasLockedData) {
      return <Lock className="h-4 w-4 text-amber-600" />;
    }
    return <Unlock className="h-4 w-4 text-gray-500" />;
  };

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <div className="flex items-center gap-2">
        {getStatusIcon()}
        <span className="text-sm font-medium">{getSecurityStatus()}</span>
      </div>
    </div>
  );
};

export default SecurityStatusDisplay;
