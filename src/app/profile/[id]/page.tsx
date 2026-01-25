'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { getTripPath } from '@/lib/slugify';

interface PublicProfile {
  id: string;
  display_name: string | null;
  bio: string | null;
  experience_level: string | null;
  years_experience: number | null;
  certifications: string[] | null;
  fitness_level: string | null;
  has_beacon: boolean;
  has_probe: boolean;
  has_shovel: boolean;
  travel_method: string | null;
  preferred_zones: string[];
  preferred_trailheads: string[];
}

interface TourSummary {
  id: string;
  slug: string | null;
  title: string;
  tour_date: string;
  zone: string;
  status: string;
}

const EXPERIENCE_LABELS: Record<string, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  expert: 'Expert',
};

const FITNESS_LABELS: Record<string, string> = {
  moderate: 'Moderate',
  fit: 'Fit',
  very_fit: 'Very Fit',
  athlete: 'Athlete',
};

const TRAILHEAD_LABELS: Record<string, string> = {
  washington_gulch: 'Washington Gulch',
  snodgrass: 'Snodgrass',
  kebler: 'Kebler Pass',
  brush_creek: 'Brush Creek',
  cement_creek: 'Cement Creek',
  slate_river: 'Slate River',
};

export default function PublicProfilePage() {
  const params = useParams();
  const userId = params.id as string;

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [organizedTours, setOrganizedTours] = useState<TourSummary[]>([]);
  const [joinedTours, setJoinedTours] = useState<TourSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      if (!supabase) return;

      setLoading(true);

      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select(`
          id,
          display_name,
          bio,
          experience_level,
          years_experience,
          certifications,
          fitness_level,
          has_beacon,
          has_probe,
          has_shovel,
          travel_method,
          preferred_zones,
          preferred_trailheads
        `)
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        setLoading(false);
        return;
      }

      setProfile(profileData);

      // Fetch tours they've organized
      const { data: organized } = await supabase
        .from('tour_posts')
        .select('id, slug, title, tour_date, zone, status')
        .eq('user_id', userId)
        .order('tour_date', { ascending: false })
        .limit(10);

      if (organized) {
        setOrganizedTours(organized);
      }

      // Fetch tours they've joined (accepted responses)
      const { data: responses } = await supabase
        .from('tour_responses')
        .select(`
          tour_id,
          tour_posts (
            id,
            slug,
            title,
            tour_date,
            zone,
            status
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'accepted');

      if (responses) {
        const joined = responses
          .filter(r => r.tour_posts)
          .map(r => {
            const tour = r.tour_posts as unknown as TourSummary;
            return {
              id: tour.id,
              slug: tour.slug,
              title: tour.title,
              tour_date: tour.tour_date,
              zone: tour.zone,
              status: tour.status,
            };
          })
          .sort((a, b) => new Date(b.tour_date).getTime() - new Date(a.tour_date).getTime());
        setJoinedTours(joined);
      }

      setLoading(false);
    }

    loadProfile();
  }, [userId]);

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Loading profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Profile not found</h1>
        <p className="text-gray-500 mb-4">This user may not exist.</p>
        <Link href="/trips" className="text-blue-600 hover:text-blue-800">
          Browse trips
        </Link>
      </div>
    );
  }

  const hasGear = profile.has_beacon && profile.has_probe && profile.has_shovel;

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/trips"
        className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
      >
        ← Back to trips
      </Link>

      {/* Profile header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {profile.display_name || 'Anonymous'}
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              {profile.experience_level && (
                <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm">
                  {EXPERIENCE_LABELS[profile.experience_level]}
                </span>
              )}
              {profile.years_experience !== null && profile.years_experience > 0 && (
                <span className="text-gray-500 text-sm">
                  {profile.years_experience} years experience
                </span>
              )}
            </div>
          </div>
          {hasGear && (
            <div className="flex-shrink-0 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
              Avy Gear Ready
            </div>
          )}
        </div>

        {/* Bio */}
        {profile.bio && (
          <div className="mb-4">
            <p className="text-gray-700">{profile.bio}</p>
          </div>
        )}

        {/* Details grid */}
        <div className="grid grid-cols-2 gap-4 py-4 border-t border-gray-200">
          {profile.fitness_level && (
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">Fitness</div>
              <div className="font-medium text-gray-900">
                {FITNESS_LABELS[profile.fitness_level]}
              </div>
            </div>
          )}
          {profile.travel_method && (
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">Travel</div>
              <div className="font-medium text-gray-900 capitalize">
                {profile.travel_method === 'both' ? 'Skin & Snowmobile' : profile.travel_method}
              </div>
            </div>
          )}
        </div>

        {/* Certifications */}
        {profile.certifications && profile.certifications.length > 0 && (
          <div className="py-4 border-t border-gray-200">
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Certifications</div>
            <div className="flex flex-wrap gap-2">
              {profile.certifications.map((cert) => (
                <span
                  key={cert}
                  className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm"
                >
                  {cert}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Preferred trailheads */}
        {profile.preferred_trailheads && profile.preferred_trailheads.length > 0 && (
          <div className="py-4 border-t border-gray-200">
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">
              Preferred Trailheads
            </div>
            <div className="flex flex-wrap gap-2">
              {profile.preferred_trailheads.map((th) => (
                <span
                  key={th}
                  className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm"
                >
                  {TRAILHEAD_LABELS[th] || th}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Gear */}
        <div className="py-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Gear</div>
          <div className="flex flex-wrap gap-3">
            <span className={`text-sm ${profile.has_beacon ? 'text-green-600' : 'text-gray-400'}`}>
              {profile.has_beacon ? '✓' : '✗'} Beacon
            </span>
            <span className={`text-sm ${profile.has_probe ? 'text-green-600' : 'text-gray-400'}`}>
              {profile.has_probe ? '✓' : '✗'} Probe
            </span>
            <span className={`text-sm ${profile.has_shovel ? 'text-green-600' : 'text-gray-400'}`}>
              {profile.has_shovel ? '✓' : '✗'} Shovel
            </span>
          </div>
        </div>
      </div>

      {/* Trips Organized */}
      {organizedTours.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Trips Organized ({organizedTours.length})
          </h2>
          <div className="space-y-2">
            {organizedTours.map((tour) => (
              <Link
                key={tour.id}
                href={getTripPath(tour)}
                className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">{tour.title}</div>
                    <div className="text-sm text-gray-500">
                      {new Date(tour.tour_date + 'T12:00:00').toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                      {' • '}
                      {tour.zone === 'southeast' ? 'Southeast' : 'Northwest'}
                    </div>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      tour.status === 'open'
                        ? 'bg-green-100 text-green-700'
                        : tour.status === 'full'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {tour.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Trips Joined */}
      {joinedTours.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Trips Joined ({joinedTours.length})
          </h2>
          <div className="space-y-2">
            {joinedTours.map((tour) => (
              <Link
                key={tour.id}
                href={getTripPath(tour)}
                className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="font-medium text-gray-900">{tour.title}</div>
                <div className="text-sm text-gray-500">
                  {new Date(tour.tour_date + 'T12:00:00').toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                  {' • '}
                  {tour.zone === 'southeast' ? 'Southeast' : 'Northwest'}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* No trip history */}
      {organizedTours.length === 0 && joinedTours.length === 0 && (
        <div className="bg-gray-50 rounded-xl p-6 text-center">
          <p className="text-gray-500">No trip history yet.</p>
        </div>
      )}
    </div>
  );
}
