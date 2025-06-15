
-- This migration script handles three main tasks:
-- 1. Adds an 'error' status to the order_status type for better error tracking.
-- 2. Creates a new 'order_logs' table to log all significant activities related to an order, as requested.
-- 3. Secures the 'orders' and 'order_logs' tables with Row Level Security for enhanced data protection.

-- Step 1: Safely add the 'error' value to the 'order_status' enum type.
-- The safest method is to rename the old type, create the new one, update the table, and then drop the old type.

-- Rename the existing order_status type
ALTER TYPE public.order_status RENAME TO order_status_old;

-- Create the new order_status type including the 'error' value
CREATE TYPE public.order_status AS ENUM ('pending', 'processed', 'shipped', 'delivered', 'error');

-- Update the 'orders' table to use the new type.
-- This casts the old values to text and then to the new enum type.
ALTER TABLE public.orders 
ALTER COLUMN status TYPE public.order_status 
USING status::text::public.order_status;

-- Drop the old, now unused, order_status type
DROP TYPE public.order_status_old;


-- Step 2: Create the 'order_logs' table.
-- This table will store a history of actions for each order.
CREATE TABLE public.order_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL, -- e.g., 'status_change', 'shipment_creation_failed', 'shipment_created'
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add a comment to describe the table's purpose
COMMENT ON TABLE public.order_logs IS 'Logs activities related to orders, such as status changes and errors.';


-- Step 3: Enable Row Level Security (RLS) and define policies.
-- This is crucial for security in a multi-tenant application.

-- Enable RLS on the new order_logs table
ALTER TABLE public.order_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Allow users to view their own logs.
CREATE POLICY "Users can view their own order logs"
ON public.order_logs
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Allow users to create logs associated with their user_id.
CREATE POLICY "Users can insert their own order logs"
ON public.order_logs
FOR INSERT
WITH CHECK (auth.uid() = user_id);


-- Also secure the 'orders' table with RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Cleanup existing policies on orders table if any, to avoid conflicts. This is a safeguard.
DROP POLICY IF EXISTS "Users can manage their own orders" ON public.orders;

-- Policy: Allow users full access (SELECT, INSERT, UPDATE, DELETE) to their own orders.
CREATE POLICY "Users can manage their own orders"
ON public.orders
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

