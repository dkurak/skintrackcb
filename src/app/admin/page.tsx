'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

interface TestUser {
  id: string;
  email: string;
  display_name: string | null;
  experience_level: string | null;
  travel_method: string | null;
  looking_for_partners: boolean;
}

export default function AdminPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [testUsers, setTestUsers] = useState<TestUser[]>([]);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch test users on load
  useEffect(() => {
    fetchTestUsers();
  }, []);

  const fetchTestUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/test-users');
      const data = await res.json();
      if (data.users) {
        setTestUsers(data.users);
        setPassword(data.password);
      }
    } catch (error) {
      console.error('Error fetching test users:', error);
    }
    setLoading(false);
  };

  const handleCreateTestUsers = async () => {
    setActionLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/test-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create' }),
      });
      const data = await res.json();
      if (data.created) {
        setMessage({ type: 'success', text: `Created ${data.created.filter((u: {status: string}) => u.status === 'created').length} test users with sample tours` });
        fetchTestUsers();
      } else if (data.error) {
        setMessage({ type: 'error', text: data.error });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to create test users' });
    }
    setActionLoading(false);
  };

  const handleDeleteTestUsers = async () => {
    if (!confirm('Are you sure you want to delete ALL test users, tours, and responses? This cannot be undone.')) {
      return;
    }

    setActionLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/test-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete' }),
      });
      const data = await res.json();
      if (data.deleted !== undefined) {
        setMessage({ type: 'success', text: `Deleted ${data.deleted} test users and all associated data` });
        setTestUsers([]);
      } else if (data.error) {
        setMessage({ type: 'error', text: data.error });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete test users' });
    }
    setActionLoading(false);
  };

  const handleSignInAs = async (email: string) => {
    if (!supabase) return;

    try {
      // Sign out current user first
      await supabase.auth.signOut();

      // Sign in as test user
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setMessage({ type: 'error', text: `Failed to sign in: ${error.message}` });
      } else {
        router.push('/profile');
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to sign in as test user' });
    }
  };

  const EXPERIENCE_LABELS: Record<string, string> = {
    beginner: 'Beginner',
    intermediate: 'Intermediate',
    advanced: 'Advanced',
    expert: 'Expert',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin: Test Users</h1>
        <p className="text-gray-500">
          Create and manage test users for development
        </p>
      </div>

      {/* Current user info */}
      {user && (
        <div className="bg-gray-100 rounded-lg p-4 text-sm">
          <span className="text-gray-600">Currently signed in as: </span>
          <span className="font-medium">{user.email}</span>
          {profile?.is_test_user && (
            <span className="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs">Test User</span>
          )}
        </div>
      )}

      {/* Messages */}
      {message && (
        <div
          className={`px-4 py-3 rounded-lg text-sm ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleCreateTestUsers}
            disabled={actionLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {actionLoading ? 'Working...' : 'Create 15 Test Users + Sample Tours'}
          </button>
          <button
            onClick={handleDeleteTestUsers}
            disabled={actionLoading || testUsers.length === 0}
            className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            Delete All Test Data
          </button>
          <button
            onClick={fetchTestUsers}
            disabled={loading}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 disabled:opacity-50 transition-colors"
          >
            Refresh
          </button>
        </div>

        {password && (
          <p className="mt-4 text-sm text-gray-500">
            Test user password: <code className="bg-gray-100 px-2 py-1 rounded">{password}</code>
          </p>
        )}
      </div>

      {/* Test Users List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Test Users ({testUsers.length})
        </h2>

        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : testUsers.length === 0 ? (
          <p className="text-gray-500">No test users created yet. Click the button above to create them.</p>
        ) : (
          <div className="space-y-2">
            {testUsers.map((testUser) => (
              <div
                key={testUser.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900">
                    {testUser.display_name || testUser.email}
                  </div>
                  <div className="text-sm text-gray-500 flex flex-wrap gap-2">
                    <span>{testUser.email}</span>
                    {testUser.experience_level && (
                      <span className="px-2 py-0.5 bg-gray-200 rounded text-xs">
                        {EXPERIENCE_LABELS[testUser.experience_level]}
                      </span>
                    )}
                    {testUser.travel_method && (
                      <span className="px-2 py-0.5 bg-gray-200 rounded text-xs">
                        {testUser.travel_method}
                      </span>
                    )}
                    {testUser.looking_for_partners && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                        Looking for partners
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleSignInAs(testUser.email)}
                  className="px-3 py-1.5 bg-gray-900 text-white rounded text-sm font-medium hover:bg-gray-800 transition-colors"
                >
                  Sign in as
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Test the experience</h3>
        <div className="flex flex-wrap gap-2">
          <a href="/partners" className="text-blue-600 hover:text-blue-800 text-sm">
            Browse Tours →
          </a>
          <span className="text-blue-300">|</span>
          <a href="/partners/new" className="text-blue-600 hover:text-blue-800 text-sm">
            Post a Tour →
          </a>
          <span className="text-blue-300">|</span>
          <a href="/profile" className="text-blue-600 hover:text-blue-800 text-sm">
            Edit Profile →
          </a>
        </div>
      </div>
    </div>
  );
}
