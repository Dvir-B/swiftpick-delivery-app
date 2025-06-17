
-- Create webhook_logs table for debugging
CREATE TABLE public.webhook_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  platform TEXT NOT NULL DEFAULT 'wix',
  event_type TEXT,
  payload JSONB,
  processed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID REFERENCES auth.users(id),
  error_message TEXT
);

-- Enable RLS
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own webhook logs
CREATE POLICY "Users can view their webhook logs"
ON public.webhook_logs
FOR SELECT
USING (user_id = auth.uid() OR user_id IS NULL);

-- Allow system to insert webhook logs
CREATE POLICY "Allow webhook log inserts"
ON public.webhook_logs
FOR INSERT
WITH CHECK (true);
