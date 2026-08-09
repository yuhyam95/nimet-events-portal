'use client';

import React, { useState } from 'react';
import { Event } from '@/lib/types';
import { BrandedQRPass } from './branded-qr-pass';

interface AdminLinkApprovalProps {
  events: Event[];
  userRole?: string;
}

interface ParsedParticipant {
  name: string;
  organization?: string;
  designation?: string;
  email?: string;
  phone?: string;
}

interface EventMeta {
  name?: string;
  date?: string;
  location?: string;
}

type EventMode = 'existing' | 'new';

export const AdminLinkApproval: React.FC<AdminLinkApprovalProps> = ({ events, userRole }) => {
  const [urlInput, setUrlInput] = useState('');
  const [eventMode, setEventMode] = useState<EventMode>('existing');
  const [selectedEventId, setSelectedEventId] = useState(events[0]?.id || '');
  const [newEventName, setNewEventName] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventEndDate, setNewEventEndDate] = useState('');
  const [newEventLocation, setNewEventLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [parsedParticipants, setParsedParticipants] = useState<ParsedParticipant[]>([]);
  const [detectedEventMeta, setDetectedEventMeta] = useState<EventMeta | null>(null);
  const [acceptedParticipants, setAcceptedParticipants] = useState<any[]>([]);
  const [acceptedEventId, setAcceptedEventId] = useState('');
  const [newEventCreated, setNewEventCreated] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const isSuperAdmin = userRole === 'admin';

  const resolvedEventName =
    eventMode === 'existing'
      ? events.find(e => e.id === selectedEventId)?.name || 'NiMet Event'
      : newEventName || 'External Event';

  // ── STEP 1: Parse link ───────────────────────────────────────────────────
  const handleParseLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    setLoading(true);
    setStatusMessage(null);
    setAcceptedParticipants([]);
    setDetectedEventMeta(null);

    try {
      const res = await fetch('/api/admin/external-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: urlInput.trim(),
          eventId: eventMode === 'existing' ? selectedEventId : undefined,
          action: 'parse',
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setStatusMessage({ type: 'error', text: data.error || 'Failed to parse external link.' });
        setParsedParticipants([]);
      } else {
        setParsedParticipants(data.participants || []);

        // If detected event meta from the link, pre-fill the new event fields
        if (data.eventMeta?.name && eventMode === 'new') {
          setDetectedEventMeta(data.eventMeta);
          if (!newEventName && data.eventMeta.name) setNewEventName(data.eventMeta.name);
          if (!newEventDate && data.eventMeta.date) setNewEventDate(data.eventMeta.date);
          if (!newEventLocation && data.eventMeta.location) setNewEventLocation(data.eventMeta.location);
        }

        setStatusMessage({
          type: 'info',
          text: `Found ${data.participants?.length || 0} participant(s). Review below then accept.`,
        });
      }
    } catch {
      setStatusMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  // ── STEP 2: Accept link ──────────────────────────────────────────────────
  const handleAcceptLink = async () => {
    if (!isSuperAdmin) {
      setStatusMessage({ type: 'error', text: 'Access Denied: Only Super Admins can accept external links.' });
      return;
    }

    if (parsedParticipants.length === 0) return;
    if (eventMode === 'new' && !newEventName.trim()) {
      setStatusMessage({ type: 'error', text: 'Please enter an event name for the new external event.' });
      return;
    }
    if (eventMode === 'new' && !newEventDate) {
      setStatusMessage({ type: 'error', text: 'Please enter a start date for the new external event.' });
      return;
    }

    setLoading(true);
    setStatusMessage(null);

    try {
      const body: any = {
        url: urlInput.trim(),
        action: 'accept',
        participants: parsedParticipants,
      };

      if (eventMode === 'existing') {
        body.eventId = selectedEventId;
      } else {
        body.newEvent = {
          name: newEventName.trim(),
          startDate: newEventDate,
          endDate: newEventEndDate || newEventDate,
          location: newEventLocation.trim() || 'TBD',
        };
      }

      const res = await fetch('/api/admin/external-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setStatusMessage({ type: 'error', text: data.error || 'Failed to accept link.' });
      } else {
        setAcceptedParticipants(data.participants || []);
        setAcceptedEventId(data.eventId || selectedEventId);
        setNewEventCreated(data.newEventCreated || false);
        setStatusMessage({
          type: 'success',
          text: `✅ Accepted! ${data.registeredCount} participant(s) registered.${data.newEventCreated ? ' New external event created on the portal.' : ''}`,
        });
        setParsedParticipants([]);
        setUrlInput('');
        if (eventMode === 'new') {
          setNewEventName('');
          setNewEventDate('');
          setNewEventEndDate('');
          setNewEventLocation('');
        }
      }
    } catch {
      setStatusMessage({ type: 'error', text: 'Network error accepting link.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-white rounded-2xl p-6 shadow-xl border-2 border-gray-200 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
        <div>
          <span className="text-xs font-extrabold text-[#006B3E] uppercase tracking-wider bg-[#E8F5E9] px-2.5 py-1 rounded-md">
            Link Intake & QR Pass Generator
          </span>
          <h2 className="text-2xl font-black text-gray-900 mt-1">External Links & Invitation Intake</h2>
        </div>
        {!isSuperAdmin && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs px-3 py-1.5 rounded-lg font-bold">
            🔒 Scanner Admin — Acceptance requires Super Admin
          </div>
        )}
      </div>

      {/* Link Input Form */}
      <form onSubmit={handleParseLink} className="space-y-4">
        {/* Event Mode Toggle */}
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Target Event</label>
          <div className="flex gap-2 mb-3">
            <button
              type="button"
              onClick={() => setEventMode('existing')}
              className={`flex-1 py-2 px-4 rounded-xl text-sm font-bold border-2 transition-colors ${
                eventMode === 'existing'
                  ? 'bg-[#006B3E] text-white border-[#006B3E]'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-[#006B3E]/40'
              }`}
            >
              📅 Link to Existing Event
            </button>
            <button
              type="button"
              onClick={() => setEventMode('new')}
              className={`flex-1 py-2 px-4 rounded-xl text-sm font-bold border-2 transition-colors ${
                eventMode === 'new'
                  ? 'bg-[#006B3E] text-white border-[#006B3E]'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-[#006B3E]/40'
              }`}
            >
              ✨ New External Event
            </button>
          </div>

          {/* Existing Event Selector */}
          {eventMode === 'existing' && (
            <select
              value={selectedEventId}
              onChange={e => setSelectedEventId(e.target.value)}
              className="w-full text-sm p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#006B3E] focus:outline-none bg-white font-medium"
            >
              {events.length === 0 && <option value="">No events available</option>}
              {events.map(ev => (
                <option key={ev.id} value={ev.id}>
                  {ev.name} — {ev.startDate}
                </option>
              ))}
            </select>
          )}

          {/* New Event Fields */}
          {eventMode === 'new' && (
            <div className="bg-[#F0F7F4] border border-[#C8E6C9] rounded-xl p-4 space-y-3">
              <p className="text-xs font-bold text-[#006B3E] uppercase tracking-wide">
                ✨ New External Event Details
              </p>
              {detectedEventMeta?.name && (
                <div className="text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-lg p-2 font-medium">
                  ℹ️ Auto-detected from link: <strong>{detectedEventMeta.name}</strong>
                  {detectedEventMeta.date && ` · ${detectedEventMeta.date}`}
                  {detectedEventMeta.location && ` · ${detectedEventMeta.location}`}
                </div>
              )}
              <input
                type="text"
                value={newEventName}
                onChange={e => setNewEventName(e.target.value)}
                placeholder="Event Name *"
                className="w-full text-sm p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#006B3E] focus:outline-none"
                required={eventMode === 'new'}
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 font-semibold mb-1 block">Start Date *</label>
                  <input
                    type="date"
                    value={newEventDate}
                    onChange={e => setNewEventDate(e.target.value)}
                    className="w-full text-sm p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#006B3E] focus:outline-none"
                    required={eventMode === 'new'}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-semibold mb-1 block">End Date</label>
                  <input
                    type="date"
                    value={newEventEndDate}
                    onChange={e => setNewEventEndDate(e.target.value)}
                    className="w-full text-sm p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#006B3E] focus:outline-none"
                  />
                </div>
              </div>
              <input
                type="text"
                value={newEventLocation}
                onChange={e => setNewEventLocation(e.target.value)}
                placeholder="Venue / Location (optional)"
                className="w-full text-sm p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#006B3E] focus:outline-none"
              />
            </div>
          )}
        </div>

        {/* Link Input — appears below event selection */}
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
            External Source Link
          </label>
          <input
            type="url"
            value={urlInput}
            onChange={e => setUrlInput(e.target.value)}
            placeholder="https://docs.google.com/spreadsheets/d/... or https://example.com?name=John&org=Agency"
            className="w-full text-sm p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#006B3E] focus:outline-none"
            required
          />
          <p className="text-xs text-gray-400 mt-1">
            Accepts formatted URLs with query params, Google Sheets links, or CSV links.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-[#006B3E] hover:bg-[#005430] text-white text-sm font-bold py-3 px-6 rounded-xl shadow transition-colors disabled:opacity-50"
        >
          {loading ? 'Parsing...' : '🔍 Parse & Preview Link'}
        </button>
      </form>

      {/* Status Message */}
      {statusMessage && (
        <div
          className={`p-4 rounded-xl font-semibold text-sm ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : statusMessage.type === 'error'
              ? 'bg-rose-50 text-rose-800 border border-rose-200'
              : 'bg-blue-50 text-blue-800 border border-blue-200'
          }`}
        >
          {statusMessage.text}
        </div>
      )}

      {/* Parsed Participants Preview */}
      {parsedParticipants.length > 0 && (
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
            <div>
              <h3 className="text-base font-extrabold text-gray-800 uppercase">
                Participant Preview ({parsedParticipants.length})
              </h3>
              <p className="text-xs text-gray-500 mt-0.5 font-medium">
                Event: <span className="text-[#006B3E] font-bold">{resolvedEventName}</span>
                {eventMode === 'new' && (
                  <span className="ml-2 bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded font-bold">
                    New Event — will be created on Accept
                  </span>
                )}
              </p>
            </div>

            {isSuperAdmin ? (
              <button
                onClick={handleAcceptLink}
                disabled={loading || (eventMode === 'new' && (!newEventName || !newEventDate))}
                className="bg-[#F2A900] hover:bg-[#d99700] text-gray-950 font-black text-xs py-2.5 px-5 rounded-xl shadow-lg transition-colors flex items-center gap-1 disabled:opacity-50"
              >
                ✅ Accept Link & Generate QR Passes
              </button>
            ) : (
              <span className="text-xs font-bold text-rose-600 bg-rose-50 px-3 py-1 rounded-lg border border-rose-200">
                Super Admin approval required
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-200 text-gray-700 uppercase font-bold">
                <tr>
                  <th className="p-2">#</th>
                  <th className="p-2">Name</th>
                  <th className="p-2">Organization</th>
                  <th className="p-2">Designation</th>
                  <th className="p-2">Contact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 font-medium text-gray-800">
                {parsedParticipants.map((p, idx) => (
                  <tr key={idx} className="hover:bg-gray-100">
                    <td className="p-2 text-gray-400">{idx + 1}</td>
                    <td className="p-2 font-bold text-[#006B3E]">{p.name}</td>
                    <td className="p-2">{p.organization || '—'}</td>
                    <td className="p-2">{p.designation || '—'}</td>
                    <td className="p-2">{p.email || p.phone || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Generated Branded QR Passes */}
      {acceptedParticipants.length > 0 && (
        <div className="border-t border-gray-200 pt-6 space-y-4">
          <div className="flex items-center gap-3">
            <div>
              <h3 className="text-xl font-black text-[#006B3E] uppercase">
                🎉 Branded QR Passes Ready
              </h3>
              <p className="text-xs text-gray-500 font-medium mt-0.5">
                {newEventCreated && (
                  <span className="text-emerald-700 font-bold">New event created on portal. </span>
                )}
                {acceptedParticipants.length} pass(es) generated — click <strong>Display for Scan</strong> to show on screen or <strong>Download</strong> to save.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {acceptedParticipants.map(participant => (
              <BrandedQRPass
                key={participant.id}
                participantId={participant.id}
                participantName={participant.name}
                organization={participant.organization}
                eventName={resolvedEventName}
                designation={participant.designation}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
