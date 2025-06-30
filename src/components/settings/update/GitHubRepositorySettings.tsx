
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { GitBranch, Check, X, ExternalLink, Info } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';
import { getRepositoryDisplayName, fetchGitHubReleases } from '@/utils/upstreamVersionManager';
import { useToast } from '@/hooks/use-toast';

const GitHubRepositorySettings = () => {
  const { githubOwner, setGithubOwner, githubRepo, setGithubRepo } = useSettings();
  const { toast } = useToast();
  
  const [isValidating, setIsValidating] = useState(false);
  const [validationStatus, setValidationStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');
  const [currentRepo, setCurrentRepo] = useState<string | null>(null);

  useEffect(() => {
    const loadCurrentRepo = async () => {
      const repoName = await getRepositoryDisplayName();
      setCurrentRepo(repoName);
    };
    loadCurrentRepo();
  }, [githubOwner, githubRepo]);

  const validateRepository = async () => {
    if (!githubOwner.trim() || !githubRepo.trim()) {
      setValidationStatus('idle');
      return;
    }

    setIsValidating(true);
    setValidationStatus('idle');

    try {
      // Temporarily set the values to test the repository
      const originalOwner = githubOwner;
      const originalRepo = githubRepo;
      
      const release = await fetchGitHubReleases();
      
      if (release) {
        setValidationStatus('valid');
        toast({
          title: "Repository Valid",
          description: `Successfully found releases for ${githubOwner}/${githubRepo}`,
          variant: "success",
        });
      } else {
        setValidationStatus('invalid');
        toast({
          title: "Repository Not Found",
          description: `No releases found for ${githubOwner}/${githubRepo}. Check the repository name and ensure it has releases.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      setValidationStatus('invalid');
      toast({
        title: "Validation Failed",
        description: "Failed to validate repository. Please check your internet connection and try again.",
        variant: "destructive",
      });
    } finally {
      setIsValidating(false);
    }
  };

  const clearRepository = () => {
    setGithubOwner('');
    setGithubRepo('');
    setValidationStatus('idle');
    toast({
      title: "Repository Cleared",
      description: "GitHub repository configuration has been cleared.",
      variant: "default",
    });
  };

  const openGitHubExample = () => {
    window.open('https://github.com/owner/repository-name', '_blank');
  };

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
        {currentRepo && (
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
        )}

        {/* Repository Input Fields */}
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
              onChange={(e) => setGithubOwner(e.target.value)}
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
              onChange={(e) => setGithubRepo(e.target.value)}
              className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Repository name (without the owner)
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={validateRepository}
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
              onClick={clearRepository}
              variant="outline"
              className="border-gray-300 dark:border-gray-600"
            >
              <X className="h-4 w-4 mr-2" />
              Clear
            </Button>
          )}

          <Button
            onClick={openGitHubExample}
            variant="outline"
            size="sm"
            className="border-gray-300 dark:border-gray-600"
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>

        {/* Help Information */}
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
      </CardContent>
    </Card>
  );
};

export default GitHubRepositorySettings;
