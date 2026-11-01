import { NextRequest, NextResponse } from 'next/server';
import { sendPaymentConfirmationEmail } from '@/lib/mailer';
import { generateInvoicePDF } from '@/lib/invoice-generator';

export async function POST(request: NextRequest) {
  try {
    // This is a test endpoint - should be protected in production
    const testData = {
      invoiceNumber: 'INV-2025-TEST123',
      fullName: 'Test User',
      email: 'test@example.com',
      mobileNumber: '9876543210',
      collegeName: 'Test College',
      state: 'Odisha',
      district: 'Kalahandi',
      eventTitle: 'Test Event - Payment Confirmed',
      eventDate: 'Monday, December 25, 2024 at 10:00 AM',
      eventVenue: 'Test Venue, Kalahandi',
      registrationId: 'test-reg-123',
      paymentAmount: 500,
      paymentDate: new Date(),
      paymentVerifiedDate: new Date(),
      transactionId: 'TXN123456789',
      paymentMethod: 'Online Transfer'
    };

    // Generate invoice PDF
    const invoicePDF = await generateInvoicePDF(testData);

    // Send payment confirmation email with invoice
    const result = await sendPaymentConfirmationEmail({
      to: 'test@example.com', // Replace with your email for testing
      participantName: testData.fullName,
      eventTitle: testData.eventTitle,
      eventDate: testData.eventDate,
      eventVenue: testData.eventVenue,
      invoiceNumber: testData.invoiceNumber,
      paymentAmount: testData.paymentAmount,
      registrationDetails: {
        fullName: testData.fullName,
        mobileNumber: testData.mobileNumber,
        whatsappNumber: '9876543210',
        collegeName: testData.collegeName,
        state: testData.state,
        district: testData.district,
      },
      invoiceBuffer: invoicePDF,
      invoiceFilename: 'test-payment-invoice.pdf'
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Payment confirmation email sent successfully',
      result 
    });

  } catch (error) {
    console.error('Test payment confirmation email error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}