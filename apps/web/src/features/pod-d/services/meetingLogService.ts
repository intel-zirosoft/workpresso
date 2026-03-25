import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

export interface MeetingLogInsert {
  owner_id: string;
  audio_url: string;
}

export const createMeetingLog = async (log: MeetingLogInsert) => {
  const { data, error } = await supabase
    .from('meeting_logs')
    .insert([log])
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create meeting log: ${error.message}`);
  }

  return data;
};

export const updateMeetingLogSTT = async (id: string, sttText: string) => {
  const { data, error } = await supabase
    .from('meeting_logs')
    .update({ stt_text: sttText })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update meeting log STT: ${error.message}`);
  }

  return data;
};

export const getMeetingLog = async (id: string) => {
  const { data, error } = await supabase
    .from('meeting_logs')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    throw new Error(`Failed to fetch meeting log: ${error.message}`);
  }

  return data;
};
export const listMeetingLogs = async (ownerId: string) => {
  const { data, error } = await supabase
    .from('meeting_logs')
    .select('*')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to list meeting logs: ${error.message}`);
  }

  return data;
};
