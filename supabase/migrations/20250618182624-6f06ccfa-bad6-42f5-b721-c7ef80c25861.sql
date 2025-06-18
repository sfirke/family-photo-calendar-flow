
-- Add calendar_name column to calendar_events table
ALTER TABLE public.calendar_events 
ADD COLUMN calendar_name text;
