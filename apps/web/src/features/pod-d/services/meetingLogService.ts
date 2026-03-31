import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export interface MeetingLog {
  id: string;
  owner_id: string;
  audio_url: string;
  stt_text: string | null;
  title: string | null;
  summary: string | null;
  action_items: any[] | null;
  participants: string[] | null;
  is_refined: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface MeetingLogInsert {
  owner_id: string;
  audio_url: string;
}

const transformLog = (log: any): MeetingLog => {
  const transformed = {
    ...log,
    audio_url:
      log.audio_url && !log.audio_url.startsWith("http")
        ? `/api/audio/${log.audio_url}`
        : log.audio_url,
  };
  return transformed;
};

export const createMeetingLog = async (log: MeetingLogInsert) => {
  const { data, error } = await supabase
    .from("meeting_logs")
    .insert([log])
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create meeting log: ${error.message}`);
  }

  return transformLog(data);
};

export const updateMeetingLogSTT = async (id: string, sttText: string) => {
  const { data, error } = await supabase
    .from("meeting_logs")
    .update({ stt_text: sttText })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update meeting log STT: ${error.message}`);
  }

  return transformLog(data);
};

export const updateMeetingLog = async (id: string, updates: Partial<MeetingLog>) => {
  const { data, error } = await supabase
    .from("meeting_logs")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update meeting log: ${error.message}`);
  }

  return transformLog(data);
};

export const getMeetingLog = async (id: string) => {
  const { data, error } = await supabase
    .from("meeting_logs")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    throw new Error(`Failed to fetch meeting log: ${error.message}`);
  }

  return transformLog(data);
};

export const listMeetingLogs = async (ownerId: string) => {
  const { data, error } = await supabase
    .from("meeting_logs")
    .select("*")
    .eq("owner_id", ownerId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to list meeting logs: ${error.message}`);
  }

  return (data ?? []).map(transformLog);
};

export const deleteMeetingLog = async (id: string) => {
  const { error } = await supabase
    .from("meeting_logs")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    throw new Error(`Failed to delete meeting log: ${error.message}`);
  }
};

export const deleteMeetingLogs = async (ids: string[]) => {
  const { error } = await supabase
    .from("meeting_logs")
    .update({ deleted_at: new Date().toISOString() })
    .in("id", ids);

  if (error) {
    throw new Error(`Failed to delete meeting logs: ${error.message}`);
  }
};
