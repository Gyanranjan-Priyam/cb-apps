import jsPDF from 'jspdf';

interface RegistrationDetails {
  fullName: string;
  email: string;
  mobileNumber: string;
  whatsappNumber?: string;
  aadhaarNumber: string;
  state: string;
  district: string;
  collegeName: string;
  collegeAddress: string;
  eventTitle: string;
  eventDate: string;
  eventVenue: string;
  registrationId: string;
  price: number;
  registeredAt: Date;
}

export async function generateRegistrationPDF(details: RegistrationDetails): Promise<Buffer> {
  const pdf = new jsPDF();
  
  // Set font and add title
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text('REGISTRATION CONFIRMATION', 105, 20, { align: 'center' });
  
  // Add event title
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'normal');
  pdf.text(details.eventTitle, 105, 35, { align: 'center' });
  
  // Add horizontal line
  pdf.setLineWidth(0.5);
  pdf.line(20, 45, 190, 45);
  
  // Event Details Section
  let yPosition = 60;
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('EVENT DETAILS', 20, yPosition);
  
  yPosition += 10;
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  
  const eventDetails = [
    ['Event Name:', details.eventTitle],
    ['Event Date:', details.eventDate],
    ['Venue:', details.eventVenue],
    ['Registration Fee:', `₹${details.price}`],
    ['Registration ID:', details.registrationId],
    ['Registration Date:', details.registeredAt.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })]
  ];
  
  eventDetails.forEach(([label, value]) => {
    pdf.setFont('helvetica', 'bold');
    pdf.text(label, 25, yPosition);
    pdf.setFont('helvetica', 'normal');
    pdf.text(value, 80, yPosition);
    yPosition += 8;
  });
  
  // Participant Details Section
  yPosition += 10;
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('PARTICIPANT DETAILS', 20, yPosition);
  
  yPosition += 10;
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  
  const participantDetails = [
    ['Full Name:', details.fullName],
    ['Email Address:', details.email],
    ['Mobile Number:', details.mobileNumber],
    ...(details.whatsappNumber ? [['WhatsApp Number:', details.whatsappNumber]] : []),
    ['Aadhaar Number:', details.aadhaarNumber],
    ['State:', details.state],
    ['District:', details.district],
    ['College Name:', details.collegeName],
    ['College Address:', details.collegeAddress]
  ];
  
  participantDetails.forEach(([label, value]) => {
    pdf.setFont('helvetica', 'bold');
    pdf.text(label, 25, yPosition);
    pdf.setFont('helvetica', 'normal');
    
    // Handle long text wrapping
    const text = pdf.splitTextToSize(value, 100);
    pdf.text(text, 80, yPosition);
    yPosition += text.length * 6 + 2;
  });
  
  // Important Instructions Section
  yPosition += 15;
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('IMPORTANT INSTRUCTIONS', 20, yPosition);
  
  yPosition += 10;
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  
  const instructions = [
    '• Please arrive at the venue at least 30 minutes before the event starts',
    '• Bring a valid government-issued photo ID for verification',
    '• Keep this registration confirmation for check-in at the event',
    '• For any queries, contact our support team',
    '• Your registration is confirmed once payment is verified by our team'
  ];
  
  instructions.forEach(instruction => {
    const text = pdf.splitTextToSize(instruction, 160);
    pdf.text(text, 25, yPosition);
    yPosition += text.length * 5 + 3;
  });
  
  // Add footer
  yPosition = 280;
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'italic');
  pdf.text('This is an automatically generated document. Please keep it for your records.', 105, yPosition, { align: 'center' });
  
  // Add contact information
  yPosition += 8;
  pdf.text('For support: support@CodeBreakers.gcek.edu.in | Website: www.CodeBreakers.gcek.edu.in', 105, yPosition, { align: 'center' });
  
  // Convert to buffer
  const pdfOutput = pdf.output('arraybuffer');
  return Buffer.from(pdfOutput);
}

