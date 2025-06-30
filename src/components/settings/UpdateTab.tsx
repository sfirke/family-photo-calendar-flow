
import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, Download, CheckCircle, Clock, Info, ExternalLink, GitBranch, AlertCircle } from 'lucide-react';
import { useUpdateManager } from '@/hooks/useUpdateManager';
import { Progress } from '@/components/ui/progress';
import GitHubRepositorySettings from './update/GitHubRepositorySettings';

const UpdateTab = () => {
  const {
    isChecking,
    isUpdating,
    updateAvailable,
    updateInfo,
    currentVersion,
    lastCheckTime,
    updateProgress,
    loadCurrentInfo,
    checkForUpdatesManually,
    installUpdate,
    openReleaseNotes
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

  const getProgressValue = () => {
    if (!updateProgress?.progress) return 0;
    return updateProgress.progress;
  };

  return (
    <div className="space-y-4">
      {/* GitHub Repository Configuration */}
      <GitHubRepositorySettings />

      {/* Current Version Card */}
      <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <Info className="h-5 w-5" />
            Installed Version
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Current version installed on this device
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Installed Version:</span>
            <span className="text-sm font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-gray-900 dark:text-gray-100">
              v{currentVersion}
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
      <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <GitBranch className="h-5 w-5" />
            Update Status
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Check for and install updates from GitHub releases
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
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      <p>Version {updateInfo.version} - {updateInfo.name}</p>
                      <p>Released: {new Date(updateInfo.publishedAt).toLocaleDateString()}</p>
                    </div>
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
                    You have the latest available version
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Update Progress */}
          {isUpdating && updateProgress && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {updateProgress.message}
                </span>
              </div>
              <Progress value={getProgressValue()} className="w-full" />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={checkForUpdatesManually}
              disabled={isChecking || isUpdating}
              variant="outline"
              className="flex-1 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700"
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
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white dark:bg-blue-600 dark:hover:bg-blue-700"
              >
                {isUpdating ? (
                  <>
                    <Download className="h-4 w-4 mr-2 animate-pulse" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Update to v{updateInfo?.version}
                  </>
                )}
              </Button>
            )}

            {updateAvailable && updateInfo && (
              <Button
                onClick={openReleaseNotes}
                disabled={isChecking || isUpdating}
                variant="outline"
                className="border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Release Notes
              </Button>
            )}
          </div>

          {/* Release Notes */}
          {updateAvailable && updateInfo?.releaseNotes && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                What's New in {updateInfo.version}:
              </h4>
              <div className="text-xs text-blue-800 dark:text-blue-200 whitespace-pre-wrap max-h-32 overflow-y-auto">
                {updateInfo.releaseNotes}
              </div>
            </div>
          )}

          {/* Information */}
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
        </CardContent>
      </Card>
    </div>
  );
};

export default UpdateTab;
