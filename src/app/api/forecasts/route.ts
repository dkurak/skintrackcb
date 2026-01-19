import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { mockForecasts } from '@/lib/mockData';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const zone = searchParams.get('zone') || 'northwest';
  const limit = parseInt(searchParams.get('limit') || '7', 10);

  // If Supabase is not configured, return mock data
  if (!isSupabaseConfigured || !supabase) {
    console.log('Supabase not configured, using mock data');
    const filtered = mockForecasts
      .filter((f) => f.zone === zone)
      .slice(0, limit);

    return NextResponse.json({
      forecasts: filtered,
      source: 'mock',
    });
  }

  try {
    // Fetch forecasts from Supabase
    const { data: forecasts, error } = await supabase
      .from('forecasts')
      .select(`
        *,
        avalanche_problems (*)
      `)
      .eq('zone_id', zone)
      .order('valid_date', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Supabase error:', error);
      // Fall back to mock data on error
      const filtered = mockForecasts
        .filter((f) => f.zone === zone)
        .slice(0, limit);

      return NextResponse.json({
        forecasts: filtered,
        source: 'mock',
        error: error.message,
      });
    }

    // Transform data to match our frontend format
    const transformedForecasts = forecasts?.map((f) => ({
      id: f.id,
      zone: f.zone_id,
      issue_date: f.issue_date,
      valid_date: f.valid_date,
      danger_alpine: f.danger_alpine,
      danger_treeline: f.danger_treeline,
      danger_below_treeline: f.danger_below_treeline,
      bottom_line: f.bottom_line || f.travel_advice,
      discussion: f.discussion,
      problems: f.avalanche_problems || [],
      created_at: f.created_at,
    })) || [];

    return NextResponse.json({
      forecasts: transformedForecasts,
      source: 'supabase',
    });
  } catch (error) {
    console.error('API error:', error);
    // Fall back to mock data on any error
    const filtered = mockForecasts
      .filter((f) => f.zone === zone)
      .slice(0, limit);

    return NextResponse.json({
      forecasts: filtered,
      source: 'mock',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
