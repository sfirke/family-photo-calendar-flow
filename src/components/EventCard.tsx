
import React from 'react';
import { Clock, MapPin, Users } from 'lucide-react';
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
}

interface EventCardProps {
  event: Event;
  className?: string;
}

const EventCard = ({ event, className }: EventCardProps) => {
  return (
    <Card className={cn(
      "bg-white/95 backdrop-blur-sm border-white/20 p-6 hover:bg-white/100 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg",
      className
    )}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-medium text-gray-900">{event.title}</h3>
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
          
          <div className="space-y-2 text-sm text-gray-600">
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
        </div>
      </div>
    </Card>
  );
};

export default EventCard;
