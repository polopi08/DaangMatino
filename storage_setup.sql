-- Storage Bucket and Policies Setup
-- Run this in your Supabase SQL Editor

-- 1. Create the storage bucket for report attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
    'report-attachments', 
    'report-attachments', 
    true,
    10485760, -- 10MB limit
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime'];

-- 2. Enable RLS on storage.objects (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow public uploads to report-attachments" ON storage.objects;
DROP POLICY IF EXISTS "Allow public downloads from report-attachments" ON storage.objects;
DROP POLICY IF EXISTS "Allow public deletes from report-attachments" ON storage.objects;

-- 4. Create comprehensive storage policies for report-attachments bucket
CREATE POLICY "Allow public uploads to report-attachments" ON storage.objects
FOR INSERT TO anon, authenticated
WITH CHECK (
    bucket_id = 'report-attachments' AND
    (storage.foldername(name))[1] = 'reports'
);

CREATE POLICY "Allow public downloads from report-attachments" ON storage.objects
FOR SELECT TO anon, authenticated
USING (bucket_id = 'report-attachments');

CREATE POLICY "Allow public updates to report-attachments" ON storage.objects
FOR UPDATE TO anon, authenticated
USING (bucket_id = 'report-attachments')
WITH CHECK (bucket_id = 'report-attachments');

CREATE POLICY "Allow public deletes from report-attachments" ON storage.objects
FOR DELETE TO anon, authenticated
USING (bucket_id = 'report-attachments');

-- 5. Verify bucket creation
SELECT 
    'Storage Bucket Status:' as info,
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types,
    created_at
FROM storage.buckets 
WHERE id = 'report-attachments';

-- 6. Verify storage policies
SELECT 
    'Storage Policies:' as info,
    policyname,
    cmd,
    roles
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND policyname LIKE '%report-attachments%';

-- Success message
SELECT '✅ Storage bucket and policies configured successfully!' as message;
