
import React from 'react';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, ImageIcon, Palette, Cloud, GitBranch, RotateCcw, Shield } from 'lucide-react';

const SettingsTabNavigation = () => {
  return (
    <TabsList className="grid w-full grid-cols-4 sm:grid-cols-7 h-auto p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
      <TabsTrigger 
        value="calendars" 
        className="flex flex-col items-center gap-1 p-2 text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-gray-900 dark:data-[state=active]:text-gray-100"
      >
        <Calendar className="h-4 w-4" />
        <span className="hidden sm:inline">Calendars</span>
      </TabsTrigger>
      
      <TabsTrigger 
        value="photos" 
        className="flex flex-col items-center gap-1 p-2 text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-gray-900 dark:data-[state=active]:text-gray-100"
      >
        <ImageIcon className="h-4 w-4" />
        <span className="hidden sm:inline">Photos</span>
      </TabsTrigger>
      
      <TabsTrigger 
        value="display" 
        className="flex flex-col items-center gap-1 p-2 text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-gray-900 dark:data-[state=active]:text-gray-100"
      >
        <Palette className="h-4 w-4" />
        <span className="hidden sm:inline">Display</span>
      </TabsTrigger>
      
      <TabsTrigger 
        value="weather" 
        className="flex flex-col items-center gap-1 p-2 text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-gray-900 dark:data-[state=active]:text-gray-100"
      >
        <Cloud className="h-4 w-4" />
        <span className="hidden sm:inline">Weather</span>
      </TabsTrigger>

      <TabsTrigger 
        value="notion" 
        className="flex flex-col items-center gap-1 p-2 text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-gray-900 dark:data-[state=active]:text-gray-100"
      >
        <GitBranch className="h-4 w-4" />
        <span className="hidden sm:inline">Notion</span>
      </TabsTrigger>
      
      <TabsTrigger 
        value="updates" 
        className="flex flex-col items-center gap-1 p-2 text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-gray-900 dark:data-[state=active]:text-gray-100"
      >
        <RotateCcw className="h-4 w-4" />
        <span className="hidden sm:inline">Updates</span>
      </TabsTrigger>
      
      <TabsTrigger 
        value="security" 
        className="flex flex-col items-center gap-1 p-2 text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-gray-900 dark:data-[state=active]:text-gray-100"
      >
        <Shield className="h-4 w-4" />
        <span className="hidden sm:inline">Security</span>
      </TabsTrigger>
    </TabsList>
  );
};

export default SettingsTabNavigation;
