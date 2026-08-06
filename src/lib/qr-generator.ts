import QRCode from 'qrcode';

// Simple encryption/decryption for participant IDs
const ENCRYPTION_KEY = process.env.QR_ENCRYPTION_KEY || 'nimet-events-2024-default-key';

// Ensure the key is always defined
if (!ENCRYPTION_KEY) {
  throw new Error('QR_ENCRYPTION_KEY is not defined');
}

function simpleEncrypt(text: string): string {
  console.log('ENCRYPTION_KEY:', ENCRYPTION_KEY);
  console.log('ENCRYPTION_KEY length:', ENCRYPTION_KEY?.length);
  console.log('text to encrypt:', text);
  
  if (!ENCRYPTION_KEY) {
    throw new Error('ENCRYPTION_KEY is undefined');
  }
  
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length);
    result += String.fromCharCode(charCode);
  }
  return btoa(result); // Base64 encode
}

function simpleDecrypt(encryptedText: string): string {
  try {
    const decoded = atob(encryptedText); // Base64 decode
    let result = '';
    for (let i = 0; i < decoded.length; i++) {
      const charCode = decoded.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length);
      result += String.fromCharCode(charCode);
    }
    return result;
  } catch (error) {
    throw new Error('Invalid QR code');
  }
}

export function generateQRCodeData(participantId: string): string {
  console.log('generateQRCodeData called with participantId:', participantId);
  const encryptedId = simpleEncrypt(participantId);
  return `nimet://attendance/${encryptedId}`;
}

export function decryptQRCodeData(qrData: string): string {
  // Extract the encrypted ID from the QR code data
  const match = qrData.match(/nimet:\/\/attendance\/(.+)/);
  if (!match) {
    throw new Error('Invalid QR code format');
  }
  
  const encryptedId = match[1];
  return simpleDecrypt(encryptedId);
}

export async function generateQRCode(participantId: string): Promise<string> {
  console.log('generateQRCode called with participantId:', participantId);
  const qrData = generateQRCodeData(participantId);
  
  try {
    const qrCodeDataURL = await QRCode.toDataURL(qrData, {
      width: 250,
      margin: 2,
      errorCorrectionLevel: 'H',
      color: {
        dark: '#006B3E',
        light: '#FFFFFF'
      }
    });
    
    return qrCodeDataURL;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
}

export async function generateBrandedQRCode(participantId: string, logoUrl = '/nimet-logo.png'): Promise<string> {
  const qrData = generateQRCodeData(participantId);
  
  // High error correction level ensures QR is still easily scannable with center logo
  const rawQrUrl = await QRCode.toDataURL(qrData, {
    width: 320,
    margin: 3,
    errorCorrectionLevel: 'H',
    color: {
      dark: '#006B3E',
      light: '#FFFFFF'
    }
  });

  if (typeof window === 'undefined') {
    return rawQrUrl; // Server-side fallback
  }

  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      resolve(rawQrUrl);
      return;
    }

    const size = 360;
    const padding = 20;
    canvas.width = size;
    canvas.height = size;

    // Draw background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, size, size);

    // Draw outer NiMet green border
    ctx.strokeStyle = '#006B3E';
    ctx.lineWidth = 8;
    ctx.strokeRect(4, 4, size - 8, size - 8);

    // Draw inner gold border accent
    ctx.strokeStyle = '#F2A900';
    ctx.lineWidth = 3;
    ctx.strokeRect(10, 10, size - 20, size - 20);

    const qrImage = new Image();
    qrImage.onload = () => {
      // Draw QR Code
      const qrSize = size - (padding * 2);
      ctx.drawImage(qrImage, padding, padding, qrSize, qrSize);

      // Load & draw center NiMet Logo
      const logoImage = new Image();
      logoImage.onload = () => {
        const logoSize = 64;
        const logoX = (size - logoSize) / 2;
        const logoY = (size - logoSize) / 2;

        // White circular background behind logo for clean scanning contrast
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, logoSize / 2 + 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#F2A900';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw center logo
        ctx.drawImage(logoImage, logoX, logoY, logoSize, logoSize);
        resolve(canvas.toDataURL('image/png'));
      };
      logoImage.onerror = () => {
        // Fallback if logo fails to load
        resolve(canvas.toDataURL('image/png'));
      };
      logoImage.src = logoUrl;
    };
    qrImage.onerror = () => resolve(rawQrUrl);
    qrImage.src = rawQrUrl;
  });
}

export function downloadQRCode(dataUrl: string, filename: string) {
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

