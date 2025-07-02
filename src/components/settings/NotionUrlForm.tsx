
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Loader2, ExternalLink } from 'lucide-react';
import { NotionScrapedCalendar } from '@/services/notionScrapedEventsStorage';

interface NotionUrlFormProps {
  onCancel: () => void;
  onSuccess: () => void;
  addCalendar: (calendar: Omit<NotionScrapedCalendar, 'id' | 'type'>) => Promise<NotionScrapedCalendar>;
  validateNotionUrl: (url: string) => Promise<{ isValid: boolean; error?: string }>;
}

const defaultColors = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b',
  '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
];

const NotionUrlForm = ({ onCancel, onSuccess, addCalendar, validateNotionUrl }: NotionUrlFormProps) => {
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [color, setColor] = useState(defaultColors[0]);
  const [isValidating, setIsValidating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationResult, setValidationResult] = useState<{ isValid: boolean; error?: string } | null>(null);

  const handleValidate = async () => {
    if (!url.trim()) return;

    setIsValidating(true);
    setValidationResult(null);

    try {
      const result = await validateNotionUrl(url.trim());
      setValidationResult(result);
      
      // Auto-generate name from URL if not provided
      if (result.isValid && !name.trim()) {
        const urlParts = url.split('/');
        const lastPart = urlParts[urlParts.length - 1];
        const cleanName = lastPart.split('?')[0].replace(/-/g, ' ');
        setName(cleanName || 'Notion Calendar');
      }
    } catch (error) {
      setValidationResult({
        isValid: false,
        error: 'Failed to validate URL'
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validationResult?.isValid || !name.trim()) return;

    setIsSubmitting(true);

    try {
      await addCalendar({
        name: name.trim(),
        url: url.trim(),
        color,
        enabled: true,
        eventCount: 0
      });
      
      onSuccess();
    } catch (error) {
      console.error('Failed to add calendar:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isUrlValid = url.includes('notion.') && url.includes('http');
  const canValidate = isUrlValid && !isValidating;
  const canSubmit = validationResult?.isValid && name.trim() && !isSubmitting;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        <div>
          <Label htmlFor="notion-url" className="text-sm font-medium">
            Public Notion Page URL
          </Label>
          <div className="flex gap-2 mt-1">
            <Input
              id="notion-url"
              type="url"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setValidationResult(null);
              }}
              placeholder="https://www.notion.so/your-database-page"
              className="flex-1"
            />
            <Button
              type="button"
              onClick={handleValidate}
              disabled={!canValidate}
              size="sm"
              variant="outline"
            >
              {isValidating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ExternalLink className="h-4 w-4" />
              )}
            </Button>
          </div>
          
          {validationResult && (
            <div className="flex items-center gap-2 mt-2">
              {validationResult.isValid ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <Badge variant="outline" className="text-green-700 border-green-200 bg-green-50">
                    Valid
                  </Badge>
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 text-red-600" />
                  <Badge variant="outline" className="text-red-700 border-red-200 bg-red-50">
                    Invalid
                  </Badge>
                  {validationResult.error && (
                    <span className="text-xs text-red-600">{validationResult.error}</span>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        <div>
          <Label htmlFor="calendar-name" className="text-sm font-medium">
            Calendar Name
          </Label>
          <Input
            id="calendar-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My Notion Calendar"
            className="mt-1"
          />
        </div>

        <div>
          <Label className="text-sm font-medium">Color</Label>
          <div className="flex gap-2 mt-2">
            {defaultColors.map((colorOption) => (
              <button
                key={colorOption}
                type="button"
                onClick={() => setColor(colorOption)}
                className={`w-8 h-8 rounded-full border-2 ${
                  color === colorOption ? 'border-gray-900 dark:border-gray-100' : 'border-gray-300'
                }`}
                style={{ backgroundColor: colorOption }}
                aria-label={`Select color ${colorOption}`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button
          type="button"
          onClick={onCancel}
          variant="outline"
          size="sm"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!canSubmit}
          size="sm"
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              Adding...
            </>
          ) : (
            'Add Calendar'
          )}
        </Button>
      </div>
    </form>
  );
};

export default NotionUrlForm;
