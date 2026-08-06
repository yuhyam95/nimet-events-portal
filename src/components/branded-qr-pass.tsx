'use client';

import React, { useState, useEffect } from 'react';
import { generateBrandedQRCode, downloadQRCode } from '@/lib/qr-generator';

interface BrandedQRPassProps {
  participantId: string;
  participantName: string;
  organization?: string;
  eventName: string;
  designation?: string;
}

export const BrandedQRPass: React.FC<BrandedQRPassProps> = ({
  participantId,
  participantName,
  organization,
  eventName,
  designation
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    async function loadQR() {
      try {
        setLoading(true);
        const url = await generateBrandedQRCode(participantId, '/nimet-logo.png');
        if (isMounted) {
          setQrDataUrl(url);
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to generate branded QR pass:', err);
        if (isMounted) setLoading(false);
      }
    }
    loadQR();
    return () => { isMounted = false; };
  }, [participantId]);

  const handleDownload = () => {
    if (qrDataUrl) {
      downloadQRCode(qrDataUrl, `NiMet-Pass-${participantName.replace(/\s+/g, '_')}.png`);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4 bg-white rounded-xl border-2 border-[#006B3E] shadow-lg max-w-sm">
      {/* Brand Header */}
      <div className="flex items-center gap-2 border-b border-gray-100 pb-2 w-full justify-center">
        <img src="/nimet-logo.png" alt="NiMet Logo" className="h-8 w-auto object-contain" />
        <div className="text-center">
          <p className="text-xs font-bold text-[#006B3E] tracking-wider uppercase">NiMet Event Pass</p>
          <p className="text-[10px] text-gray-500 font-semibold uppercase">{eventName}</p>
        </div>
      </div>

      {/* Branded QR Pass Display Box */}
      <div className="relative p-3 bg-gradient-to-b from-[#F0F7F4] to-white rounded-lg border-2 border-[#F2A900] shadow-sm flex flex-col items-center">
        {loading ? (
          <div className="w-56 h-56 flex items-center justify-center text-sm font-semibold text-[#006B3E]">
            Generating Branded QR...
          </div>
        ) : (
          <img
            src={qrDataUrl}
            alt="Branded NiMet QR Pass"
            className="w-56 h-56 object-contain rounded cursor-pointer hover:scale-105 transition-transform"
            onClick={() => setIsFullScreen(true)}
            title="Click to view full screen for scanning"
          />
        )}
        
        <p className="text-[11px] text-[#006B3E] font-extrabold mt-2 tracking-wide uppercase bg-[#E8F5E9] px-2 py-0.5 rounded-full">
          Official Verified Pass
        </p>
      </div>

      {/* Participant Info */}
      <div className="text-center w-full">
        <h4 className="text-lg font-extrabold text-gray-800 uppercase leading-tight">{participantName}</h4>
        {designation && <p className="text-xs font-medium text-gray-600">{designation}</p>}
        {organization && (
          <p className="text-xs font-bold text-[#006B3E] mt-1 bg-gray-50 py-1 px-2 rounded">
            {organization}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 w-full pt-2 border-t border-gray-100">
        <button
          onClick={() => setIsFullScreen(true)}
          className="flex-1 bg-[#006B3E] hover:bg-[#005430] text-white text-xs font-bold py-2.5 px-3 rounded-lg shadow transition-colors flex items-center justify-center gap-1"
        >
          📱 Display for Scan
        </button>
        <button
          onClick={handleDownload}
          disabled={!qrDataUrl}
          className="flex-1 bg-[#F2A900] hover:bg-[#d99700] text-gray-900 text-xs font-bold py-2.5 px-3 rounded-lg shadow transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
        >
          💾 Download Pass
        </button>
      </div>

      {/* Full Screen Display Modal */}
      {isFullScreen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4"
          onClick={() => setIsFullScreen(false)}
        >
          <div
            className="bg-white rounded-3xl p-6 max-w-md w-full flex flex-col items-center border-4 border-[#006B3E] shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsFullScreen(false)}
              className="absolute top-3 right-4 text-gray-400 hover:text-gray-700 text-2xl font-bold"
            >
              ✕
            </button>

            <img src="/nimet-logo.png" alt="NiMet Logo" className="h-12 w-auto object-contain mb-2" />
            <span className="bg-[#E8F5E9] text-[#006B3E] font-black text-xs px-3 py-1 rounded-full uppercase tracking-wider mb-3">
              Official Invitation QR Pass
            </span>

            <h3 className="text-2xl font-black text-gray-900 uppercase text-center mb-1">{participantName}</h3>
            <p className="text-sm font-semibold text-[#006B3E] mb-4 text-center">{organization || eventName}</p>

            <div className="p-4 bg-white rounded-2xl border-4 border-[#F2A900] shadow-inner mb-4 flex items-center justify-center">
              <img src={qrDataUrl} alt="Branded QR" className="w-72 h-72 object-contain" />
            </div>

            <p className="text-xs text-gray-500 font-semibold text-center mb-4">
              Hold device up to the scanner app camera to verify attendance.
            </p>

            <button
              onClick={() => setIsFullScreen(false)}
              className="w-full bg-[#006B3E] text-white font-bold py-3 rounded-xl shadow-lg hover:bg-[#005430]"
            >
              Close Fullscreen
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
