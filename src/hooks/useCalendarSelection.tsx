 
import { useContext } from 'react';
import { CalendarSelectionContext } from './CalendarSelectionContext';

export const useCalendarSelection = () => {
  const ctx = useContext(CalendarSelectionContext);
  if (!ctx) throw new Error('useCalendarSelection must be used within a CalendarSelectionProvider');
  return ctx;
};

export default useCalendarSelection;
