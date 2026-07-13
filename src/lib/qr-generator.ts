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
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    
    return qrCodeDataURL;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
}

export function downloadQRCode(dataUrl: string, filename: string) {
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
