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
        background: #ffffff;
        padding: 40px;
        box-sizing: border-box;
        font-family: 'Montserrat', Arial, sans-serif;
        color: #0e1116;
        position: relative;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
      ">
        <!-- Header Section -->
        <div style="flex: 0 0 auto;">
          <!-- Topbar -->
          <div style="
            height: 10px;
            background: #7bc043;
            width: 48%;
            border-radius: 10px;
            margin: 0 auto 20px auto;
          "></div>

          <!-- Logo -->
          <div style="text-align: center; margin-bottom: 20px; display: flex; justify-content: center; align-items: center;">
            <img src="/nimet-logo.png" alt="NiMet Logo" style="max-height: 65px; width: auto; display: block;">
          </div>

          <!-- Ribbon -->
          <div style="
            display: block;
            background: #7bc043;
            color: #fff;
            font-weight: 600;
            letter-spacing: 0.15em;
            padding: 10px 20px;
            border-radius: 10px;
            margin: 15px auto;
            text-transform: uppercase;
            text-align: center;
            width: 50%;
            font-size: 16px;
          ">Presents</div>
        </div>

        <!-- Badge Section -->
        <div style="
          background: linear-gradient(180deg, #344248 0%, #1f2a2f 100%);
          color: #fff;
          border-radius: 26px;
          padding: 30px;
          margin: 20px 0;
          text-align: center;
          flex: 0 0 auto;
        ">
          <h1 style="
            font-family: 'Oswald', 'Montserrat', sans-serif;
            text-transform: uppercase;
            line-height: 1.1;
            font-weight: 500;
            font-size: 36px;
            margin: 0;
          ">
            <span style="color: #7bc043; font-weight: 700;">${data.eventName.split(':')[0] || data.eventName}</span><br>
            ${data.eventTheme}<br>
          </h1>
        </div>

        <!-- Participant Section -->
        <div style="
          background: #fff;
          border: 3px solid #1a1a1a;
          border-radius: 12px;
          padding: 25px;
          text-align: center;
          flex: 0 0 auto;
        ">
          <span style="
            display: block;
            font-weight: 900;
            font-size: 32px;
            text-transform: uppercase;
            margin-bottom: 20px;
          ">Participant</span>
          <div style="
            font-size: 48px;
            font-weight: 600;
            color: #333;
            min-height: 40px;
            border-top: 2px dashed #888;
            padding-top: 15px;
            margin-bottom: 15px;
          ">${data.participantName}</div>
          <div style="
            height: 12px;
            background: #0d1317;
            border-radius: 8px;
            margin: 0 auto;
            width: 35%;
          "></div>
        </div>

        <!-- Event Details -->
        <div style="
          margin: 20px 0;
          font-size: 16px;
          color: #333;
          line-height: 1.6;
          text-align: center;
          flex: 0 0 auto;
        ">
          <div style="
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            margin-bottom: 15px;
          ">
            <span style="font-size: 20px;">📅</span>
            <strong style="color: #7bc043; font-size: 20px;">Date:</strong>
            <span style="font-size: 20px;">${data.eventStartDate} - ${data.eventEndDate}</span>
          </div>
          <div style="
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            margin-bottom: 15px;
          ">
            <span style="font-size: 20px;">🕐</span>
            <strong style="color: #7bc043; font-size: 20px;">Time:</strong>
            <span style="font-size: 20px;">9:00 AM</span>
          </div>
          <div style="
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            margin-bottom: 15px;
          ">
            <span style="font-size: 20px;">📍</span>
            <strong style="color: #7bc043; font-size: 20px;">Venue:</strong>
            <span style="font-size: 20px;">${data.eventLocation}</span>
          </div>
        </div>

        <!-- Social Media -->
        <div style="
          margin-top: 0;
          font-size: 12px;
          font-weight: 600;
          color: #111;
          text-align: center;
          flex: 0 0 auto;
        ">
          <div style="
            display: flex;
            justify-content: center;
            gap: 12px;
            flex-wrap: wrap;
          ">
            <div style="display: flex; align-items: center; gap: 8px; white-space: nowrap; justify-content: center;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="color: #E4405F;">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
              @officialnimetng
            </div>
            <div style="display: flex; align-items: center; gap: 8px; white-space: nowrap; justify-content: center;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="color: #FF0000;">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="color: #1877F2;">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="color: #0077B5;">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
             Nigerian Meteorological Agency
            </div>
            <div style="display: flex; align-items: center; gap: 8px; white-space: nowrap; justify-content: center;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="color: #000000;">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              @nimetnigeria
            </div>
            <div style="display: flex; align-items: center; gap: 8px; white-space: nowrap; justify-content: center;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="color: #333;">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm-2 16v-6h2v6h-2zm1 1a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm-1-9a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"/>
              </svg>
              www.nimet.gov.ng
            </div>
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
