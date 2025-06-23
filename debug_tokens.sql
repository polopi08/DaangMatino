-- Diagnostic queries to check report_tokens issues
-- Run these in your Supabase SQL Editor to debug

-- 1. Check if reports exist
SELECT 'Reports in database:' as info, COUNT(*) as count FROM reports;

-- 2. Check if report_tokens exist
SELECT 'Tokens in database:' as info, COUNT(*) as count FROM report_tokens;

-- 3. Check for any reports without tokens
SELECT 
    'Reports without tokens:' as info,
    r.id as report_id,
    r.public_id,
    r.created_at as report_created
FROM reports r
LEFT JOIN report_tokens rt ON r.id = rt.report_id
WHERE rt.report_id IS NULL
ORDER BY r.created_at DESC;

-- 4. Check for any constraint violations (if any exist)
SELECT 
    'Existing tokens:' as info,
    rt.report_id,
    rt.access_token,
    r.public_id,
    rt.created_at as token_created
FROM report_tokens rt
JOIN reports r ON rt.report_id = r.id
ORDER BY rt.created_at DESC;

-- 5. Show the report_tokens table structure
SELECT 
    'Table structure:' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'report_tokens' 
AND table_schema = 'public';

-- 6. Check for RLS policies on report_tokens
SELECT 
    'RLS Policies:' as info,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'report_tokens';
