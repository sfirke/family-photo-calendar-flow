
import CalendarSelector from '../CalendarSelector';
import ViewSwitcher from './ViewSwitcher';

interface CalendarHeaderProps {
  hasGoogleEvents: boolean;
  view: 'timeline' | 'week' | 'month';
  onViewChange: (view: 'timeline' | 'week' | 'month') => void;
}

const CalendarHeader = ({
  hasGoogleEvents,
  view,
  onViewChange
}: CalendarHeaderProps) => {
  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Responsive calendar controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-end gap-3 sm:gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
          {hasGoogleEvents && (
            <div className="w-full sm:w-auto">
              <CalendarSelector />
            </div>
          )}
          
          <div className="w-full sm:w-auto">
            <ViewSwitcher view={view} onViewChange={onViewChange} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarHeader;
