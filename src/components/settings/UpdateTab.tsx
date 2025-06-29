
import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, Download, CheckCircle, Clock, Info, ExternalLink, GitBranch } from 'lucide-react';
import { useUpdateManager } from '@/hooks/useUpdateManager';

const UpdateTab = () => {
  const {
    isChecking,
    isUpdating,
    updateAvailable,
    updateInfo,
    upstreamUpdateAvailable,
    upstreamUpdateInfo,
    currentVersion,
    lastCheckTime,
    lastUpstreamCheckTime,
    loadCurrentInfo,
    checkForUpdatesManually,
    installUpdate,
    openUpstreamUpdate
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

  const hasAnyUpdate = updateAvailable || upstreamUpdateAvailable;

  return (
    <div className="space-y-4">
      {/* Current Version Card */}
      <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
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
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">GitHub Check:</span>
            <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
              <GitBranch className="h-4 w-4" />
              {formatLastCheckTime(lastUpstreamCheckTime)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Update Status Card */}
      <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
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
          <div className="space-y-3">
            {/* Service Worker Update Status */}
            <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
              {updateAvailable ? (
                <>
                  <Download className="h-5 w-5 text-blue-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      App Update Ready
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      A new version is ready to install
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      App Up to Date
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      No immediate updates available
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Upstream Update Status */}
            <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
              {upstreamUpdateAvailable ? (
                <>
                  <GitBranch className="h-5 w-5 text-orange-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      New Release Available
                    </p>
                    {upstreamUpdateInfo && (
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        <p>Version {upstreamUpdateInfo.version} - {upstreamUpdateInfo.name}</p>
                        <p>Released: {new Date(upstreamUpdateInfo.publishedAt).toLocaleDateString()}</p>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Latest GitHub Release
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      You have the latest released version
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

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

            {upstreamUpdateAvailable && (
              <Button
                onClick={openUpstreamUpdate}
                disabled={isChecking || isUpdating}
                variant="outline"
                className="flex-1 border-orange-300 dark:border-orange-600 text-orange-700 dark:text-orange-300 hover:bg-orange-50 dark:hover:bg-orange-900/20"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View Release
              </Button>
            )}
          </div>

          {/* Release Notes */}
          {upstreamUpdateAvailable && upstreamUpdateInfo?.releaseNotes && (
            <div className="mt-4 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
              <h4 className="text-sm font-medium text-orange-900 dark:text-orange-100 mb-2">
                What's New in {upstreamUpdateInfo.version}:
              </h4>
              <div className="text-xs text-orange-800 dark:text-orange-200 whitespace-pre-wrap max-h-32 overflow-y-auto">
                {upstreamUpdateInfo.releaseNotes}
              </div>
            </div>
          )}

          {/* Additional Info */}
          <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/30 p-3 rounded-lg">
            <p className="mb-1">
              <strong>App Updates:</strong> Immediate updates are installed automatically when available.
            </p>
            <p className="mb-1">
              <strong>GitHub Updates:</strong> Major releases are checked hourly from the GitHub repository.
            </p>
            <p>
              <strong>Note:</strong> Configure the GitHub repository in the code to enable release checking.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UpdateTab;
