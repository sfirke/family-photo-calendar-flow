
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Key, AlertCircle } from 'lucide-react';

interface NotionTokenInputProps {
  token: string;
  onTokenChange: (token: string) => void;
  onTest: () => Promise<void>;
  isValid?: boolean | null;
  error?: string;
}

const NotionTokenInput = ({ token, onTokenChange, onTest, isValid, error }: NotionTokenInputProps) => {
  const [showToken, setShowToken] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  const handleTest = async () => {
    setIsTesting(true);
    try {
      await onTest();
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="notion-token" className="text-gray-700 dark:text-gray-300 flex items-center gap-2">
          <Key className="h-4 w-4" />
          Notion Integration Token
        </Label>
        <div className="flex gap-2 mt-2">
          <div className="relative flex-1">
            <Input
              id="notion-token"
              type={showToken ? 'text' : 'password'}
              placeholder="secret_..."
              value={token}
              onChange={(e) => onTokenChange(e.target.value)}
              className="bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowToken(!showToken)}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <Button
            onClick={handleTest}
            disabled={!token.trim() || isTesting}
            variant="outline"
            className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600"
          >
            {isTesting ? 'Testing...' : 'Test'}
          </Button>
        </div>
      </div>

      {isValid === true && (
        <Alert className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800">
          <AlertCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription className="text-green-700 dark:text-green-300">
            Token is valid and working correctly!
          </AlertDescription>
        </Alert>
      )}

      {isValid === false && error && (
        <Alert className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800">
          <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
          <AlertDescription className="text-red-700 dark:text-red-300">
            {error}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default NotionTokenInput;
