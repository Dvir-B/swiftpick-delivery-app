
-- Add soft delete capability to orders table
ALTER TABLE public.orders 
ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE NULL,
ADD COLUMN deleted_by UUID REFERENCES auth.users(id) NULL;

-- Create index for better performance when filtering deleted orders
CREATE INDEX idx_orders_deleted_at ON public.orders(deleted_at);

-- Update the RLS policies to handle deleted orders
DROP POLICY IF EXISTS "Users can manage their own orders" ON public.orders;

-- Create separate policies for better control
CREATE POLICY "Users can view their own orders" 
ON public.orders FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own orders" 
ON public.orders FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own orders" 
ON public.orders FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can soft delete their own orders" 
ON public.orders FOR UPDATE 
USING (auth.uid() = user_id AND deleted_at IS NULL);
