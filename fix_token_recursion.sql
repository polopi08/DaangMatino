-- Fix for Infinite Recursion in report_tokens RLS Policy
-- Run this in your Supabase SQL Editor

-- 1. First, disable RLS temporarily to clear any problematic policies
ALTER TABLE report_tokens DISABLE ROW LEVEL SECURITY;

-- 2. Drop all existing policies on report_tokens
DROP POLICY IF EXISTS "Allow public insert on report_tokens" ON report_tokens;
DROP POLICY IF EXISTS "Allow public select on report_tokens" ON report_tokens;
DROP POLICY IF EXISTS "report_tokens_insert_anon" ON report_tokens;
DROP POLICY IF EXISTS "report_tokens_select_anon" ON report_tokens;
DROP POLICY IF EXISTS "tokens_insert_policy" ON report_tokens;
DROP POLICY IF EXISTS "tokens_select_policy" ON report_tokens;
DROP POLICY IF EXISTS "tokens_admin_all_policy" ON report_tokens;

-- 3. Re-enable RLS
ALTER TABLE report_tokens ENABLE ROW LEVEL SECURITY;

-- 4. Create simple, safe policies that won't cause recursion
-- These policies are very basic and don't reference other tables or complex conditions

-- Allow anonymous users to insert tokens (simple condition)
CREATE POLICY "simple_insert_tokens" ON report_tokens
FOR INSERT TO anon, authenticated
WITH CHECK (
  report_id > 0 AND 
  access_token IS NOT NULL AND 
  length(access_token) > 5
);

-- Allow anonymous users to select tokens (simple condition)
CREATE POLICY "simple_select_tokens" ON report_tokens
FOR SELECT TO anon, authenticated
USING (
  report_id > 0 AND 
  access_token IS NOT NULL
);

-- 5. Test the policies by checking if they work without recursion
SELECT 
  'Testing token policies...' as info,
  COUNT(*) as existing_tokens_count
FROM report_tokens;

-- 6. Show current policies
SELECT 
  'Current token policies:' as info,
  policyname,
  cmd,
  roles,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'report_tokens' 
AND schemaname = 'public';

-- Success message
SELECT '✅ Token RLS policies fixed! Infinite recursion should be resolved.' as message;
