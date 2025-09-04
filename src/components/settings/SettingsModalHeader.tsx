
import React, { useState, useEffect } from 'react';
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Info, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSecurity } from '@/contexts/security/SecurityContext';
import { getVersionInfo } from '@/utils/versionManager';
import { VersionInfo } from '@/types/ical';
import OfflineIndicator from '@/components/OfflineIndicator';

interface SettingsModalHeaderProps {
  onClose?: () => void;
}

const SettingsModalHeader = ({ onClose }: SettingsModalHeaderProps) => {
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);
  const [installedVersion, setInstalledVersion] = useState<string>('0.0.0');
  const { getSecurityStatus } = useSecurity();

  useEffect(() => {
    const loadVersionInfo = async () => {
      try {
  const info = await getVersionInfo();
  setVersionInfo(info);
  setInstalledVersion(info?.version || 'unknown');
      } catch (error) {
        console.error('Failed to load version info:', error);
      }
    };

    loadVersionInfo();
  }, []);

  return (
  <DialogHeader className="sticky top-0 z-20 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 -mx-4 sm:-mx-6 px-4 sm:px-6 pt-6 pb-3">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-0">
        <div>
          <DialogTitle className="text-gray-900 dark:text-gray-100 text-lg sm:text-xl">App Settings</DialogTitle>
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mt-1">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Version {installedVersion}
              </span>
            </div>
            {versionInfo?.buildDate && (
              <span className="text-xs text-gray-500 dark:text-gray-400 sm:ml-2">
                Built: {new Date(versionInfo.buildDate).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <OfflineIndicator />
          {onClose && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              aria-label="Close settings"
              className="h-8 w-8 p-0 rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      <DialogDescription className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
        <span>Configure your family calendar app preferences and manage your calendar feeds</span>
        <span className="block mt-1 text-xs">Security: {getSecurityStatus()}</span>
      </DialogDescription>
    </DialogHeader>
  );
};

export default SettingsModalHeader;
