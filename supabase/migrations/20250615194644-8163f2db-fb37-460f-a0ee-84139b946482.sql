
-- הוספת עמודות חדשות לטבלת orders עבור פלואו PDQ
ALTER TABLE public.orders 
ADD COLUMN picker_id UUID NULL REFERENCES auth.users(id),
ADD COLUMN shipping_carrier_id UUID NULL,
ADD COLUMN warehouse_id UUID NULL,
ADD COLUMN tracking_number TEXT NULL,
ADD COLUMN label_url TEXT NULL;

-- יצירת טבלת pickers למלקטים
CREATE TABLE public.pickers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- יצירת טבלת shipping_carriers לחברות שילוח
CREATE TABLE public.shipping_carriers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  api_endpoint TEXT,
  api_key TEXT,
  carrier_code TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- יצירת טבלת warehouses למחסנים
CREATE TABLE public.warehouses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- יצירת טבלת batches לאצוות
CREATE TABLE public.batches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  batch_number TEXT NOT NULL,
  pickup_date DATE,
  carrier_id UUID REFERENCES public.shipping_carriers(id),
  fulfilled_count INTEGER DEFAULT 0,
  total_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'created',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- עדכון enum של סטטוס הזמנות
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'in_process';

-- הוספת RLS policies לטבלאות החדשות
ALTER TABLE public.pickers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_carriers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;

-- Policies עבור pickers
CREATE POLICY "Users can view their own pickers"
ON public.pickers FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own pickers"
ON public.pickers FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pickers"
ON public.pickers FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pickers"
ON public.pickers FOR DELETE
USING (auth.uid() = user_id);

-- Policies עבור shipping_carriers
CREATE POLICY "Users can view their own shipping carriers"
ON public.shipping_carriers FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own shipping carriers"
ON public.shipping_carriers FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own shipping carriers"
ON public.shipping_carriers FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own shipping carriers"
ON public.shipping_carriers FOR DELETE
USING (auth.uid() = user_id);

-- Policies עבור warehouses
CREATE POLICY "Users can view their own warehouses"
ON public.warehouses FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own warehouses"
ON public.warehouses FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own warehouses"
ON public.warehouses FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own warehouses"
ON public.warehouses FOR DELETE
USING (auth.uid() = user_id);

-- Policies עבור batches
CREATE POLICY "Users can view their own batches"
ON public.batches FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own batches"
ON public.batches FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own batches"
ON public.batches FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own batches"
ON public.batches FOR DELETE
USING (auth.uid() = user_id);
