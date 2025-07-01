
/**
 * Notion Calendars Hook - Refactored
 * 
 * Main hook for Notion calendar management using new modular architecture
 */

import { useNotionCalendarManager } from './notion/useNotionCalendarManager';

export const useNotionCalendars = () => {
  // Delegate to the new modular hook
  return useNotionCalendarManager();
};
