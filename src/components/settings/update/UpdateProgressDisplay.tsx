
import React from 'react';
import { RefreshCw } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { UpdateProgress } from '@/utils/manualUpdateManager';

interface UpdateProgressDisplayProps {
  updateProgress: UpdateProgress | null;
  isUpdating: boolean;
}

const UpdateProgressDisplay = ({ updateProgress, isUpdating }: UpdateProgressDisplayProps) => {
  if (!isUpdating || !updateProgress) {
    return null;
  }

  const getProgressValue = () => {
    return updateProgress?.progress || 0;
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {updateProgress.message}
        </span>
      </div>
      <Progress value={getProgressValue()} className="w-full" />
    </div>
  );
};

export default UpdateProgressDisplay;
