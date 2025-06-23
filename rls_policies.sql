-- Comprehensive RLS Policies Setup
-- Run this in your Supabase SQL Editor

-- 1. Enable RLS on all tables
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow public insert on reports" ON public.reports;
DROP POLICY IF EXISTS "Allow public select on reports" ON public.reports;
DROP POLICY IF EXISTS "Allow public insert on report_tokens" ON public.report_tokens;
DROP POLICY IF EXISTS "Allow public select on report_tokens" ON public.report_tokens;
DROP POLICY IF EXISTS "Allow public insert on report_attachments" ON public.report_attachments;
DROP POLICY IF EXISTS "Allow public select on report_attachments" ON public.report_attachments;

-- 3. REPORTS TABLE POLICIES
-- Allow anonymous users to insert reports (for public report submission)
CREATE POLICY "reports_insert_policy" ON public.reports
FOR INSERT TO anon
WITH CHECK (true);

-- Allow anonymous users to select reports (for tracking and verification)
CREATE POLICY "reports_select_policy" ON public.reports
FOR SELECT TO anon, authenticated
USING (true);

-- Allow authenticated users (admins) full access
CREATE POLICY "reports_admin_all_policy" ON public.reports
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- 4. REPORT_TOKENS TABLE POLICIES
-- Allow anonymous users to insert tokens (needed when submitting reports)
CREATE POLICY "tokens_insert_policy" ON public.report_tokens
FOR INSERT TO anon
WITH CHECK (true);

-- Allow anonymous users to select tokens (for report tracking)
CREATE POLICY "tokens_select_policy" ON public.report_tokens
FOR SELECT TO anon, authenticated
USING (true);

-- Allow authenticated users full access
CREATE POLICY "tokens_admin_all_policy" ON public.report_tokens
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- 5. REPORT_ATTACHMENTS TABLE POLICIES (if table exists)
-- Allow anonymous users to insert attachments
CREATE POLICY "attachments_insert_policy" ON public.report_attachments
FOR INSERT TO anon
WITH CHECK (true);

-- Allow anonymous users to select attachments
CREATE POLICY "attachments_select_policy" ON public.report_attachments
FOR SELECT TO anon, authenticated
USING (true);

-- Allow authenticated users full access
CREATE POLICY "attachments_admin_all_policy" ON public.report_attachments
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- 6. ADMIN TABLE POLICIES
-- Restrict admin table to authenticated users only
CREATE POLICY "admin_select_policy" ON public.admin
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "admin_insert_policy" ON public.admin
FOR INSERT TO authenticated
WITH CHECK (true);

-- 7. Verify all policies are created
SELECT 
    'RLS Policies Summary:' as info,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('reports', 'report_tokens', 'report_attachments', 'admin')
ORDER BY tablename, policyname;

-- 8. Check RLS status on all tables
SELECT 
    'RLS Status:' as info,
    tablename,
    CASE 
        WHEN rowsecurity THEN 'ENABLED' 
        ELSE 'DISABLED' 
    END as rls_status
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
WHERE schemaname = 'public' 
AND tablename IN ('reports', 'report_tokens', 'report_attachments', 'admin');

-- Success message
SELECT '✅ RLS policies configured successfully for all tables!' as message;
