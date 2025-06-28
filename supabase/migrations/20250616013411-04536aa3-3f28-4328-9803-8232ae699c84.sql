
-- Add is_all_day column to calendar_events table
ALTER TABLE public.calendar_events 
ADD COLUMN is_all_day BOOLEAN DEFAULT false;
