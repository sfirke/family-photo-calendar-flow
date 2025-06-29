
import React, { useState, useEffect } from 'react';
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Info } from 'lucide-react';
import { useSecurity } from '@/contexts/SecurityContext';
import { getVersionInfo } from '@/utils/versionManager';
import OfflineIndicator from '@/components/OfflineIndicator';

const SettingsModalHeader = () => {
  const [versionInfo, setVersionInfo] = useState<any>(null);
  const { getSecurityStatus } = useSecurity();

  useEffect(() => {
    const loadVersionInfo = async () => {
      try {
        const info = await getVersionInfo();
        setVersionInfo(info);
      } catch (error) {
        console.error('Failed to load version info:', error);
      }
    };

    loadVersionInfo();
  }, []);

  return (
    <DialogHeader>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
        <div>
          <DialogTitle className="text-gray-900 dark:text-gray-100 text-lg sm:text-xl">App Settings</DialogTitle>
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mt-1">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Version {versionInfo?.version || '1.0.0'}
              </span>
            </div>
            {versionInfo?.buildDate && (
              <span className="text-xs text-gray-500 dark:text-gray-400 sm:ml-2">
                Built: {new Date(versionInfo.buildDate).toLocaleDateString()}
              </span>
            )}
            {versionInfo?.gitHash && versionInfo.gitHash !== 'unknown' && (
              <span className="text-xs font-mono text-gray-500 dark:text-gray-400 sm:ml-2">
                #{versionInfo.gitHash.substring(0, 7)}
              </span>
            )}
          </div>
        </div>
        <OfflineIndicator />
      </div>
      <DialogDescription className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
        Configure your family calendar app preferences and manage your calendar feeds
        <div className="mt-1 text-xs">
          Security: {getSecurityStatus()}
        </div>
      </DialogDescription>
    </DialogHeader>
  );
};

export default SettingsModalHeader;
