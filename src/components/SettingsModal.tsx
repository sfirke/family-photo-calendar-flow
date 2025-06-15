
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Camera, Monitor, CloudSun, X } from 'lucide-react';
import AccountTab from './settings/AccountTab';
import PhotosTab from './settings/PhotosTab';
import DisplayTab from './settings/DisplayTab';
import WeatherTab from './settings/WeatherTab';

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  zipCode: string;
  onZipCodeChange: (zipCode: string) => void;
}

const SettingsModal = ({ open, onOpenChange, zipCode, onZipCodeChange }: SettingsModalProps) => {
  const [tempZipCode, setTempZipCode] = useState(zipCode);

  const handleSave = () => {
    onZipCodeChange(tempZipCode);
    onOpenChange(false);
  };

  const handleCancel = () => {
    setTempZipCode(zipCode);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>App Settings</DialogTitle>
              <DialogDescription>
                Configure your family calendar app preferences and connect your Google account
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <Tabs defaultValue="account" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="account" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Account
            </TabsTrigger>
            <TabsTrigger value="photos" className="flex items-center gap-2">
              <Camera className="h-4 w-4" />
              Photos
            </TabsTrigger>
            <TabsTrigger value="display" className="flex items-center gap-2">
              <Monitor className="h-4 w-4" />
              Display
            </TabsTrigger>
            <TabsTrigger value="weather" className="flex items-center gap-2">
              <CloudSun className="h-4 w-4" />
              Weather
            </TabsTrigger>
          </TabsList>

          <TabsContent value="account" className="space-y-4">
            <AccountTab />
          </TabsContent>

          <TabsContent value="photos" className="space-y-4">
            <PhotosTab />
          </TabsContent>

          <TabsContent value="display" className="space-y-4">
            <DisplayTab />
          </TabsContent>

          <TabsContent value="weather" className="space-y-4">
            <WeatherTab 
              zipCode={tempZipCode}
              onZipCodeChange={setTempZipCode}
            />
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Settings
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsModal;
