-- Quick Fix for RLS Policy Issues
-- Run this in your Supabase SQL Editor to allow report submissions

-- 1. Set up RLS policies for reports table
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to insert reports
CREATE POLICY "Allow public insert on reports" ON reports
FOR INSERT TO anon
WITH CHECK (true);

-- Allow anonymous users to read reports (for tracking)
CREATE POLICY "Allow public select on reports" ON reports
FOR SELECT TO anon
USING (true);

-- 2. Set up RLS policies for report_attachments table
ALTER TABLE report_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert on report_attachments" ON report_attachments
FOR INSERT TO anon
WITH CHECK (true);

CREATE POLICY "Allow public select on report_attachments" ON report_attachments
FOR SELECT TO anon
USING (true);

-- 3. Fix RLS policies for report_tokens table (avoid infinite recursion)
ALTER TABLE report_tokens ENABLE ROW LEVEL SECURITY;

-- Drop existing policies that might cause recursion
DROP POLICY IF EXISTS "Allow public insert on report_tokens" ON report_tokens;
DROP POLICY IF EXISTS "Allow public select on report_tokens" ON report_tokens;

-- Create simple, non-recursive policies
CREATE POLICY "report_tokens_insert_anon" ON report_tokens
FOR INSERT TO anon
WITH CHECK (report_id IS NOT NULL);

CREATE POLICY "report_tokens_select_anon" ON report_tokens
FOR SELECT TO anon
USING (report_id IS NOT NULL);

-- 4. Set up admin table policies (authenticated users only)
ALTER TABLE admin ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read admin" ON admin
FOR SELECT TO authenticated
USING (true);

-- 5. Create storage bucket for file uploads (if not exists)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('report-attachments', 'report-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- 6. Set up storage policies
CREATE POLICY "Allow public uploads" ON storage.objects
FOR INSERT TO anon
WITH CHECK (bucket_id = 'report-attachments');

CREATE POLICY "Allow public downloads" ON storage.objects
FOR SELECT TO anon
USING (bucket_id = 'report-attachments');

-- Success message
SELECT 'RLS policies configured successfully! You can now submit reports.' as message;
