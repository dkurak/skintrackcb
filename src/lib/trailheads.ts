import { supabase } from './supabase';

export interface Trailhead {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  zone: 'northwest' | 'southeast' | null;
  latitude: number | null;
  longitude: number | null;
  elevation_ft: number | null;
  parking_info: string | null;
  access_notes: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Route {
  id: string;
  trailhead_id: string | null;
  slug: string;
  name: string;
  description: string | null;
  zone: 'northwest' | 'southeast' | null;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert' | null;
  aspects: string[] | null;
  elevation_gain_ft: number | null;
  max_elevation_ft: number | null;
  avg_slope_angle: number | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  trailhead?: Trailhead;
}

// Fetch all active trailheads
export async function getTrailheads(): Promise<Trailhead[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('trailheads')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching trailheads:', error);
    return [];
  }

  return data as Trailhead[];
}

// Fetch all trailheads (including inactive) for admin
export async function getAllTrailheads(): Promise<Trailhead[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('trailheads')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching trailheads:', error);
    return [];
  }

  return data as Trailhead[];
}

// Create a new trailhead
export async function createTrailhead(
  trailhead: Omit<Trailhead, 'id' | 'created_at' | 'updated_at'>
): Promise<{ data: Trailhead | null; error: Error | null }> {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };

  const { data, error } = await supabase
    .from('trailheads')
    .insert(trailhead)
    .select()
    .single();

  return { data: data as Trailhead | null, error: error as Error | null };
}

// Update a trailhead
export async function updateTrailhead(
  id: string,
  updates: Partial<Omit<Trailhead, 'id' | 'created_at' | 'updated_at'>>
): Promise<{ error: Error | null }> {
  if (!supabase) return { error: new Error('Supabase not configured') };

  const { error } = await supabase
    .from('trailheads')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id);

  return { error: error as Error | null };
}

// Delete a trailhead (soft delete by setting is_active = false)
export async function deleteTrailhead(id: string): Promise<{ error: Error | null }> {
  if (!supabase) return { error: new Error('Supabase not configured') };

  const { error } = await supabase
    .from('trailheads')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id);

  return { error: error as Error | null };
}

// Hard delete a trailhead
export async function hardDeleteTrailhead(id: string): Promise<{ error: Error | null }> {
  if (!supabase) return { error: new Error('Supabase not configured') };

  const { error } = await supabase
    .from('trailheads')
    .delete()
    .eq('id', id);

  return { error: error as Error | null };
}

// Generate slug from name
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .substring(0, 50);
}
