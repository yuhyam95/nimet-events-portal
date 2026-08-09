'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { getEvents } from '@/lib/actions';
import { AdminLinkApproval } from '@/components/admin-link-approval';
import { Event } from '@/lib/types';

export default function ExternalLinksPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const all = await getEvents();
        setEvents(all);
      } catch (err) {
        console.error('Failed to load events:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4 border-b border-gray-200 pb-6">
        <div className="h-12 w-12 bg-[#006B3E] rounded-xl flex items-center justify-center shadow">
          <span className="text-white text-2xl">🔗</span>
        </div>
        <div>
          <h1 className="text-2xl font-black text-gray-900">External Links & Invitation QR Intake</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Submit formatted URLs or Google Sheet links to parse and generate branded NiMet QR passes for external attendees.
            {user?.role !== 'admin' && (
              <span className="ml-2 text-amber-600 font-bold">
                (Link acceptance requires Super Admin approval)
              </span>
            )}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400 font-semibold animate-pulse">Loading events...</div>
      ) : events.length === 0 ? (
        <div className="text-center py-12 text-gray-400 font-semibold italic">No active events found. Create an event first.</div>
      ) : (
        <AdminLinkApproval events={events} userRole={user?.role} />
      )}
    </div>
  );
}
