interface FlyerData {
  eventName: string;
  eventTheme: string;
  eventDate: string;
  participantName: string;
}

export function generateFlyer(data: FlyerData): Promise<string> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      resolve('');
      return;
    }

    // Set canvas size (A4 ratio)
    canvas.width = 800;
    canvas.height = 600;

    // Background - Pure white
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Organization Logo/Title (NIMET)
    ctx.fillStyle = '#166534';
    ctx.font = 'bold 48px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('NIMET', canvas.width / 2, 80);

    // Subtitle
    ctx.fillStyle = '#15803d';
    ctx.font = '24px Arial, sans-serif';
    ctx.fillText('Nigerian Meteorological Agency', canvas.width / 2, 110);

    // Event Name
    ctx.fillStyle = '#166534';
    ctx.font = 'bold 36px Arial, sans-serif';
    ctx.fillText(data.eventName, canvas.width / 2, 180);

    // Event Theme
    if (data.eventTheme) {
      ctx.fillStyle = '#15803d';
      ctx.font = '20px Arial, sans-serif';
      ctx.fillText(`Theme: ${data.eventTheme}`, canvas.width / 2, 220);
    }

    // Event Date
    ctx.fillStyle = '#15803d';
    ctx.font = '24px Arial, sans-serif';
    ctx.fillText(data.eventDate, canvas.width / 2, 260);

    // Decorative line
    ctx.strokeStyle = '#166534';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(100, 300);
    ctx.lineTo(canvas.width - 100, 300);
    ctx.stroke();

    // Participant section
    ctx.fillStyle = '#166534';
    ctx.font = 'bold 32px Arial, sans-serif';
    ctx.fillText('PARTICIPANT', canvas.width / 2, 350);

    // Participant name - Made bigger
    ctx.fillStyle = '#166534';
    ctx.font = 'bold 42px Arial, sans-serif';
    ctx.fillText(data.participantName, canvas.width / 2, 400);

    // Add some decorative elements
    ctx.strokeStyle = '#166534';
    ctx.lineWidth = 1;
    
    // Top border
    ctx.beginPath();
    ctx.moveTo(50, 50);
    ctx.lineTo(canvas.width - 50, 50);
    ctx.stroke();
    
    // Bottom border
    ctx.beginPath();
    ctx.moveTo(50, canvas.height - 50);
    ctx.lineTo(canvas.width - 50, canvas.height - 50);
    ctx.stroke();

    // Corner decorations
    ctx.fillStyle = '#166534';
    ctx.fillRect(50, 50, 20, 20);
    ctx.fillRect(canvas.width - 70, 50, 20, 20);
    ctx.fillRect(50, canvas.height - 70, 20, 20);
    ctx.fillRect(canvas.width - 70, canvas.height - 70, 20, 20);

    // Convert to data URL
    const dataUrl = canvas.toDataURL('image/png');
    resolve(dataUrl);
  });
}

export function downloadFlyer(dataUrl: string, filename: string) {
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
