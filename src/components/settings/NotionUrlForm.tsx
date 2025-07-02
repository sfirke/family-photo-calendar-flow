import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, ExternalLink, Bug, Eye } from 'lucide-react';

interface NotionUrlFormProps {
  onSubmit: (data: { name: string; url: string; color: string }) => Promise<void>;
  onCancel: () => void;
  validateUrl: (url: string) => Promise<{ isValid: boolean; error?: string }>;
  showDebugButton?: boolean;
  onDebugPreview?: (url: string) => void;
}

export const NotionUrlForm: React.FC<NotionUrlFormProps> = ({ 
  onSubmit, 
  onCancel, 
  validateUrl,
  showDebugButton = false,
  onDebugPreview
}) => {
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    color: '#3b82f6'
  });
  const [isValidating, setIsValidating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationResult, setValidationResult] = useState<{ isValid: boolean; error?: string } | null>(null);

  const handleUrlChange = (url: string) => {
    setFormData(prev => ({ ...prev, url }));
    setValidationResult(null);
  };

  const handleValidate = async () => {
    if (!formData.url.trim()) return;

    setIsValidating(true);
    try {
      const result = await validateUrl(formData.url);
      setValidationResult(result);
      
      // Auto-generate name if validation is successful and name is empty
      if (result.isValid && !formData.name.trim()) {
        const urlParts = formData.url.split('/');
        const lastPart = urlParts[urlParts.length - 1];
        const suggestedName = lastPart.split('?')[0].split('-').slice(0, -1).join(' ') || 'Notion Calendar';
        setFormData(prev => ({ ...prev, name: suggestedName }));
      }
    } catch (error) {
      setValidationResult({ isValid: false, error: 'Validation failed' });
    } finally {
      setIsValidating(false);
    }
  };

  const handleDebugPreview = () => {
    if (formData.url.trim() && onDebugPreview) {
      onDebugPreview(formData.url);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validationResult?.isValid) {
      await handleValidate();
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Form submission failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = formData.name.trim() && formData.url.trim() && validationResult?.isValid;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="url">Notion Page URL</Label>
        <div className="flex gap-2">
          <Input
            id="url"
            type="url"
            placeholder="https://notion.so/your-database-page"
            value={formData.url}
            onChange={(e) => handleUrlChange(e.target.value)}
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleValidate}
            disabled={!formData.url.trim() || isValidating}
          >
            {isValidating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Validate'
            )}
          </Button>
        </div>
        
        {/* Validation Result */}
        {validationResult && (
          <div className={`p-3 rounded-md text-sm ${
            validationResult.isValid 
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {validationResult.isValid ? (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-green-100 text-green-800">Valid</Badge>
                <span>Notion page is accessible and ready to import</span>
              </div>
            ) : (
              <div>
                <Badge variant="destructive" className="mb-2">Invalid</Badge>
                <p>{validationResult.error}</p>
              </div>
            )}
          </div>
        )}

        {/* Debug Preview Button */}
        {showDebugButton && formData.url.trim() && (
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDebugPreview}
              className="flex items-center gap-2"
            >
              <Bug className="h-3 w-3" />
              Debug Preview
            </Button>
            <p className="text-xs text-muted-foreground self-center">
              See exactly what data will be extracted from this page
            </p>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Calendar Name</Label>
        <Input
          id="name"
          placeholder="My Notion Calendar"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="color">Color</Label>
        <div className="flex items-center gap-2">
          <Input
            id="color"
            type="color"
            value={formData.color}
            onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
            className="w-16 h-10"
          />
          <span className="text-sm text-muted-foreground">{formData.color}</span>
        </div>
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={!canSubmit || isSubmitting}
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : null}
          Add Calendar
        </Button>
      </div>

      {/* Help Text */}
      <div className="text-xs text-muted-foreground space-y-1">
        <p>• Make sure your Notion page is shared publicly</p>
        <p>• Your database should have at least a title and date column</p>
        <p>• Copy the full URL from your browser address bar</p>
      </div>
    </form>
  );
};
