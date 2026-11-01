import { NextRequest, NextResponse } from 'next/server';
import { sendConfirmationEmailWithAttachment } from '@/lib/mailer';
import { generateRegistrationPDF } from '@/lib/pdf-generator';

export async function POST(request: NextRequest) {
  try {
    // This is a test endpoint - should be protected in production
    const testData = {
      fullName: 'Test User',
      email: 'test@example.com',
      mobileNumber: '9876543210',
      whatsappNumber: '9876543210',
      aadhaarNumber: '123456789012',
      state: 'Odisha',
      district: 'Kalahandi',
      collegeName: 'Test College',
      collegeAddress: 'Test Address, Test City',
      eventTitle: 'Test Event',
      eventDate: 'Monday, December 25, 2024 at 10:00 AM',
      eventVenue: 'Test Venue',
      registrationId: 'test-123',
      price: 500,
      registeredAt: new Date()
    };

    // Generate PDF
    const pdfBuffer = await generateRegistrationPDF(testData);

    // Send email with attachment
    const result = await sendConfirmationEmailWithAttachment({
      to: 'test@example.com', // Replace with your email for testing
      participantName: testData.fullName,
      eventTitle: testData.eventTitle,
      eventDate: testData.eventDate,
      eventVenue: testData.eventVenue,
      registrationDetails: {
        fullName: testData.fullName,
        mobileNumber: testData.mobileNumber,
        whatsappNumber: testData.whatsappNumber,
        collegeName: testData.collegeName,
        state: testData.state,
        district: testData.district,
      },
      attachmentBuffer: pdfBuffer,
      attachmentFilename: 'test-registration.pdf'
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Test email sent successfully',
      result 
    });

  } catch (error) {
    console.error('Test email error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}