
import React from 'react';
import { Button } from '@/components/ui/button';
import { Check, X, ExternalLink, GitBranch } from 'lucide-react';

interface RepositoryActionsProps {
  githubOwner: string;
  githubRepo: string;
  isValidating: boolean;
  onValidate: () => void;
  onClear: () => void;
  onOpenExample: () => void;
}

const RepositoryActions = ({
  githubOwner,
  githubRepo,
  isValidating,
  onValidate,
  onClear,
  onOpenExample
}: RepositoryActionsProps) => {
  return (
    <div className="flex gap-3">
      <Button
        onClick={onValidate}
        disabled={isValidating || !githubOwner.trim() || !githubRepo.trim()}
        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
      >
        {isValidating ? (
          <>
            <GitBranch className="h-4 w-4 mr-2 animate-pulse" />
            Validating...
          </>
        ) : (
          <>
            <Check className="h-4 w-4 mr-2" />
            Validate Repository
          </>
        )}
      </Button>

      {(githubOwner.trim() || githubRepo.trim()) && (
        <Button
          onClick={onClear}
          variant="outline"
          className="border-gray-300 dark:border-gray-600"
        >
          <X className="h-4 w-4 mr-2" />
          Clear
        </Button>
      )}

      <Button
        onClick={onOpenExample}
        variant="outline"
        size="sm"
        className="border-gray-300 dark:border-gray-600"
      >
        <ExternalLink className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default RepositoryActions;
