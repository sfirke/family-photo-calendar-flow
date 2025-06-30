
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GitBranch, Download, CheckCircle, RefreshCw, ExternalLink } from 'lucide-react';

interface UpdateStatusCardProps {
  updateAvailable: boolean;
  updateInfo: any;
  isChecking: boolean;
  isUpdating: boolean;
  onCheckForUpdates: () => void;
  onInstallUpdate: () => void;
  onOpenReleaseNotes: () => void;
}

const UpdateStatusCard = ({
  updateAvailable,
  updateInfo,
  isChecking,
  isUpdating,
  onCheckForUpdates,
  onInstallUpdate,
  onOpenReleaseNotes
}: UpdateStatusCardProps) => {
  return (
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

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={onCheckForUpdates}
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
              onClick={onInstallUpdate}
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
              onClick={onOpenReleaseNotes}
              disabled={isChecking || isUpdating}
              variant="outline"
              className="border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Release Notes
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default UpdateStatusCard;
