
import React from 'react';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Camera, Monitor, CloudSun, Calendar, Shield } from 'lucide-react';

const SettingsTabNavigation = () => {
  return (
    <TabsList className="grid w-full grid-cols-3 sm:grid-cols-5 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 h-auto p-1">
      <TabsTrigger 
        value="calendars" 
        className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300 data-[state=active]:bg-white data-[state=active]:text-gray-900 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-gray-100 py-2 sm:py-3"
      >
        <Calendar className="h-4 w-4" />
        <span className="hidden sm:inline">Calendars</span>
        <span className="sm:hidden">Cal</span>
      </TabsTrigger>
      
      <TabsTrigger 
        value="photos" 
        className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300 data-[state=active]:bg-white data-[state=active]:text-gray-900 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-gray-100 py-2 sm:py-3"
      >
        <Camera className="h-4 w-4" />
        <span className="hidden sm:inline">Photos</span>
        <span className="sm:hidden">Pic</span>
      </TabsTrigger>
      
      <TabsTrigger 
        value="display" 
        className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300 data-[state=active]:bg-white data-[state=active]:text-gray-900 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-gray-100 py-2 sm:py-3"
      >
        <Monitor className="h-4 w-4" />
        <span className="hidden sm:inline">Display</span>
        <span className="sm:hidden">Disp</span>
      </TabsTrigger>
      
      <TabsTrigger 
        value="weather" 
        className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300 data-[state=active]:bg-white data-[state=active]:text-gray-900 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-gray-100 py-2 sm:py-3"
      >
        <CloudSun className="h-4 w-4" />
        <span className="hidden sm:inline">Weather</span>
        <span className="sm:hidden">Wthr</span>
      </TabsTrigger>
      
      <TabsTrigger 
        value="security" 
        className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300 data-[state=active]:bg-white data-[state=active]:text-gray-900 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-gray-100 py-2 sm:py-3"
      >
        <Shield className="h-4 w-4" />
        <span className="hidden sm:inline">Security</span>
        <span className="sm:hidden">Sec</span>
      </TabsTrigger>
    </TabsList>
  );
};

export default SettingsTabNavigation;
