'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { getUsers } from '@/lib/actions';

export default function ScannerAdminsPage() {
  const { user: currentUser, token } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);
    try {
      const all = await getUsers();
      setUsers(all);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleRoleChange(userId: string, action: 'promote' | 'demote') {
    setActionLoading(userId);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/scanner-admins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ userId, action })
      });
      const data = await res.json();
      if (data.success) {
        setMessage({
          type: 'success',
          text: data.message
        });
        await loadUsers();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update role' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setActionLoading(null);
    }
  }

  const isSuperAdmin = currentUser?.role === 'admin';
  const scannerAdmins = users.filter(u => u.role === 'scan_admin');
  const regularUsers = users.filter(u => u.role === 'user');

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-gray-200 pb-6">
        <div className="h-12 w-12 bg-[#006B3E] rounded-xl flex items-center justify-center shadow">
          <span className="text-white text-2xl">📡</span>
        </div>
        <div>
          <h1 className="text-2xl font-black text-gray-900">Scanner Administrator Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Promote staff to Scanner Admin to authorize QR scanning, Agenda display and pass generation.
          </p>
        </div>
      </div>

      {!isSuperAdmin && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl font-semibold text-sm">
          🔒 Only Super Admins can promote or demote Scanner Administrators.
        </div>
      )}

      {message && (
        <div className={`p-4 rounded-xl font-semibold text-sm ${message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
          {message.text}
        </div>
      )}

      {/* Permissions Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: '📡', label: 'QR Scanning', admin: true, scanAdmin: true },
          { icon: '🎫', label: 'Generate & Display Event QR Passes', admin: true, scanAdmin: true },
          { icon: '📋', label: 'Project Agenda & Session QRs', admin: true, scanAdmin: true },
          { icon: '🔗', label: 'Accept External Links', admin: true, scanAdmin: false },
          { icon: '👥', label: 'Manage Users & Roles', admin: true, scanAdmin: false },
          { icon: '📅', label: 'Create/Edit Events', admin: true, scanAdmin: false },
        ].map((perm) => (
          <div key={perm.label} className="bg-white border border-gray-200 rounded-xl p-4 flex items-start gap-3">
            <span className="text-2xl">{perm.icon}</span>
            <div className="flex-1">
              <p className="text-sm font-bold text-gray-800">{perm.label}</p>
              <div className="flex gap-2 mt-1">
                <span className="text-xs bg-[#E8F5E9] text-[#006B3E] px-2 py-0.5 rounded-full font-semibold">Super Admin ✅</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${perm.scanAdmin ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-400'}`}>
                  Scanner Admin {perm.scanAdmin ? '✅' : '❌'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Active Scanner Admins */}
      <div>
        <h2 className="text-lg font-black text-gray-800 mb-3">
          Active Scanner Administrators ({scannerAdmins.length})
        </h2>
        {loading ? (
          <div className="text-sm text-gray-500 font-medium animate-pulse">Loading users...</div>
        ) : scannerAdmins.length === 0 ? (
          <div className="text-sm text-gray-400 italic bg-gray-50 p-4 rounded-xl border border-gray-200">
            No Scanner Administrators assigned yet. Promote a user below.
          </div>
        ) : (
          <div className="space-y-3">
            {scannerAdmins.map((u) => (
              <div key={u.id} className="flex items-center justify-between bg-[#F0F7F4] border border-[#C8E6C9] rounded-xl p-4">
                <div>
                  <p className="font-bold text-gray-900">{u.fullName}</p>
                  <p className="text-xs text-gray-500">{u.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="bg-[#006B3E] text-white text-xs font-black px-3 py-1 rounded-full">Scanner Admin</span>
                  {isSuperAdmin && (
                    <button
                      onClick={() => handleRoleChange(u.id, 'demote')}
                      disabled={actionLoading === u.id}
                      className="text-xs bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold px-3 py-1.5 rounded-lg border border-rose-200 transition-colors disabled:opacity-50"
                    >
                      {actionLoading === u.id ? '...' : 'Revoke Access'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Standard Users to Promote */}
      {isSuperAdmin && (
        <div>
          <h2 className="text-lg font-black text-gray-800 mb-3">Staff Available for Promotion ({regularUsers.length})</h2>
          {regularUsers.length === 0 ? (
            <p className="text-sm text-gray-400 italic bg-gray-50 p-4 rounded-xl border border-gray-200">No regular users found.</p>
          ) : (
            <div className="space-y-3">
              {regularUsers.map((u) => (
                <div key={u.id} className="flex items-center justify-between bg-white border border-gray-200 rounded-xl p-4 hover:border-[#006B3E]/30 transition-colors">
                  <div>
                    <p className="font-bold text-gray-900">{u.fullName}</p>
                    <p className="text-xs text-gray-500">{u.email}</p>
                  </div>
                  <button
                    onClick={() => handleRoleChange(u.id, 'promote')}
                    disabled={actionLoading === u.id}
                    className="text-xs bg-[#006B3E] hover:bg-[#005430] text-white font-bold px-4 py-2 rounded-lg shadow transition-colors disabled:opacity-50"
                  >
                    {actionLoading === u.id ? 'Promoting...' : '📡 Promote to Scanner Admin'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
