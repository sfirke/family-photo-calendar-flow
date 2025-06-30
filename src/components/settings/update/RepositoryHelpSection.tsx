
import React from 'react';
import { Info } from 'lucide-react';

const RepositoryHelpSection = () => {
  return (
    <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/30 p-3 rounded-lg">
      <div className="flex items-start gap-2">
        <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
        <div className="space-y-1">
          <p className="font-medium">How to find repository information:</p>
          <p>1. Go to the GitHub repository page</p>
          <p>2. The URL format is: github.com/[owner]/[repository-name]</p>
          <p>3. Enter the owner and repository name in the fields above</p>
          <p className="mt-2 font-medium">Example:</p>
          <p>For https://github.com/microsoft/vscode:</p>
          <p>• Owner: microsoft</p>
          <p>• Repository: vscode</p>
        </div>
      </div>
    </div>
  );
};

export default RepositoryHelpSection;
