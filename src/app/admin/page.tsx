'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type AccessLevel = 'free' | 'trial' | 'active' | 'lifetime';

interface GatingRule {
  slug: string;
  accessLevel: AccessLevel;
  reason?: string;
}

interface AdminData {
  gating: {
    rules: GatingRule[];
    defaultLevel: AccessLevel;
  };
  stats: {
    totalPages: number;
    sections: number;
    contentPages: number;
  };
  admin: string;
}

export default function AdminPage() {
  const [data, setData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [rules, setRules] = useState<GatingRule[]>([]);
  const [defaultLevel, setDefaultLevel] = useState<AccessLevel>('trial');
  const [newRule, setNewRule] = useState({ slug: '', accessLevel: 'active' as AccessLevel, reason: '' });
  const router = useRouter();

  useEffect(() => {
    async function loadAdmin() {
      try {
        const res = await fetch('/api/admin');
        if (res.status === 403) {
          router.push('/resources');
          return;
        }
        if (!res.ok) throw new Error('Failed to load');

        const adminData = await res.json();
        setData(adminData);
        setRules(adminData.gating.rules);
        setDefaultLevel(adminData.gating.defaultLevel);
      } catch {
        setError('Failed to load admin data');
      }
      setLoading(false);
    }
    loadAdmin();
  }, [router]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rules, defaultLevel }),
      });

      if (!res.ok) throw new Error('Failed to save');

      const result = await res.json();
      setRules(result.rules);
      setDefaultLevel(result.defaultLevel);
      alert('Saved successfully!');
    } catch {
      alert('Failed to save changes');
    }
    setSaving(false);
  };

  const addRule = () => {
    if (!newRule.slug) return;
    setRules([...rules, { ...newRule }]);
    setNewRule({ slug: '', accessLevel: 'active', reason: '' });
  };

  const removeRule = (index: number) => {
    setRules(rules.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0D1F35] via-[#152d4a] to-[#0D1F35] flex items-center justify-center">
        <div className="text-center">
          <svg className="w-12 h-12 mx-auto mb-4 text-white/30 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-white/70 font-medium">Loading admin...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0D1F35] via-[#152d4a] to-[#0D1F35] flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl p-8 shadow-xl max-w-md mx-4">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-500 mb-6">{error || 'You do not have permission to access this area.'}</p>
          <Link
            href="/resources"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0D1F35] text-white rounded-xl hover:bg-[#1a3a5c] font-medium"
          >
            Go to Resources
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-[#0D1F35] text-white">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">Admin Dashboard</h1>
              <p className="text-sm text-gray-400">{data.admin}</p>
            </div>
            <Link href="/resources" className="text-sm text-gray-300 hover:text-white">
              Back to Resources
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="text-3xl font-bold text-gray-900">{data.stats.totalPages}</div>
            <div className="text-sm text-gray-500">Total Pages</div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="text-3xl font-bold text-gray-900">{data.stats.sections}</div>
            <div className="text-sm text-gray-500">Sections</div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="text-3xl font-bold text-gray-900">{data.stats.contentPages}</div>
            <div className="text-sm text-gray-500">Content Pages</div>
          </div>
        </div>

        {/* Gating Rules */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Content Gating Rules</h2>

          {/* Default Level */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Default Access Level (for all content without specific rules)
            </label>
            <select
              value={defaultLevel}
              onChange={(e) => setDefaultLevel(e.target.value as AccessLevel)}
              className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0D1F35] focus:border-transparent"
            >
              <option value="free">Free (anyone)</option>
              <option value="trial">Trial+ (logged in members)</option>
              <option value="active">Active (paying members only)</option>
              <option value="lifetime">Lifetime (lifetime members only)</option>
            </select>
          </div>

          {/* Current Rules */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Current Rules</h3>
            {rules.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No custom rules. All content uses the default level.</p>
            ) : (
              <div className="space-y-2">
                {rules.map((rule, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{rule.slug}</div>
                      {rule.reason && <div className="text-sm text-gray-500">{rule.reason}</div>}
                    </div>
                    <span className={`px-2 py-1 text-xs rounded ${
                      rule.accessLevel === 'free' ? 'bg-green-100 text-green-700' :
                      rule.accessLevel === 'trial' ? 'bg-blue-100 text-blue-700' :
                      rule.accessLevel === 'active' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-purple-100 text-purple-700'
                    }`}>
                      {rule.accessLevel}
                    </span>
                    <button
                      onClick={() => removeRule(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Rule */}
          <div className="border-t pt-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Add New Rule</h3>
            <div className="flex flex-wrap gap-4">
              <input
                type="text"
                placeholder="Content slug (e.g., scaling, exclusive-offers)"
                value={newRule.slug}
                onChange={(e) => setNewRule({ ...newRule, slug: e.target.value })}
                className="flex-1 min-w-[200px] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0D1F35] focus:border-transparent"
              />
              <select
                value={newRule.accessLevel}
                onChange={(e) => setNewRule({ ...newRule, accessLevel: e.target.value as AccessLevel })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0D1F35] focus:border-transparent"
              >
                <option value="free">Free</option>
                <option value="trial">Trial+</option>
                <option value="active">Active</option>
                <option value="lifetime">Lifetime</option>
              </select>
              <input
                type="text"
                placeholder="Reason (optional)"
                value={newRule.reason}
                onChange={(e) => setNewRule({ ...newRule, reason: e.target.value })}
                className="flex-1 min-w-[150px] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0D1F35] focus:border-transparent"
              />
              <button
                onClick={addRule}
                disabled={!newRule.slug}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50"
              >
                Add Rule
              </button>
            </div>
          </div>

          {/* Save Button */}
          <div className="mt-6 pt-6 border-t">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-[#0D1F35] text-white rounded-lg hover:bg-[#1a3a5c] disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Help */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">How Gating Works</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>Rules match content by slug prefix (e.g., &ldquo;scaling&rdquo; matches all pages starting with &ldquo;scaling&rdquo;)</li>
            <li>First matching rule wins - order matters</li>
            <li>Content without a matching rule uses the default level</li>
            <li>Access levels: Free &lt; Trial &lt; Active &lt; Lifetime</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
