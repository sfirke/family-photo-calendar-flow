
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GitBranch } from 'lucide-react';
import { useSettings } from '@/contexts/settings/SettingsContext';
import { getRepositoryDisplayName } from '@/utils/upstreamVersionManager';
import { useRepositoryValidation } from '@/hooks/useRepositoryValidation';
import { useToast } from '@/hooks/use-toast';
import RepositoryInputForm from './RepositoryInputForm';
import RepositoryStatusDisplay from './RepositoryStatusDisplay';
import RepositoryActions from './RepositoryActions';
import RepositoryHelpSection from './RepositoryHelpSection';

const GitHubRepositorySettings = () => {
  const { githubOwner, setGithubOwner, githubRepo, setGithubRepo } = useSettings();
  const { toast } = useToast();
  const { isValidating, validationStatus, validateRepo, setValidationStatus } = useRepositoryValidation();
  
  const [currentRepo, setCurrentRepo] = useState<string | null>(null);

  useEffect(() => {
    const loadCurrentRepo = async () => {
      const repoName = await getRepositoryDisplayName();
      setCurrentRepo(repoName);
    };
    loadCurrentRepo();
  }, [githubOwner, githubRepo]);

  const handleValidate = () => {
    validateRepo(githubOwner, githubRepo);
  };

  const handleClear = () => {
    setGithubOwner('');
    setGithubRepo('');
    setValidationStatus('idle');
    toast({
      title: "Repository Cleared",
      description: "GitHub repository configuration has been cleared.",
      variant: "default",
    });
  };

  const handleOpenExample = () => {
    window.open('https://github.com/owner/repository-name', '_blank');
  };

  return (
    <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2 text-gray-900 dark:text-gray-100">
          <GitBranch className="h-5 w-5" />
          GitHub Repository
        </CardTitle>
        <CardDescription className="text-gray-600 dark:text-gray-400">
          Configure which GitHub repository to check for new releases
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Configuration Display */}
        <RepositoryStatusDisplay 
          currentRepo={currentRepo}
          validationStatus={validationStatus}
        />

        {/* Repository Input Fields */}
        <RepositoryInputForm
          githubOwner={githubOwner}
          githubRepo={githubRepo}
          onOwnerChange={setGithubOwner}
          onRepoChange={setGithubRepo}
        />

        {/* Action Buttons */}
        <RepositoryActions
          githubOwner={githubOwner}
          githubRepo={githubRepo}
          isValidating={isValidating}
          onValidate={handleValidate}
          onClear={handleClear}
          onOpenExample={handleOpenExample}
        />

        {/* Help Information */}
        <RepositoryHelpSection />
      </CardContent>
    </Card>
  );
};

export default GitHubRepositorySettings;
