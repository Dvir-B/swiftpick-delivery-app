
-- Clean up any potentially conflicting RLS policies on the public.profiles table
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Select own profile" ON public.profiles;
DROP POLICY IF EXISTS "Insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Update own profile" ON public.profiles;

-- 1️⃣ Enable Row Level Security (RLS) on the table.
-- This ensures that row access is controlled by security policies. This is idempotent.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2️⃣ Create a policy for reading the user's own profile.
-- This allows a user to SELECT (read) only their own row from the profiles table.
CREATE POLICY "Select own profile"
ON public.profiles
FOR SELECT
USING (id = auth.uid());

-- 3️⃣ Create a policy for inserting the user's own profile only.
-- This allows a user to INSERT a new row, checking that the row's 'id' matches their authenticated user ID.
CREATE POLICY "Insert own profile"
ON public.profiles
FOR INSERT
WITH CHECK (id = auth.uid());

-- 4️⃣ Create a policy for updating the user's own profile.
-- This allows a user to UPDATE their own row in the profiles table.
CREATE POLICY "Update own profile"
ON public.profiles
FOR UPDATE
USING (id = auth.uid());
