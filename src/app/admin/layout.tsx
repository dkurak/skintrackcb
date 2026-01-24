'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!loading) {
      setChecked(true);
      // Redirect non-admins
      if (!user || !profile?.is_admin) {
        router.push('/');
      }
    }
  }, [user, profile, loading, router]);

  // Show loading while checking auth
  if (loading || !checked) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-gray-500">Checking access...</p>
      </div>
    );
  }

  // Don't render admin content for non-admins
  if (!user || !profile?.is_admin) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Admin access required.</p>
          <Link href="/" className="text-blue-600 hover:underline">
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Admin Navigation */}
      <div className="mb-6 bg-gray-900 text-white rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="font-bold text-lg">Admin</span>
          </div>
          <div className="text-sm text-gray-400">
            {profile.email}
          </div>
        </div>
      </div>

      {children}
    </div>
  );
}
