import html2canvas from 'html2canvas';

interface FlyerData {
  eventName: string;
  eventTheme: string;
  eventStartDate: string;
  eventEndDate: string;
  eventLocation: string;
  participantName: string;
}

export function generateFlyer(data: FlyerData): Promise<string> {
  return new Promise((resolve) => {
    // Create a temporary DOM element to render the HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = `
      <div style="
        width: 900px;
        height: 1200px;
        background-image: url('/participant-tag.jpg');
        background-size: cover;
        background-position: center;
        background-repeat: no-repeat;
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: 'Montserrat', Arial, sans-serif;
      ">
        <!-- Participant Name Overlay -->
        <div style="
          position: absolute;
          bottom: 420px;
          left: 200px;
          right: 50px;
          text-align: center;
          background: rgba(255, 255, 255, 0.9);
          padding: 20px 40px;
          border-radius: 15px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
          border: 3px solid #7bc043;
        ">
          <div style="
            font-size: 36px;
            font-weight: 700;
            color: #006400;
            text-transform: uppercase;
            letter-spacing: 2px;
            /* text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1); */
          ">${data.participantName}</div>
        </div>
      </div>
    `;

    // Create canvas and render the HTML
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      resolve('');
      return;
    }

    // Set canvas size
    canvas.width = 900;
    canvas.height = 1200;

    // Create a temporary container and append the HTML
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '-9999px';
    container.appendChild(tempDiv);
    document.body.appendChild(container);

    // Use html2canvas to convert HTML to PNG
    html2canvas(tempDiv, {
      width: 900,
      height: 1200,
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false
    }).then((canvas: HTMLCanvasElement) => {
      const dataUrl = canvas.toDataURL('image/png');
      document.body.removeChild(container);
      resolve(dataUrl);
    }).catch((error) => {
      console.error('Failed to generate flyer with html2canvas:', error);
      // Fallback to basic canvas rendering
      const dataUrl = canvas.toDataURL('image/png');
      document.body.removeChild(container);
      resolve(dataUrl);
    });
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
