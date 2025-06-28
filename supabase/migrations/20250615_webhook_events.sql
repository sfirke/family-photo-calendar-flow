
-- Create webhook_events table to track Google Calendar webhook notifications
CREATE TABLE IF NOT EXISTS webhook_events (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  calendar_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  resource_state TEXT,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_webhook_events_user_id ON webhook_events(user_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_calendar_id ON webhook_events(calendar_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_created_at ON webhook_events(created_at);

-- Enable RLS
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to see their own webhook events
CREATE POLICY "Users can view their own webhook events" ON webhook_events
  FOR SELECT USING (auth.uid() = user_id);

-- Create policy to allow service role to insert webhook events
CREATE POLICY "Service role can insert webhook events" ON webhook_events
  FOR INSERT WITH CHECK (true);
