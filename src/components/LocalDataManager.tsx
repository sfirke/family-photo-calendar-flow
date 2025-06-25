
import React, { useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Upload, Trash2, HardDrive } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { localDataManager } from '@/utils/localDataManager';

const LocalDataManager = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleExport = () => {
    try {
      localDataManager.exportAllData();
      toast({
        title: "Data exported",
        description: "Your calendar data has been downloaded as a backup file.",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export your data. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      await localDataManager.importAllData(file);
      toast({
        title: "Data imported",
        description: "Your calendar data has been restored from the backup file.",
      });
      // Reload the page to reflect imported data
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "Failed to import data.",
        variant: "destructive"
      });
    }
    
    // Clear the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClearData = () => {
    if (window.confirm('Are you sure you want to clear all calendar data? This action cannot be undone.')) {
      localDataManager.clearAllData();
      toast({
        title: "Data cleared",
        description: "All calendar data has been removed.",
      });
      // Reload the page to reflect cleared data
      setTimeout(() => window.location.reload(), 1000);
    }
  };

  const storageUsage = localDataManager.getStorageUsage();
  const usagePercentage = (storageUsage.used / storageUsage.total) * 100;

  return (
    <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
          <HardDrive className="h-5 w-5" />
          Local Data Management
        </CardTitle>
        <CardDescription className="text-gray-600 dark:text-gray-400">
          Backup, restore, and manage your local calendar data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Storage Usage */}
        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Storage Usage</span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {(storageUsage.used / 1024).toFixed(1)} KB of {(storageUsage.total / 1024 / 1024).toFixed(1)} MB
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(usagePercentage, 100)}%` }}
            />
          </div>
        </div>

        {/* Data Management Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Button
            onClick={handleExport}
            variant="outline"
            className="flex items-center gap-2 bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border-blue-300 dark:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
          >
            <Download className="h-4 w-4" />
            Export Backup
          </Button>

          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            className="flex items-center gap-2 bg-white dark:bg-gray-800 text-green-600 dark:text-green-400 border-green-300 dark:border-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
          >
            <Upload className="h-4 w-4" />
            Import Backup
          </Button>

          <Button
            onClick={handleClearData}
            variant="outline"
            className="flex items-center gap-2 bg-white dark:bg-gray-800 text-red-600 dark:text-red-400 border-red-300 dark:border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <Trash2 className="h-4 w-4" />
            Clear All Data
          </Button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleImport}
          className="hidden"
        />

        <div className="p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Note:</strong> All your calendar data is stored locally in your browser. 
            Regular backups are recommended to prevent data loss.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default LocalDataManager;