export async function generateRegistrationHTML(details: RegistrationDetails): Promise<string> {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 20px;
          color: #333;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #007bff;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .title {
          font-size: 24px;
          font-weight: bold;
          color: #007bff;
          margin: 0;
        }
        .event-title {
          font-size: 18px;
          margin: 10px 0;
        }
        .section {
          margin-bottom: 25px;
        }
        .section-title {
          font-size: 16px;
          font-weight: bold;
          color: #007bff;
          margin-bottom: 15px;
          border-bottom: 1px solid #ddd;
          padding-bottom: 5px;
        }
        .detail-row {
          display: flex;
          margin-bottom: 8px;
        }
        .label {
          font-weight: bold;
          width: 180px;
          color: #555;
        }
        .value {
          flex: 1;
        }
        .instructions {
          background-color: #f8f9fa;
          padding: 15px;
          border-left: 4px solid #28a745;
          border-radius: 4px;
        }
        .instructions ul {
          margin: 0;
          padding-left: 20px;
        }
        .instructions li {
          margin-bottom: 5px;
        }
        .footer {
          margin-top: 40px;
          text-align: center;
          font-size: 12px;
          color: #666;
          border-top: 1px solid #ddd;
          padding-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1 class="title">REGISTRATION CONFIRMATION</h1>
        <div class="event-title">${details.eventTitle}</div>
      </div>
      
      <div class="section">
        <h2 class="section-title">EVENT DETAILS</h2>
        <div class="detail-row">
          <span class="label">Event Name:</span>
          <span class="value">${details.eventTitle}</span>
        </div>
        <div class="detail-row">
          <span class="label">Event Date:</span>
          <span class="value">${details.eventDate}</span>
        </div>
        <div class="detail-row">
          <span class="label">Venue:</span>
          <span class="value">${details.eventVenue}</span>
        </div>
        <div class="detail-row">
          <span class="label">Registration Fee:</span>
          <span class="value">₹${details.price}</span>
        </div>
        <div class="detail-row">
          <span class="label">Registration ID:</span>
          <span class="value">${details.registrationId}</span>
        </div>
        <div class="detail-row">
          <span class="label">Registration Date:</span>
          <span class="value">${details.registeredAt.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</span>
        </div>
      </div>
      
      <div class="section">
        <h2 class="section-title">PARTICIPANT DETAILS</h2>
        <div class="detail-row">
          <span class="label">Full Name:</span>
          <span class="value">${details.fullName}</span>
        </div>
        <div class="detail-row">
          <span class="label">Email Address:</span>
          <span class="value">${details.email}</span>
        </div>
        <div class="detail-row">
          <span class="label">Mobile Number:</span>
          <span class="value">${details.mobileNumber}</span>
        </div>
        ${details.whatsappNumber ? `
        <div class="detail-row">
          <span class="label">WhatsApp Number:</span>
          <span class="value">${details.whatsappNumber}</span>
        </div>
        ` : ''}
        <div class="detail-row">
          <span class="label">Aadhaar Number:</span>
          <span class="value">${details.aadhaarNumber}</span>
        </div>
        <div class="detail-row">
          <span class="label">State:</span>
          <span class="value">${details.state}</span>
        </div>
        <div class="detail-row">
          <span class="label">District:</span>
          <span class="value">${details.district}</span>
        </div>
        <div class="detail-row">
          <span class="label">College Name:</span>
          <span class="value">${details.collegeName}</span>
        </div>
        <div class="detail-row">
          <span class="label">College Address:</span>
          <span class="value">${details.collegeAddress}</span>
        </div>
      </div>
      
      <div class="section">
        <h2 class="section-title">IMPORTANT INSTRUCTIONS</h2>
        <div class="instructions">
          <ul>
            <li>Please arrive at the venue at least 30 minutes before the event starts</li>
            <li>Bring a valid government-issued photo ID for verification</li>
            <li>Keep this registration confirmation for check-in at the event</li>
            <li>For any queries, contact our support team</li>
            <li>Your registration is confirmed once payment is verified by our team</li>
          </ul>
        </div>
      </div>
      
      <div class="footer">
        <p>This is an automatically generated document. Please keep it for your records.</p>
        <p>For support: support@CodeBreakers.gcek.edu.in | Website: www.CodeBreakers.gcek.edu.in</p>
      </div>
    </body>
    </html>
  `;
}