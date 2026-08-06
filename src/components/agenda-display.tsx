'use client';

import React, { useState, useEffect } from 'react';
import { Event, AgendaItem } from '@/lib/types';
import { generateBrandedQRCode } from '@/lib/qr-generator';

interface AgendaDisplayProps {
  event: Event;
  userRole?: string;
}

export const AgendaDisplay: React.FC<AgendaDisplayProps> = ({ event, userRole }) => {
  const [selectedAgenda, setSelectedAgenda] = useState<AgendaItem | null>(null);
  const [agendaQrMap, setAgendaQrMap] = useState<Record<string, string>>({});
  const [loadingQr, setLoadingQr] = useState<boolean>(false);

  // Generate branded QR codes for each session in the agenda
  useEffect(() => {
    async function loadAgendaQRs() {
      if (!event.agenda || event.agenda.length === 0) return;
      setLoadingQr(true);
      const map: Record<string, string> = {};

      for (const item of event.agenda) {
        // Embed event and session identifier into encrypted QR code format
        const sessionQrCode = await generateBrandedQRCode(`agenda_${event.id}_${item.id}`, '/nimet-logo.png');
        map[item.id] = sessionQrCode;
      }
      setAgendaQrMap(map);
      setLoadingQr(false);
    }
    loadAgendaQRs();
  }, [event]);

  // Authorization check: Accessible to Super Admins and Scanner Admins
  const canManageAgenda = userRole === 'admin' || userRole === 'scan_admin';

  if (!canManageAgenda) {
    return (
      <div className="p-6 bg-red-50 text-red-700 rounded-xl font-medium">
        Access Denied: Only Super Admins and Scanner Administrators can project Event Agendas & QR Codes.
      </div>
    );
  }

  return (
    <div className="w-full bg-slate-900 text-white rounded-2xl p-6 shadow-2xl border-4 border-[#006B3E]">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center border-b border-slate-700 pb-4 mb-6 gap-4">
        <div className="flex items-center gap-3">
          <img src="/nimet-logo.png" alt="NiMet Logo" className="h-12 w-auto bg-white p-1 rounded-lg" />
          <div>
            <span className="bg-[#F2A900] text-slate-900 text-xs font-black px-2.5 py-0.5 rounded uppercase tracking-wider">
              Live Session Scanner Projection
            </span>
            <h2 className="text-2xl font-black text-white mt-1 uppercase">{event.name}</h2>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-xl border border-slate-700">
          <span className="h-3 w-3 rounded-full bg-emerald-400 animate-ping"></span>
          <span className="text-xs font-bold text-emerald-400 uppercase">Scanner Admin Mode Active</span>
        </div>
      </div>

      {/* Agenda Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(!event.agenda || event.agenda.length === 0) ? (
          <p className="text-slate-400 italic col-span-full">No agenda sessions defined for this event yet.</p>
        ) : (
          event.agenda.map((item, idx) => {
            const qrUrl = agendaQrMap[item.id];
            return (
              <div
                key={item.id || idx}
                className="bg-slate-800 hover:bg-slate-750 transition-colors p-4 rounded-xl border-2 border-slate-700 flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-[#F2A900] bg-slate-900 px-2 py-0.5 rounded">
                      {item.time || `Session ${idx + 1}`}
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold">NiMet Agenda QR</span>
                  </div>

                  <h4 className="text-lg font-bold text-white mb-1 line-clamp-2">{item.title}</h4>
                  {item.speaker && (
                    <p className="text-xs text-emerald-400 font-medium mb-3">🎙️ {item.speaker}</p>
                  )}
                </div>

                {/* Scannable Session QR thumbnail & Display Trigger */}
                <div className="mt-4 pt-3 border-t border-slate-700 flex items-center justify-between">
                  {qrUrl ? (
                    <img
                      src={qrUrl}
                      alt="Session QR"
                      className="w-16 h-16 object-contain bg-white p-1 rounded border border-[#F2A900] cursor-pointer"
                      onClick={() => setSelectedAgenda(item)}
                    />
                  ) : (
                    <div className="w-16 h-16 bg-slate-700 rounded animate-pulse" />
                  )}

                  <button
                    onClick={() => setSelectedAgenda(item)}
                    className="bg-[#006B3E] hover:bg-[#008c52] text-white text-xs font-bold py-2 px-3 rounded-lg shadow transition-colors flex items-center gap-1"
                  >
                    📺 Project Session QR
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Presentation Fullscreen projection modal */}
      {selectedAgenda && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-lg flex flex-col items-center justify-center p-6"
          onClick={() => setSelectedAgenda(null)}
        >
          <div
            className="bg-slate-900 rounded-3xl p-8 max-w-2xl w-full border-4 border-[#006B3E] shadow-2xl flex flex-col items-center relative text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedAgenda(null)}
              className="absolute top-4 right-5 text-slate-400 hover:text-white text-3xl font-bold"
            >
              ✕
            </button>

            <img src="/nimet-logo.png" alt="NiMet Logo" className="h-16 w-auto bg-white p-2 rounded-xl mb-3" />
            <span className="bg-[#F2A900] text-slate-950 text-xs font-black px-4 py-1 rounded-full uppercase tracking-widest mb-3">
              Official Session Attendance QR
            </span>

            <h2 className="text-3xl font-black text-white text-center mb-2">{selectedAgenda.title}</h2>
            {selectedAgenda.speaker && (
              <p className="text-base text-emerald-400 font-bold mb-4">Speaker: {selectedAgenda.speaker}</p>
            )}

            {/* Projected QR Code Pass */}
            <div className="p-5 bg-white rounded-3xl border-4 border-[#F2A900] shadow-2xl my-2 flex items-center justify-center">
              {agendaQrMap[selectedAgenda.id] ? (
                <img
                  src={agendaQrMap[selectedAgenda.id]}
                  alt="Projected Session QR"
                  className="w-80 h-80 object-contain"
                />
              ) : (
                <p className="text-slate-800 font-semibold">Generating QR...</p>
              )}
            </div>

            <p className="text-sm font-semibold text-slate-300 mt-4 text-center">
              Scan using the <span className="text-emerald-400 font-bold">SCP Event App</span> mobile scanner to mark attendance for this session.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
