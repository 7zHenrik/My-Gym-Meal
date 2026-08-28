import * as ImageManipulator from 'expo-image-manipulator';

import { supabase } from '@/lib/supabase';

const IMAGE_MAX_DIMENSION = 1600;
const IMAGE_COMPRESSION = 0.75;
export const MAX_VIDEO_SIZE_BYTES = 80 * 1024 * 1024; // 80 MB

async function uriToArrayBuffer(uri: string): Promise<ArrayBuffer> {
  const response = await fetch(uri);
  return response.arrayBuffer();
}

/**
 * Resizes and compresses an image before upload so recipe photos stay fast
 * to load in the feed without visibly hurting quality.
 */
async function compressImage(uri: string): Promise<string> {
  const result = await ImageManipulator.manipulateAsync(uri, [{ resize: { width: IMAGE_MAX_DIMENSION } }], {
    compress: IMAGE_COMPRESSION,
    format: ImageManipulator.SaveFormat.JPEG,
  });
  return result.uri;
}

export async function uploadRecipeImage(userId: string, uri: string): Promise<string> {
  const compressedUri = await compressImage(uri);
  const arrayBuffer = await uriToArrayBuffer(compressedUri);
  const path = `${userId}/${Date.now()}-${Math.round(Math.random() * 1e6)}.jpg`;

  const { error } = await supabase.storage.from('recipe-images').upload(path, arrayBuffer, {
    contentType: 'image/jpeg',
    upsert: false,
  });
  if (error) throw error;

  const { data } = supabase.storage.from('recipe-images').getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadRecipeVideo(userId: string, uri: string): Promise<string> {
  const arrayBuffer = await uriToArrayBuffer(uri);
  if (arrayBuffer.byteLength > MAX_VIDEO_SIZE_BYTES) {
    throw new Error('Das Video ist zu groß. Bitte wähle ein Video unter 80 MB.');
  }
  const extension = uri.split('.').pop()?.toLowerCase() === 'mov' ? 'mov' : 'mp4';
  const path = `${userId}/${Date.now()}-${Math.round(Math.random() * 1e6)}.${extension}`;

  const { error } = await supabase.storage.from('recipe-videos').upload(path, arrayBuffer, {
    contentType: extension === 'mov' ? 'video/quicktime' : 'video/mp4',
    upsert: false,
  });
  if (error) throw error;

  const { data } = supabase.storage.from('recipe-videos').getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadAvatar(userId: string, uri: string): Promise<string> {
  const compressedUri = await compressImage(uri);
  const arrayBuffer = await uriToArrayBuffer(compressedUri);
  const path = `${userId}/avatar-${Date.now()}.jpg`;

  const { error } = await supabase.storage.from('avatars').upload(path, arrayBuffer, {
    contentType: 'image/jpeg',
    upsert: false,
  });
  if (error) throw error;

  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  return data.publicUrl;
}
