

import { supabase } from "../supabaseClient";

export async function addVideo(mediaItem, ownerId = null) {
  const record = {
    id: mediaItem.id,
    owner_id: ownerId,
    title: mediaItem.filename || mediaItem.title,
    base_url: mediaItem.baseUrl,
    thumbnail_url: `${mediaItem.baseUrl}=w400-h300`,
    mime_type: mediaItem.mimeType || 'video/mp4',
  };
  const { data, error } = await supabase.from('videos').upsert(record);
  if (error) throw error;
  return data;
}

export async function fetchVideos() {
  const { data, error } = await supabase.from('videos').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}
