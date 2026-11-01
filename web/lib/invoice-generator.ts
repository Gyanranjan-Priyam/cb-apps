import jsPDF from "jspdf";

interface InvoiceDetails {
  invoiceNumber: string;
  fullName: string;
  email: string;
  mobileNumber: string;
  collegeName: string;
  state: string;
  district: string;
  eventTitle: string;
  eventDate: string;
  eventVenue: string;
  registrationId: string;
  paymentAmount: number;
  paymentDate: Date;
  paymentVerifiedDate: Date;
  transactionId?: string;
  paymentMethod: string;
}

export async function generateInvoicePDF(
  details: InvoiceDetails,
): Promise<Buffer> {
  // A4 paper dimensions: 210mm x 297mm
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 210;
  const margin = 18;
  const rightX = pageWidth - margin;
  const formattedAmount = `Rs. ${(details.paymentAmount || 0).toFixed(2)}`;

  // Paper Card Background Fill (#FAF9F5 -> RGB: 250, 249, 245)
  pdf.setFillColor(250, 249, 245);
  pdf.rect(10, 10, 190, 277, "F");
  pdf.setDrawColor(231, 229, 222);
  pdf.setLineWidth(0.4);
  pdf.rect(10, 10, 190, 277, "S");

  // VERIFIED Watermark Stamp (Top Right Rotated)
  pdf.setDrawColor(22, 163, 74);
  pdf.setTextColor(22, 163, 74);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(18);
  pdf.text("VERIFIED", 145, 28, { angle: -12 });

  // 1. Header Left: CodeBreakers
  let yPos = margin + 5;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(16);
  pdf.setTextColor(12, 10, 9);
  pdf.text("CodeBreakers", margin + 5, yPos);

  yPos += 5;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(87, 83, 78);
  pdf.text("GCEK Bhawanipatna", margin + 5, yPos);

  // Header Right: INVOICE & PAID & APPROVED
  pdf.setFont("courier", "bold");
  pdf.setFontSize(22);
  pdf.setTextColor(12, 10, 9);
  pdf.text("INVOICE", rightX - 5, margin + 5, { align: "right" });

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.setTextColor(22, 163, 74);
  pdf.text("(v) PAID & APPROVED", rightX - 5, margin + 11, { align: "right" });

  // Divider Line 1
  yPos = 38;
  pdf.setDrawColor(231, 229, 222);
  pdf.setLineWidth(0.4);
  pdf.line(margin + 5, yPos, rightX - 5, yPos);

  // 2. Metadata Grid (Courier Monospace)
  yPos += 8;
  pdf.setFont("courier", "normal");
  pdf.setFontSize(8);
  pdf.setTextColor(120, 113, 108);
  pdf.text("REFERENCE NUMBER", margin + 5, yPos);
  pdf.text("PAYMENT METHOD", rightX - 55, yPos);

  yPos += 5;
  pdf.setFont("courier", "bold");
  pdf.setFontSize(9);
  pdf.setTextColor(12, 10, 9);
  pdf.text(details.invoiceNumber, margin + 5, yPos);
  pdf.setFont("courier", "normal");
  pdf.text(details.paymentMethod || "UPI", rightX - 55, yPos);

  yPos += 7;
  pdf.setFont("courier", "normal");
  pdf.setFontSize(8);
  pdf.setTextColor(120, 113, 108);
  pdf.text("DATE ISSUED", margin + 5, yPos);
  pdf.text("TRANSACTION ID", rightX - 55, yPos);

  yPos += 5;
  pdf.setFont("courier", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(12, 10, 9);
  pdf.text(details.eventDate, margin + 5, yPos);
  pdf.setFont("courier", "bold");
  pdf.text(details.transactionId || "N/A", rightX - 55, yPos);

  // Divider Line 2
  yPos += 8;
  pdf.setDrawColor(231, 229, 222);
  pdf.line(margin + 5, yPos, rightX - 5, yPos);

  // 3. FROM and BILL TO
  yPos += 8;
  pdf.setFont("courier", "bold");
  pdf.setFontSize(8);
  pdf.setTextColor(120, 113, 108);
  pdf.text("FROM", margin + 5, yPos);
  pdf.text("BILL TO", rightX - 65, yPos);

  yPos += 5;
  pdf.setFont("courier", "bold");
  pdf.setFontSize(9);
  pdf.setTextColor(12, 10, 9);
  pdf.text("CodeBreakers", margin + 5, yPos);
  pdf.text(details.fullName || "Participant", rightX - 65, yPos);

  yPos += 5;
  pdf.setFont("courier", "normal");
  pdf.setTextColor(68, 64, 60);
  pdf.text("Government College of Engineering Kalahandi", margin + 5, yPos);
  pdf.text(details.email || "", rightX - 65, yPos);

  yPos += 5;
  pdf.text("Bhawanipatna, Odisha 766002", margin + 5, yPos);
  if (details.collegeName && details.collegeName !== "N/A") {
    pdf.text(details.collegeName.slice(0, 35), rightX - 65, yPos);
  }

  yPos += 5;
  pdf.text("Tax ID: CB-1029384756", margin + 5, yPos);

  // Divider Line 3
  yPos += 8;
  pdf.setDrawColor(231, 229, 222);
  pdf.line(margin + 5, yPos, rightX - 5, yPos);

  // 4. Items Table Header (Gray Bar)
  yPos += 10;
  pdf.setFillColor(231, 229, 222); // #E7E5DE
  pdf.roundedRect(margin + 5, yPos, rightX - margin - 10, 8, 2, 2, "F");

  yPos += 5.5;
  pdf.setFont("courier", "bold");
  pdf.setFontSize(8);
  pdf.setTextColor(12, 10, 9);
  pdf.text("DESCRIPTION", margin + 9, yPos);
  pdf.text("UNITS", 125, yPos, { align: "right" });
  pdf.text("UNIT COST", 155, yPos, { align: "right" });
  pdf.text("LINE TOTAL", rightX - 9, yPos, { align: "right" });

  // Item Row
  yPos += 9;
  pdf.setFont("courier", "bold");
  pdf.setFontSize(9);
  pdf.setTextColor(12, 10, 9);
  pdf.text(`${details.eventTitle} Registration Fee`, margin + 9, yPos);
  pdf.setFont("courier", "normal");
  pdf.text("1", 125, yPos, { align: "right" });
  pdf.text(formattedAmount, 155, yPos, { align: "right" });
  pdf.setFont("courier", "bold");
  pdf.text(formattedAmount, rightX - 9, yPos, { align: "right" });

  // 5. Status Left & Totals Right Section
  yPos += 16;
  pdf.setFont("courier", "normal");
  pdf.setFontSize(8.5);
  pdf.setTextColor(120, 113, 108);
  pdf.text(`Form ID: `, margin + 5, yPos);
  pdf.setFont("courier", "bold");
  pdf.setTextColor(12, 10, 9);
  pdf.text(details.registrationId || "N/A", margin + 25, yPos);

  yPos += 5;
  pdf.setFont("courier", "normal");
  pdf.setTextColor(120, 113, 108);
  pdf.text(`Status: `, margin + 5, yPos);
  pdf.setFont("courier", "bold");
  pdf.setTextColor(22, 163, 74);
  pdf.text("Payment Verified", margin + 25, yPos);

  // Right side Summary Table
  let sumY = yPos - 5;
  pdf.setFont("courier", "normal");
  pdf.setFontSize(8.5);
  pdf.setTextColor(68, 64, 60);
  pdf.text("Net Amount:", 125, sumY);
  pdf.text(formattedAmount, rightX - 5, sumY, { align: "right" });

  sumY += 5;
  pdf.text("Discount:", 125, sumY);
  pdf.text("Rs. 0.00", rightX - 5, sumY, { align: "right" });

  sumY += 5;
  pdf.setDrawColor(12, 10, 9);
  pdf.setLineWidth(0.8);
  pdf.line(125, sumY, rightX - 5, sumY);

  sumY += 5;
  pdf.setFont("courier", "bold");
  pdf.setFontSize(9);
  pdf.setTextColor(12, 10, 9);
  pdf.text("TOTAL AMOUNT PAID:", 125, sumY);
  pdf.text(`${formattedAmount} (PAID)`, rightX - 5, sumY, { align: "right" });

  sumY += 3;
  pdf.line(125, sumY, rightX - 5, sumY);

  // 6. Footer
  const footerY = 270;
  pdf.setLineWidth(0.4);
  pdf.setDrawColor(231, 229, 222);
  pdf.line(margin + 5, footerY, rightX - 5, footerY);

  pdf.setFont("courier", "normal");
  pdf.setFontSize(8);
  pdf.setTextColor(120, 113, 108);
  pdf.text("cse.codebreaker@gcekbpatna.ac.in", margin + 5, footerY + 5);
  pdf.text("CodeBreakers • GCEK Bhawanipatna", margin + 5, footerY + 9);

  pdf.setFont("courier", "bold");
  pdf.setTextColor(12, 10, 9);
  pdf.text("Issued by CodeBreakers Team", rightX - 5, footerY + 9, {
    align: "right",
  });

  const pdfOutput = pdf.output("arraybuffer");
  return Buffer.from(pdfOutput);
}

export async function generateInvoiceHTML(
  details: InvoiceDetails,
): Promise<string> {
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
          border-bottom: 3px solid #3b82f6;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .company-name {
          font-size: 24px;
          font-weight: bold;
          color: #3b82f6;
          margin: 0;
        }
        .company-info {
          font-size: 14px;
          color: #666;
          margin: 5px 0;
        }
        .invoice-title {
          font-size: 28px;
          font-weight: bold;
          color: #1f2937;
          margin: 20px 0;
        }
        .invoice-meta {
          text-align: right;
          margin-bottom: 30px;
        }
        .bill-to {
          background-color: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 30px;
        }
        .section-title {
          font-size: 16px;
          font-weight: bold;
          color: #3b82f6;
          margin-bottom: 10px;
        }
        .event-details {
          background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 30px;
          border-left: 4px solid #3b82f6;
        }
        .payment-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        .payment-table th {
          background-color: #3b82f6;
          color: white;
          padding: 12px;
          text-align: left;
        }
        .payment-table td {
          padding: 12px;
          border-bottom: 1px solid #e5e7eb;
        }
        .total-section {
          background-color: #f3f4f6;
          padding: 20px;
          border-radius: 8px;
          text-align: right;
          margin-bottom: 30px;
        }
        .total-amount {
          font-size: 24px;
          font-weight: bold;
          color: #059669;
        }
        .payment-info {
          background-color: #f0fdf4;
          padding: 20px;
          border-radius: 8px;
          border-left: 4px solid #10b981;
          margin-bottom: 30px;
        }
        .detail-row {
          display: flex;
          margin-bottom: 8px;
        }
        .label {
          font-weight: bold;
          width: 150px;
          color: #555;
        }
        .value {
          flex: 1;
        }
        .terms {
          background-color: #fffbeb;
          padding: 20px;
          border-radius: 8px;
          border-left: 4px solid #f59e0b;
          margin-bottom: 30px;
        }
        .terms ul {
          margin: 10px 0;
          padding-left: 20px;
        }
        .terms li {
          margin-bottom: 8px;
        }
        .footer {
          text-align: center;
          font-size: 12px;
          color: #666;
          border-top: 1px solid #e5e7eb;
          padding-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1 class="company-name">CodeBreakers 2025</h1>
        <div class="company-info">Government College of Engineering Kalahandi</div>
        <div class="company-info">Bhawanipatna P.O, Kalahandi - 766002, Odisha, India</div>
        <div class="company-info">Email: CodeBreakers.gcekbhawanipatna@gmail.com</div>
      </div>
      
      <div class="invoice-meta">
        <div><strong>Invoice No:</strong> ${details.invoiceNumber}</div>
        <div><strong>Invoice Date:</strong> ${details.paymentVerifiedDate.toLocaleDateString("en-IN")}</div>
      </div>
      
      <h1 class="invoice-title">PAYMENT INVOICE</h1>
      
      <div class="bill-to">
        <h2 class="section-title">BILL TO</h2>
        <div><strong>${details.fullName}</strong></div>
        <div>${details.collegeName}</div>
        <div>${details.district}, ${details.state}</div>
        <div>Email: ${details.email}</div>
        <div>Mobile: ${details.mobileNumber}</div>
      </div>
      
      <div class="event-details">
        <h2 class="section-title">EVENT DETAILS</h2>
        <div class="detail-row">
          <span class="label">Event:</span>
          <span class="value">${details.eventTitle}</span>
        </div>
        <div class="detail-row">
          <span class="label">Date:</span>
          <span class="value">${details.eventDate}</span>
        </div>
        <div class="detail-row">
          <span class="label">Venue:</span>
          <span class="value">${details.eventVenue}</span>
        </div>
        <div class="detail-row">
          <span class="label">Registration ID:</span>
          <span class="value">${details.registrationId}</span>
        </div>
      </div>
      
      <h2 class="section-title">PAYMENT DETAILS</h2>
      <table class="payment-table">
        <thead>
          <tr>
            <th>Description</th>
            <th style="text-align: right;">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Registration Fee - ${details.eventTitle}</td>
            <td style="text-align: right;">₹${details.paymentAmount}</td>
          </tr>
        </tbody>
      </table>
      
      <div class="total-section">
        <div class="total-amount">TOTAL: ₹${details.paymentAmount}</div>
        <div style="font-size: 12px; color: #666; margin-top: 5px;">(Inclusive of all taxes)</div>
      </div>
      
      <div class="payment-info">
        <h2 class="section-title">PAYMENT INFORMATION</h2>
        <div class="detail-row">
          <span class="label">Payment Method:</span>
          <span class="value">${details.paymentMethod}</span>
        </div>
        <div class="detail-row">
          <span class="label">Transaction ID:</span>
          <span class="value">${details.transactionId || "N/A"}</span>
        </div>
        <div class="detail-row">
          <span class="label">Payment Date:</span>
          <span class="value">${details.paymentDate.toLocaleDateString("en-IN")}</span>
        </div>
        <div class="detail-row">
          <span class="label">Payment Verified:</span>
          <span class="value">${details.paymentVerifiedDate.toLocaleDateString("en-IN")}</span>
        </div>
        <div class="detail-row">
          <span class="label">Status:</span>
          <span class="value" style="color: #059669; font-weight: bold;">PAID</span>
        </div>
      </div>
      
      <div class="terms">
        <h2 class="section-title">TERMS & CONDITIONS</h2>
        <ul>
          <li>This invoice serves as proof of payment for event registration</li>
          <li>Registration is non-transferable and non-refundable</li>
          <li>Participant must present valid ID during the event</li>
          <li>Event organizers reserve the right to make changes to the event schedule</li>
        </ul>
      </div>
      
      <div class="footer">
        <p><strong>Thank you for your participation in CodeBreakers 2025!</strong></p>
        <p>This is a computer-generated invoice and does not require a signature.</p>
      </div>
    </body>
    </html>
  `;
}
