import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin, ExternalLink, Tag, Flag, AlertCircle } from 'lucide-react';
import { NotionScrapedEvent } from '@/services/NotionPageScraper';

interface NotionEventModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: NotionScrapedEvent | null;
}

const NotionEventModal = ({ open, onOpenChange, event }: NotionEventModalProps) => {
  if (!event) return null;

  const handleOpenInNotion = () => {
    if (event.sourceUrl) {
      window.open(event.sourceUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (time?: string) => {
    if (!time) return 'All day';
    return time;
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'tentative':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 break-words">
                {event.title}
              </h2>
              <div className="flex items-center gap-2 mt-2 text-sm text-gray-600 dark:text-gray-400">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(event.date)}</span>
                <Clock className="h-4 w-4 ml-2" />
                <span>{formatTime(event.time)}</span>
              </div>
            </div>
            {event.sourceUrl && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenInNotion}
                className="flex items-center gap-2 flex-shrink-0"
              >
                <ExternalLink className="h-4 w-4" />
                Open in Notion
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status and Priority */}
          <div className="flex flex-wrap gap-2">
            {event.status && (
              <Badge className={getStatusColor(event.status)}>
                <AlertCircle className="h-3 w-3 mr-1" />
                {event.status}
              </Badge>
            )}
            {event.priority && (
              <Badge className={getPriorityColor(event.priority)}>
                <Flag className="h-3 w-3 mr-1" />
                {event.priority} Priority
              </Badge>
            )}
          </div>

          {/* Location */}
          {event.location && (
            <div className="space-y-2">
              <h3 className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Location
              </h3>
              <p className="text-gray-700 dark:text-gray-300 ml-6">{event.location}</p>
            </div>
          )}

          {/* Description */}
          {event.description && (
            <div className="space-y-2">
              <h3 className="font-medium text-gray-900 dark:text-gray-100">Description</h3>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {event.description}
              </p>
            </div>
          )}

          {/* Categories */}
          {event.categories && event.categories.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Categories
              </h3>
              <div className="flex flex-wrap gap-2 ml-6">
                {event.categories.map((category, index) => (
                  <Badge key={index} variant="secondary">
                    {category}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Custom Properties */}
          {event.customProperties && Object.keys(event.customProperties).length > 0 && (
            <div className="space-y-2">
              <h3 className="font-medium text-gray-900 dark:text-gray-100">Additional Details</h3>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 ml-6">
                {Object.entries(event.customProperties).map(([key, value]) => (
                  <div key={key} className="flex justify-between items-start py-1">
                    <span className="font-medium text-gray-600 dark:text-gray-400 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:
                    </span>
                    <span className="text-gray-800 dark:text-gray-200 ml-4 text-right max-w-xs break-words">
                      {String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Date Range */}
          {event.dateRange && event.dateRange.endDate && (
            <div className="space-y-2">
              <h3 className="font-medium text-gray-900 dark:text-gray-100">Duration</h3>
              <p className="text-gray-700 dark:text-gray-300 ml-6">
                {formatDate(event.dateRange.startDate)} - {formatDate(event.dateRange.endDate)}
              </p>
            </div>
          )}

          {/* Metadata */}
          <div className="border-t pt-4 mt-6">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Last synced: {event.scrapedAt.toLocaleString()}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NotionEventModal;