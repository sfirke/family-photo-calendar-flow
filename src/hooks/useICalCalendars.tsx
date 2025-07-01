
/**
 * iCal Calendars Hook - Refactored
 * 
 * Main hook for iCal calendar management using new modular architecture
 */

import { useEffect, useMemo } from 'react';
import { Event } from '@/types/calendar';
import { useICalCalendarManagement } from './ical/useICalCalendarManagement';
import { useICalSyncCoordinator } from './ical/useICalSyncCoordinator';
import { useICalValidation } from './ical/useICalValidation';

export const useICalCalendars = () => {
  // Use the new modular hooks
  const {
    calendars,
    isLoading: calendarsLoading,
    addCalendar,
    updateCalendar,
    deleteCalendar,
    loadCalendars,
    toggleCalendar
  } = useICalCalendarManagement();

  const {
    syncStatus,
    lastSyncTime,
    syncError,
    syncCalendar,
    syncAllCalendars,
    resetSyncStatus
  } = useICalSyncCoordinator();

  const {
    validationStatus,
    validationError,
    validateUrl,
    validateCalendarData,
    resetValidation
  } = useICalValidation();

  // Load calendars on mount
  useEffect(() => {
    loadCalendars();
  }, [loadCalendars]);

  // Get events from enabled calendars
  const getICalEvents = (): Event[] => {
    // This would typically return cached events from the last sync
    // For now, return empty array as events are fetched during sync
    return [];
  };

  // Memoized return value for performance
  const memoizedValue = useMemo(() => ({
    // Calendar management
    calendars,
    isLoading: calendarsLoading,
    addCalendar,
    updateCalendar,
    deleteCalendar,
    removeCalendar: deleteCalendar, // Alias for backward compatibility
    toggleCalendar,
    refreshCalendars: loadCalendars,
    
    // Sync management
    syncStatus: {},
    lastSyncTime,
    syncError,
    syncCalendar,
    syncAllCalendars: () => syncAllCalendars(calendars),
    resetSyncStatus,
    
    // Validation
    validationStatus,
    validationError,
    validateUrl,
    validateCalendarData,
    resetValidation,
    
    // Event access
    getICalEvents,
    
    // Computed values
    enabledCalendarsCount: calendars.filter(cal => cal.enabled).length,
    totalCalendarsCount: calendars.length,
    hasCalendars: calendars.length > 0
  }), [
    calendars,
    calendarsLoading,
    addCalendar,
    updateCalendar,
    deleteCalendar,
    toggleCalendar,
    loadCalendars,
    syncStatus,
    lastSyncTime,
    syncError,
    syncCalendar,
    syncAllCalendars,
    resetSyncStatus,
    validationStatus,
    validationError,
    validateUrl,
    validateCalendarData,
    resetValidation
  ]);

  return memoizedValue;
};
