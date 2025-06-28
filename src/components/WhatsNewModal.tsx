
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, Calendar, Bug, Zap, Shield, Palette, Code } from 'lucide-react';
import { getCurrentVersion, getStoredVersion, setStoredVersion, getVersionType } from '@/utils/versionManager';
import { getChangesSince, type ChangeEntry } from '@/utils/changeTracker';

interface WhatsNewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const getChangeIcon = (type: ChangeEntry['type']) => {
  switch (type) {
    case 'feature': return <Sparkles className="h-4 w-4 text-blue-500" />;
    case 'bugfix': return <Bug className="h-4 w-4 text-red-500" />;
    case 'performance': return <Zap className="h-4 w-4 text-yellow-500" />;
    case 'security': return <Shield className="h-4 w-4 text-green-500" />;
    case 'ui': return <Palette className="h-4 w-4 text-purple-500" />;
    case 'refactor': return <Code className="h-4 w-4 text-gray-500" />;
    default: return <Calendar className="h-4 w-4 text-gray-500" />;
  }
};

const getChangeTypeLabel = (type: ChangeEntry['type']) => {
  switch (type) {
    case 'feature': return 'New Feature';
    case 'bugfix': return 'Bug Fix';
    case 'performance': return 'Performance';
    case 'security': return 'Security';
    case 'ui': return 'UI/UX';
    case 'refactor': return 'Code Quality';
    default: return 'Change';
  }
};

const WhatsNewModal = ({ open, onOpenChange }: WhatsNewModalProps) => {
  const [changes, setChanges] = useState<ChangeEntry[]>([]);
  const [versionType, setVersionType] = useState<'major' | 'minor' | 'patch'>('patch');
  const [currentVersion, setCurrentVersion] = useState<string>('1.0.0');
  
  const storedVersion = getStoredVersion() || '0.0.0';

  useEffect(() => {
    const loadVersionData = async () => {
      if (open) {
        const version = await getCurrentVersion();
        setCurrentVersion(version);
        
        const recentChanges = getChangesSince(storedVersion);
        setChanges(recentChanges);
        setVersionType(getVersionType(storedVersion, version));
      }
    };
    
    loadVersionData();
  }, [open, storedVersion]);

  const handleClose = async () => {
    const version = await getCurrentVersion();
    setStoredVersion(version);
    onOpenChange(false);
  };

  const getVersionBadgeColor = () => {
    switch (versionType) {
      case 'major': return 'bg-red-500 hover:bg-red-600';
      case 'minor': return 'bg-blue-500 hover:bg-blue-600';
      case 'patch': return 'bg-green-500 hover:bg-green-600';
    }
  };

  const getVersionTitle = () => {
    switch (versionType) {
      case 'major': return 'Major Update Available!';
      case 'minor': return 'New Features Added!';
      case 'patch': return 'App Updated!';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <Sparkles className="h-6 w-6 text-blue-500" />
            <div>
              <DialogTitle className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {getVersionTitle()}
              </DialogTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={`${getVersionBadgeColor()} text-white`}>
                  Version {currentVersion}
                </Badge>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {versionType.charAt(0).toUpperCase() + versionType.slice(1)} Release
                </span>
              </div>
            </div>
          </div>
          <DialogDescription className="text-gray-600 dark:text-gray-400">
            Here's what's new in this version of your family calendar app
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-96 pr-4">
          {changes.length > 0 ? (
            <div className="space-y-4">
              {changes.map((change) => (
                <div key={change.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800/50">
                  <div className="flex items-start gap-3">
                    {getChangeIcon(change.type)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">
                          {change.title}
                        </h4>
                        <Badge variant="outline" className="text-xs">
                          {getChangeTypeLabel(change.type)}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {change.description}
                      </p>
                      {change.files.length > 0 && (
                        <div className="text-xs text-gray-500 dark:text-gray-500">
                          Modified: {change.files.join(', ')}
                        </div>
                      )}
                      <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {new Date(change.timestamp).toLocaleDateString()} at {new Date(change.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Sparkles className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                Welcome to Version {currentVersion}!
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Your app has been updated with the latest improvements and features.
              </p>
            </div>
          )}
        </ScrollArea>

        <Separator />

        <div className="flex justify-between items-center pt-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Stay tuned for more updates!
          </div>
          <Button onClick={handleClose} className="bg-blue-500 hover:bg-blue-600 text-white">
            Get Started
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WhatsNewModal;
