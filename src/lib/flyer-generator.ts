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
        background-color: #ffffff;
        position: relative;
        font-family: 'Montserrat', Arial, sans-serif;
        box-sizing: border-box;
        border: 24px solid #006b3e;
        padding: 40px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        align-items: center;
      ">
        <!-- Inner Gold Border -->
        <div style="
          position: absolute;
          top: 12px;
          bottom: 12px;
          left: 12px;
          right: 12px;
          border: 4px solid #f2a900;
          pointer-events: none;
        "></div>

        <!-- Top Section: Logo & Brand -->
        <div style="
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-top: 20px;
          gap: 15px;
          width: 100%;
        ">
          <img src="/nimet-logo.png" style="
            width: 200px;
            height: auto;
            object-fit: contain;
          " />
          <div style="
            font-size: 14px;
            font-weight: 800;
            color: #555;
            text-transform: uppercase;
            letter-spacing: 4px;
          ">Nigeria Meteorological Agency</div>
        </div>

        <!-- Middle-Top Section: Event Details -->
        <div style="
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
          width: 100%;
          text-align: center;
          padding: 0 40px;
        ">
          <div style="
            font-size: 16px;
            font-weight: 700;
            color: #f2a900;
            text-transform: uppercase;
            letter-spacing: 2px;
          ">Official Event Pass</div>
          
          <div style="
            font-size: 38px;
            font-weight: 900;
            color: #006b3e;
            text-transform: uppercase;
            line-height: 1.25;
            letter-spacing: 1px;
          ">
            ${data.eventName}
          </div>
          
          ${data.eventTheme ? `
            <div style="
              font-size: 18px;
              font-weight: 500;
              color: #666;
              font-style: italic;
              max-width: 85%;
              line-height: 1.4;
            ">
              "${data.eventTheme}"
            </div>
          ` : ''}
        </div>

        <!-- Middle-Bottom Section: Participant Box -->
        <div style="
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
          padding: 0 40px;
        ">
          <div style="
            background-color: #006b3e;
            width: 90%;
            padding: 30px 20px;
            border-radius: 20px;
            box-shadow: 0 10px 25px rgba(0, 107, 62, 0.15);
            text-align: center;
            border-left: 8px solid #f2a900;
            border-right: 8px solid #f2a900;
          ">
            <div style="
              font-size: 13px;
              font-weight: 700;
              color: #f2a900;
              text-transform: uppercase;
              letter-spacing: 3px;
              margin-bottom: 10px;
            ">Verified Attendee</div>
            
            <div style="
              font-size: 40px;
              font-weight: 900;
              color: #ffffff;
              text-transform: uppercase;
              letter-spacing: 1px;
            ">
              ${data.participantName}
            </div>
          </div>
        </div>

        <!-- Bottom Section: Logistics -->
        <div style="
          display: flex;
          justify-content: center;
          gap: 40px;
          width: 90%;
          border-top: 2px solid #eaeaea;
          padding-top: 30px;
          margin-bottom: 20px;
        ">
          <div style="
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 5px;
          ">
            <span style="font-size: 28px;">📍</span>
            <span style="font-weight: 700; color: #333; font-size: 15px; text-transform: uppercase; letter-spacing: 1px;">Venue</span>
            <span style="color: #666; font-size: 14px; text-align: center; font-weight: 500;">${data.eventLocation}</span>
          </div>

          <div style="
            width: 2px;
            background-color: #eaeaea;
          "></div>

          <div style="
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 5px;
          ">
            <span style="font-size: 28px;">📅</span>
            <span style="font-weight: 700; color: #333; font-size: 15px; text-transform: uppercase; letter-spacing: 1px;">Date</span>
            <span style="color: #666; font-size: 14px; text-align: center; font-weight: 500;">
              ${data.eventStartDate} ${data.eventEndDate && data.eventEndDate !== data.eventStartDate ? `<br/>to ${data.eventEndDate}` : ''}
            </span>
          </div>
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
