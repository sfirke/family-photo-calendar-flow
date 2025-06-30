
import React from 'react';
import { Check, X, GitBranch } from 'lucide-react';

interface RepositoryStatusDisplayProps {
  currentRepo: string | null;
  validationStatus: 'idle' | 'valid' | 'invalid';
}

const RepositoryStatusDisplay = ({ currentRepo, validationStatus }: RepositoryStatusDisplayProps) => {
  const getStatusIcon = () => {
    switch (validationStatus) {
      case 'valid':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'invalid':
        return <X className="h-4 w-4 text-red-500" />;
      default:
        return <GitBranch className="h-4 w-4 text-gray-400" />;
    }
  };

  if (!currentRepo) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
      {getStatusIcon()}
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
          Current Repository: {currentRepo}
        </p>
        <p className="text-xs text-gray-600 dark:text-gray-400">
          Checking this repository for new releases
        </p>
      </div>
    </div>
  );
};

export default RepositoryStatusDisplay;
