
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
        "bg-white/80 backdrop-blur-sm border-white/20 p-6 hover:bg-white/90 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg cursor-pointer",
        className
      )}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-medium text-white">{event.title}</h3>
            <Badge 
              variant="secondary" 
              className={cn(
                "text-white text-xs px-2 py-1",
                event.color
              )}
            >
              {event.category}
            </Badge>
          </div>
          
          <div className="space-y-2 text-sm text-white/80">
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
            <div className="mt-4 pt-4 border-t border-white/20 space-y-3 animate-fade-in">
              {event.description && (
                <div>
                  <h4 className="font-medium text-white mb-2">Description</h4>
                  <p className="text-sm text-white/80">{event.description}</p>
                </div>
              )}
              {event.organizer && (
                <div>
                  <h4 className="font-medium text-white mb-2">Organizer</h4>
                  <p className="text-sm text-white/80">{event.organizer}</p>
                </div>
              )}
              <div>
                <h4 className="font-medium text-white mb-2">Event Details</h4>
                <div className="text-sm text-white/80 space-y-1">
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
            <ChevronUp className="h-5 w-5 text-white/60" /> : 
            <ChevronDown className="h-5 w-5 text-white/60" />
          }
        </div>
      </div>
    </Card>
  );
};

export default EventCard;
