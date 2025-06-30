
import { useState } from 'react';
import { validateRepository } from '@/utils/github/gitHubApi';
import { useToast } from '@/hooks/use-toast';

export const useRepositoryValidation = () => {
  const [isValidating, setIsValidating] = useState(false);
  const [validationStatus, setValidationStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');
  const { toast } = useToast();

  const validateRepo = async (owner: string, repo: string) => {
    if (!owner.trim() || !repo.trim()) {
      setValidationStatus('idle');
      return;
    }

    setIsValidating(true);
    setValidationStatus('idle');

    try {
      const isValid = await validateRepository({ owner, repo });
      
      if (isValid) {
        setValidationStatus('valid');
        toast({
          title: "Repository Valid",
          description: `Successfully found releases for ${owner}/${repo}`,
          variant: "success",
        });
      } else {
        setValidationStatus('invalid');
        toast({
          title: "Repository Not Found",
          description: `No releases found for ${owner}/${repo}. Check the repository name and ensure it has releases.`,
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

  return {
    isValidating,
    validationStatus,
    validateRepo,
    setValidationStatus
  };
};
