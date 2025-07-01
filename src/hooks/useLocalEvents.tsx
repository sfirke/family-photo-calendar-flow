
import { useMemo } from 'react';
import { Event, ImportedEvent } from '@/types/calendar';
import { useLocalEventStorage } from './events/useLocalEventStorage';
import { useEventAggregation } from './events/useEventAggregation';
import { useEventImportExport } from './events/useEventImportExport';
import { useICalCalendars } from './useICalCalendars';
import { useNotionCalendars } from './useNotionCalendars';
import { LocalEventService } from '@/services/events/LocalEventService';

export const useLocalEvents = () => {
  // Use the new modular hooks
  const {
    localEvents,
    isLoading: localLoading,
    addEvent,
    updateEvent,
    deleteEvent,
    clearEvents,
    refreshEvents: refreshLocalEvents,
    saveEventsToStorage
  } = useLocalEventStorage();

  const { getICalEvents } = useICalCalendars();
  const { getNotionEvents } = useNotionCalendars();

  // Get events from other sources
  const icalEvents = getICalEvents();
  const notionEvents = getNotionEvents();

  // Check if we have any events first
  const hasAnyEvents = localEvents.length > 0 || icalEvents.length > 0 || notionEvents.length > 0;

  // Use event aggregation hook
  const {
    allEvents,
    eventsBySource,
    getEventsForDate,
    hasEvents
  } = useEventAggregation({
    localEvents,
    icalEvents,
    notionEvents,
    useSampleData: !hasAnyEvents
  });

  // Use import/export hook
  const {
    exportEvents,
    importEvents: importEventsFromFile,
    validateImportFile
  } = useEventImportExport();

  // Utility functions
  const refreshEvents = () => {
    refreshLocalEvents();
  };

  const resetToSampleEvents = () => {
    const sampleEvents = LocalEventService.initializeWithSampleEvents();
    refreshLocalEvents();
  };

  const exportEventsWrapper = () => {
    exportEvents(allEvents);
  };

  const importEvents = async (file: File): Promise<void> => {
    if (!validateImportFile(file)) {
      throw new Error('Invalid file format or size');
    }

    try {
      const importedEvents = await importEventsFromFile(file);
      saveEventsToStorage(importedEvents);
      refreshLocalEvents();
    } catch (error) {
      throw error;
    }
  };

  const clearCache = () => {
    clearEvents();
  };

  // Return optimized for compatibility with existing components
  const memoizedValue = useMemo(() => ({
    googleEvents: allEvents, // Keep same interface name for compatibility
    localEvents: allEvents, // Return combined events
    isLoading: localLoading,
    refreshEvents,
    addEvent,
    updateEvent,
    deleteEvent,
    resetToSampleEvents,
    exportEvents: exportEventsWrapper,
    importEvents,
    clearCache,
    // Additional utility functions
    eventsBySource,
    getEventsForDate,
    hasEvents
  }), [
    allEvents,
    localLoading,
    addEvent,
    updateEvent,
    deleteEvent,
    eventsBySource,
    getEventsForDate,
    hasEvents
  ]);

  return memoizedValue;
};
