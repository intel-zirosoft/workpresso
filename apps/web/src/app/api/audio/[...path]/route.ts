import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(
  request: Request,
  { params }: { params: { path: string[] } }
) {
  try {
    const storagePath = params.path.join('/');
    const supabase = createAdminClient();

    // Fetch the file from the 'meeting-logs' bucket
    const { data, error } = await supabase.storage
      .from('meeting-logs')
      .download(storagePath);

    if (error || !data) {
      console.error('Error downloading audio from storage:', error);
      return new NextResponse('File not found', { status: 404 });
    }

    // Return the audio file with correct headers
    const response = new NextResponse(data);
    response.headers.set('Content-Type', 'audio/wav');
    response.headers.set('Cache-Control', 'public, max-age=3600');
    
    return response;
  } catch (err) {
    console.error('Unexpected error in audio proxy:', err);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
