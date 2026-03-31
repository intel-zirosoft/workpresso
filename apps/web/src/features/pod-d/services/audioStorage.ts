import { createClient } from '@/lib/supabase/client';

const supabase = createClient();
const BUCKET_NAME = 'meeting-logs';

export const uploadAudio = async (blob: Blob, fileName: string) => {
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(fileName, blob, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    throw new Error(`Failed to upload audio: ${error.message}`);
  }

  return data.path;
};

export const getSignedUrl = async (path: string) => {
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(path, 3600); // 1 hour

  if (error) {
    throw new Error(`Failed to get signed URL: ${error.message}`);
  }

  return data.signedUrl;
};

export const getPublicUrl = (path: string) => {
  const { data } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(path);

  return data.publicUrl;
};
