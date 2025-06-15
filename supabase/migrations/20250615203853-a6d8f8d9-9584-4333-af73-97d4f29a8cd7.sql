
-- טבלת Webhook Settings לכל משתמש  
CREATE TABLE public.webhook_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL DEFAULT 'wix',
  webhook_url TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- לאפשר Row Level Security
ALTER TABLE public.webhook_settings ENABLE ROW LEVEL SECURITY;

-- הרשאת SELECT רק לעצמי
CREATE POLICY "Users can view their webhook settings"
ON public.webhook_settings
FOR SELECT
USING (user_id = auth.uid());

-- הרשאת INSERT רק לעצמי  
CREATE POLICY "Users can create their webhook settings"
ON public.webhook_settings
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- הרשאת UPDATE רק לעצמי  
CREATE POLICY "Users can update their webhook settings"
ON public.webhook_settings
FOR UPDATE
USING (user_id = auth.uid());

-- הרשאת DELETE רק לעצמי (אם תרצה למחוק בעתיד)
CREATE POLICY "Users can delete their webhook settings"
ON public.webhook_settings
FOR DELETE
USING (user_id = auth.uid());
