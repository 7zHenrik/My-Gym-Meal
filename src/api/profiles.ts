import { supabase } from '@/lib/supabase';
import { Profile } from '@/types/database';

export async function fetchProfile(id: string): Promise<Profile | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data as Profile | null;
}

export interface UpdateProfileInput {
  username?: string;
  display_name?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
}

export async function updateProfile(id: string, input: UpdateProfileInput): Promise<Profile> {
  const { data, error } = await supabase.from('profiles').update(input).eq('id', id).select().single();
  if (error) throw error;
  return data as Profile;
}
