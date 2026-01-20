'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import {
  Trailhead,
  getAllTrailheads,
  createTrailhead,
  updateTrailhead,
  deleteTrailhead,
  hardDeleteTrailhead,
  generateSlug,
} from '@/lib/trailheads';
import Link from 'next/link';

export default function AdminTrailheadsPage() {
  const { user } = useAuth();
  const [trailheads, setTrailheads] = useState<Trailhead[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Edit form state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form fields
  const [formData, setFormData] = useState({
    slug: '',
    name: '',
    description: '',
    zone: '' as 'northwest' | 'southeast' | '',
    elevation_ft: '',
    parking_info: '',
    access_notes: '',
    sort_order: '0',
  });

  useEffect(() => {
    loadTrailheads();
  }, []);

  const loadTrailheads = async () => {
    setLoading(true);
    const data = await getAllTrailheads();
    setTrailheads(data);
    setLoading(false);
  };

  const resetForm = () => {
    setFormData({
      slug: '',
      name: '',
      description: '',
      zone: '',
      elevation_ft: '',
      parking_info: '',
      access_notes: '',
      sort_order: '0',
    });
    setEditingId(null);
    setShowAddForm(false);
  };

  const handleEdit = (trailhead: Trailhead) => {
    setFormData({
      slug: trailhead.slug,
      name: trailhead.name,
      description: trailhead.description || '',
      zone: trailhead.zone || '',
      elevation_ft: trailhead.elevation_ft?.toString() || '',
      parking_info: trailhead.parking_info || '',
      access_notes: trailhead.access_notes || '',
      sort_order: trailhead.sort_order.toString(),
    });
    setEditingId(trailhead.id);
    setShowAddForm(true);
  };

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      // Auto-generate slug only for new trailheads
      slug: editingId ? prev.slug : generateSlug(name),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.slug) {
      setMessage({ type: 'error', text: 'Name and slug are required' });
      return;
    }

    setSaving(true);
    setMessage(null);

    const trailheadData = {
      slug: formData.slug,
      name: formData.name,
      description: formData.description || null,
      zone: (formData.zone || null) as 'northwest' | 'southeast' | null,
      latitude: null,
      longitude: null,
      elevation_ft: formData.elevation_ft ? parseInt(formData.elevation_ft) : null,
      parking_info: formData.parking_info || null,
      access_notes: formData.access_notes || null,
      is_active: true,
      sort_order: parseInt(formData.sort_order) || 0,
    };

    if (editingId) {
      const { error } = await updateTrailhead(editingId, trailheadData);
      if (error) {
        setMessage({ type: 'error', text: `Failed to update: ${error.message}` });
      } else {
        setMessage({ type: 'success', text: 'Trailhead updated successfully' });
        resetForm();
        loadTrailheads();
      }
    } else {
      const { error } = await createTrailhead(trailheadData);
      if (error) {
        setMessage({ type: 'error', text: `Failed to create: ${error.message}` });
      } else {
        setMessage({ type: 'success', text: 'Trailhead created successfully' });
        resetForm();
        loadTrailheads();
      }
    }

    setSaving(false);
  };

  const handleDelete = async (trailhead: Trailhead) => {
    if (!confirm(`Are you sure you want to delete "${trailhead.name}"?`)) return;

    const { error } = await deleteTrailhead(trailhead.id);
    if (error) {
      setMessage({ type: 'error', text: `Failed to delete: ${error.message}` });
    } else {
      setMessage({ type: 'success', text: 'Trailhead deleted' });
      loadTrailheads();
    }
  };

  const handleRestore = async (trailhead: Trailhead) => {
    const { error } = await updateTrailhead(trailhead.id, { is_active: true });
    if (error) {
      setMessage({ type: 'error', text: `Failed to restore: ${error.message}` });
    } else {
      setMessage({ type: 'success', text: 'Trailhead restored' });
      loadTrailheads();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Trailheads</h1>
        <p className="text-gray-500">Manage trailhead locations</p>
      </div>

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

      {/* Add/Edit Form */}
      {showAddForm ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {editingId ? 'Edit Trailhead' : 'Add New Trailhead'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Washington Gulch"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Slug *
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                  placeholder="washington_gulch"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Coney's, Purple Palace, etc."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Zone
                </label>
                <select
                  value={formData.zone}
                  onChange={(e) => setFormData(prev => ({ ...prev, zone: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Not specified</option>
                  <option value="southeast">Southeast</option>
                  <option value="northwest">Northwest</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Elevation (ft)
                </label>
                <input
                  type="number"
                  value={formData.elevation_ft}
                  onChange={(e) => setFormData(prev => ({ ...prev, elevation_ft: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 9400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sort Order
                </label>
                <input
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData(prev => ({ ...prev, sort_order: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Parking Info
              </label>
              <textarea
                value={formData.parking_info}
                onChange={(e) => setFormData(prev => ({ ...prev, parking_info: e.target.value }))}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Parking lot details, capacity, fees, etc."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Access Notes
              </label>
              <textarea
                value={formData.access_notes}
                onChange={(e) => setFormData(prev => ({ ...prev, access_notes: e.target.value }))}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Winter road closures, seasonal access, etc."
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Saving...' : editingId ? 'Update Trailhead' : 'Add Trailhead'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : (
        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          + Add New Trailhead
        </button>
      )}

      {/* Trailheads List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Trailheads ({trailheads.filter(t => t.is_active).length} active)
        </h2>

        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : trailheads.length === 0 ? (
          <p className="text-gray-500">No trailheads yet. Add one above.</p>
        ) : (
          <div className="space-y-2">
            {trailheads.map((trailhead) => (
              <div
                key={trailhead.id}
                className={`flex items-center justify-between p-4 rounded-lg ${
                  trailhead.is_active ? 'bg-gray-50' : 'bg-red-50 opacity-60'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{trailhead.name}</span>
                    <code className="text-xs bg-gray-200 px-1.5 py-0.5 rounded text-gray-600">
                      {trailhead.slug}
                    </code>
                    {trailhead.zone && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded capitalize">
                        {trailhead.zone}
                      </span>
                    )}
                    {!trailhead.is_active && (
                      <span className="text-xs bg-red-200 text-red-700 px-1.5 py-0.5 rounded">
                        Inactive
                      </span>
                    )}
                  </div>
                  {trailhead.description && (
                    <div className="text-sm text-gray-500 mt-0.5">{trailhead.description}</div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(trailhead)}
                    className="px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                  >
                    Edit
                  </button>
                  {trailhead.is_active ? (
                    <button
                      onClick={() => handleDelete(trailhead)}
                      className="px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                    >
                      Delete
                    </button>
                  ) : (
                    <button
                      onClick={() => handleRestore(trailhead)}
                      className="px-3 py-1.5 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                    >
                      Restore
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
        <strong>Coming soon:</strong> Routes/Lines management. You&apos;ll be able to add specific routes
        like &quot;Convex Corner&quot; or &quot;Red Lady Bowl&quot; and link them to trailheads.
      </div>
    </div>
  );
}
