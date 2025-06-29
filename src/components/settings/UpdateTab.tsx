
import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, Download, CheckCircle, Clock, Info } from 'lucide-react';
import { useUpdateManager } from '@/hooks/useUpdateManager';

const UpdateTab = () => {
  const {
    isChecking,
    isUpdating,
    updateAvailable,
    updateInfo,
    currentVersion,
    lastCheckTime,
    loadCurrentInfo,
    checkForUpdatesManually,
    installUpdate
  } = useUpdateManager();

  useEffect(() => {
    loadCurrentInfo();
  }, [loadCurrentInfo]);

  const formatLastCheckTime = (date: Date | null) => {
    if (!date) return 'Never';
    
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-4">
      {/* Current Version Card */}
      <Card className="border border-gray-200 dark:border-gray-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <Info className="h-5 w-5" />
            Current Version
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Information about your current app version
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Version:</span>
            <span className="text-sm font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-gray-900 dark:text-gray-100">
              {currentVersion || '1.0.0'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Last Check:</span>
            <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {formatLastCheckTime(lastCheckTime)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Update Status Card */}
      <Card className="border border-gray-200 dark:border-gray-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <RefreshCw className="h-5 w-5" />
            Update Status
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Check for and install app updates
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status Display */}
          <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            {updateAvailable ? (
              <>
                <Download className="h-5 w-5 text-blue-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Update Available
                  </p>
                  {updateInfo && (
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Version {updateInfo.version} is ready to install
                      {updateInfo.buildDate && (
                        <span className="block">
                          Built: {new Date(updateInfo.buildDate).toLocaleDateString()}
                        </span>
                      )}
                    </p>
                  )}
                </div>
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Up to Date
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    You're running the latest version
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={checkForUpdatesManually}
              disabled={isChecking || isUpdating}
              variant="outline"
              className="flex-1"
            >
              {isChecking ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Check for Updates
                </>
              )}
            </Button>

            {updateAvailable && (
              <Button
                onClick={installUpdate}
                disabled={isUpdating || isChecking}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
              >
                {isUpdating ? (
                  <>
                    <Download className="h-4 w-4 mr-2 animate-pulse" />
                    Installing...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Install Update
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Additional Info */}
          <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/30 p-3 rounded-lg">
            <p className="mb-1">
              <strong>Note:</strong> Installing updates will refresh the app with the latest features and improvements.
            </p>
            <p>
              Updates are downloaded automatically in the background and only applied when you choose to install them.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UpdateTab;
