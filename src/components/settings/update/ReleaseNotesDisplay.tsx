
import React from 'react';

interface ReleaseNotesDisplayProps {
  updateAvailable: boolean;
  updateInfo: any;
}

const ReleaseNotesDisplay = ({ updateAvailable, updateInfo }: ReleaseNotesDisplayProps) => {
  if (!updateAvailable || !updateInfo?.releaseNotes) {
    return null;
  }

  return (
    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
      <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
        What's New in {updateInfo.version}:
      </h4>
      <div className="text-xs text-blue-800 dark:text-blue-200 whitespace-pre-wrap max-h-32 overflow-y-auto">
        {updateInfo.releaseNotes}
      </div>
    </div>
  );
};

export default ReleaseNotesDisplay;
