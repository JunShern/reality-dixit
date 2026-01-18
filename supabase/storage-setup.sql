-- Storage Setup for Reality Dixit
-- Run this in your Supabase SQL Editor after creating the photos bucket

-- First, create the storage bucket manually in Supabase Dashboard:
-- 1. Go to Storage
-- 2. Create a new bucket called "photos"
-- 3. Make it a public bucket

-- Storage Policies for the photos bucket
-- These allow anyone to upload and view photos (since we don't have auth)

-- Allow public read access to all photos
CREATE POLICY "Public photo access"
ON storage.objects FOR SELECT
USING (bucket_id = 'photos');

-- Allow anyone to upload photos
CREATE POLICY "Anyone can upload photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'photos');

-- Allow deletion of photos (for cleanup)
CREATE POLICY "Photos can be deleted"
ON storage.objects FOR DELETE
USING (bucket_id = 'photos');

-- =====================================================
-- Storage Cleanup Function
-- =====================================================

-- Function to delete photos for old rooms
-- This should be called before deleting the room record
CREATE OR REPLACE FUNCTION cleanup_room_photos(room_uuid UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  file_path TEXT;
BEGIN
  -- Delete all files in the room's folder
  -- Files are stored as: photos/{room_id}/{round}/{player_id}.jpg
  FOR file_path IN
    SELECT name FROM storage.objects
    WHERE bucket_id = 'photos'
    AND name LIKE room_uuid::TEXT || '/%'
  LOOP
    PERFORM storage.delete('photos', file_path);
  END LOOP;
END;
$$;

-- Trigger to clean up photos when a room is deleted
CREATE OR REPLACE FUNCTION trigger_cleanup_room_photos()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM cleanup_room_photos(OLD.id);
  RETURN OLD;
END;
$$;

CREATE TRIGGER before_room_delete
BEFORE DELETE ON rooms
FOR EACH ROW
EXECUTE FUNCTION trigger_cleanup_room_photos();
