
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface RepositoryInputFormProps {
  githubOwner: string;
  githubRepo: string;
  onOwnerChange: (owner: string) => void;
  onRepoChange: (repo: string) => void;
}

const RepositoryInputForm = ({
  githubOwner,
  githubRepo,
  onOwnerChange,
  onRepoChange
}: RepositoryInputFormProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="github-owner" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Repository Owner
        </Label>
        <Input
          id="github-owner"
          type="text"
          placeholder="e.g., microsoft"
          value={githubOwner}
          onChange={(e) => onOwnerChange(e.target.value)}
          className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400">
          GitHub username or organization name
        </p>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="github-repo" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Repository Name
        </Label>
        <Input
          id="github-repo"
          type="text"
          placeholder="e.g., vscode"
          value={githubRepo}
          onChange={(e) => onRepoChange(e.target.value)}
          className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Repository name (without the owner)
        </p>
      </div>
    </div>
  );
};

export default RepositoryInputForm;
