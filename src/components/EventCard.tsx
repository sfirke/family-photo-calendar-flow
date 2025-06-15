
import React, { useState } from 'react';
import { Clock, MapPin, Users, ChevronDown, ChevronUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Event {
  id: number;
  title: string;
  time: string;
  location: string;
  attendees: number;
  category: string;
  color: string;
  description?: string;
  organizer?: string;
}

interface EventCardProps {
  event: Event;
  className?: string;
}

const EventCard = ({ event, className }: EventCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card 
      className={cn(
        "bg-white/80 backdrop-blur-sm border-white/20 p-6 hover:bg-white/90 transition-colors duration-200 cursor-pointer dark:bg-gray-800/80 dark:border-gray-700/20 dark:hover:bg-gray-800/90",
        className
      )}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-medium text-gray-900 dark:text-gray-100">{event.title}</h3>
            <Badge 
              variant="secondary" 
              className={cn(
                "text-white text-xs px-2 py-1 font-medium",
                event.color
              )}
            >
              {event.category}
            </Badge>
          </div>
          
          <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>{event.time}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span>{event.location}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>{event.attendees} attendee{event.attendees !== 1 ? 's' : ''}</span>
            </div>
          </div>

          {isExpanded && (
            <div className="mt-4 pt-4 border-t border-gray-200/50 dark:border-gray-600/50 space-y-3 animate-fade-in">
              {event.description && (
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Description</h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{event.description}</p>
                </div>
              )}
              {event.organizer && (
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Organizer</h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{event.organizer}</p>
                </div>
              )}
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Event Details</h4>
                <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                  <p>Duration: {event.time}</p>
                  <p>Category: {event.category}</p>
                  <p>Location: {event.location}</p>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="ml-4">
          {isExpanded ? 
            <ChevronUp className="h-5 w-5 text-gray-600 dark:text-gray-400" /> : 
            <ChevronDown className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          }
        </div>
      </div>
    </Card>
  );
};

export default EventCard;
