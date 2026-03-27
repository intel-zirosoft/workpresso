-- Create storage bucket for meeting logs
INSERT INTO storage.buckets (id, name, public)
VALUES ('meeting-logs', 'meeting-logs', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for meeting-logs bucket
-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated users to upload audio" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to read audio" ON storage.objects;
DROP POLICY IF EXISTS "Allow anon upload for testing" ON storage.objects;
DROP POLICY IF EXISTS "Allow anon select for testing" ON storage.objects;

-- Allow authenticated users (Real flow)
CREATE POLICY "Allow authenticated users to upload audio"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'meeting-logs' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Allow authenticated users to read audio"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'meeting-logs' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow anon access for testing (Development only)
CREATE POLICY "Allow anon upload for testing"
ON storage.objects FOR INSERT TO anon
WITH CHECK (bucket_id = 'meeting-logs');

CREATE POLICY "Allow anon select for testing"
ON storage.objects FOR SELECT TO anon
USING (bucket_id = 'meeting-logs');

-- Enable RLS for public.meeting_logs table
ALTER TABLE public.meeting_logs ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies for meeting_logs table
DROP POLICY IF EXISTS "Allow users to manage their own meeting logs" ON public.meeting_logs;
DROP POLICY IF EXISTS "Allow anon all for meeting_logs" ON public.meeting_logs;

CREATE POLICY "Allow users to manage their own meeting logs"
ON public.meeting_logs FOR ALL TO authenticated
USING (auth.uid() = owner_id);

CREATE POLICY "Allow anon all for meeting_logs"
ON public.meeting_logs FOR ALL TO anon
USING (true)
WITH CHECK (true);

-- [DEBUG] Allow anon access for testing only if needed (Uncomment if you want to test without login)
-- CREATE POLICY "Allow anon upload for testing" ON storage.objects FOR INSERT TO anon WITH CHECK (bucket_id = 'meeting-logs');
-- CREATE POLICY "Allow anon select for testing" ON storage.objects FOR SELECT TO anon USING (bucket_id = 'meeting-logs');
-- CREATE POLICY "Allow anon all for meeting_logs" ON public.meeting_logs FOR ALL TO anon USING (true) WITH CHECK (true);
