
import React from 'react';
import { Event } from '@/types/calendar';
import { Clock, MapPin } from 'lucide-react';

interface EventCardProps {
  event: Event;
  className?: string;
  showBoldHeader?: boolean;
}

const EventCard = ({ event, className = '', showBoldHeader = false }: EventCardProps) => {
  return (
    <div className={`p-3 rounded-lg bg-white/95 backdrop-blur-sm border border-white/30 ${className}`}>
      <h4 className={`${showBoldHeader ? 'font-bold' : 'font-medium'} text-gray-900 mb-1 leading-tight`}>
        {event.title}
      </h4>
      
      <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
        <Clock className="h-3 w-3" />
        <span>{event.time}</span>
      </div>
      
      {event.location && (
        <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
          <MapPin className="h-3 w-3" />
          <span className="truncate">{event.location}</span>
        </div>
      )}
      
      <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${event.color} text-white`}>
        {event.category}
      </div>
    </div>
  );
};

export default EventCard;
