-- ============================================
-- Neon SQL Migration for QR Attendance System
-- Generated: December 19, 2025
-- ============================================
-- This migration adds QR code-based attendance functionality
-- including AttendanceQR table and updates to Attendance table

-- ============================================
-- STEP 1: Create AttendanceQR Table
-- ============================================
CREATE TABLE IF NOT EXISTS "attendance_qr" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "qrToken" TEXT NOT NULL UNIQUE,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "scanCount" INTEGER NOT NULL DEFAULT 0,
    
    CONSTRAINT "attendance_qr_sessionId_fkey" 
        FOREIGN KEY ("sessionId") 
        REFERENCES "attendance_session"("id") 
        ON DELETE CASCADE 
        ON UPDATE CASCADE
);

-- ============================================
-- STEP 2: Create Indexes for AttendanceQR
-- ============================================
CREATE INDEX IF NOT EXISTS "attendance_qr_qrToken_idx" ON "attendance_qr"("qrToken");
CREATE INDEX IF NOT EXISTS "attendance_qr_sessionId_idx" ON "attendance_qr"("sessionId");
CREATE INDEX IF NOT EXISTS "attendance_qr_expiresAt_idx" ON "attendance_qr"("expiresAt");

-- ============================================
-- STEP 3: Add 'method' column to Attendance table
-- ============================================
-- Check if column already exists before adding
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'attendance' 
        AND column_name = 'method'
    ) THEN
        ALTER TABLE "attendance" 
        ADD COLUMN "method" TEXT NOT NULL DEFAULT 'manual';
    END IF;
END $$;

-- ============================================
-- STEP 4: Update existing attendance records
-- ============================================
-- Set method to 'manual' for all existing records (if they don't have it already)
UPDATE "attendance" 
SET "method" = 'manual' 
WHERE "method" IS NULL OR "method" = '';

-- ============================================
-- STEP 5: Verify the migration
-- ============================================
-- Run these queries to verify the migration was successful:

-- Check if attendance_qr table exists
-- SELECT EXISTS (
--     SELECT FROM information_schema.tables 
--     WHERE table_name = 'attendance_qr'
-- );

-- Check if method column was added to attendance
-- SELECT column_name, data_type, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'attendance' AND column_name = 'method';

-- Check indexes on attendance_qr
-- SELECT indexname, indexdef 
-- FROM pg_indexes 
-- WHERE tablename = 'attendance_qr';

-- ============================================
-- STEP 6: Sample Data (Optional - for testing)
-- ============================================
-- Uncomment below to insert sample data for testing

-- Insert a test attendance session
-- INSERT INTO "attendance_session" ("id", "sessionNumber", "title", "date", "day", "createdBy")
-- VALUES (
--     'test_session_' || gen_random_uuid()::text,
--     1,
--     'Test QR Session',
--     CURRENT_TIMESTAMP,
--     'Friday',
--     'admin_user_id'
-- );

-- Insert a test QR code (expires in 5 minutes)
-- INSERT INTO "attendance_qr" ("id", "sessionId", "qrToken", "expiresAt", "createdBy")
-- VALUES (
--     'test_qr_' || gen_random_uuid()::text,
--     'test_session_id', -- Replace with actual session ID
--     encode(gen_random_bytes(32), 'hex'),
--     CURRENT_TIMESTAMP + INTERVAL '5 minutes',
--     'admin_user_id'
-- );

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- Summary of changes:
-- 1. Created attendance_qr table with foreign key to attendance_session
-- 2. Added unique constraint on qrToken
-- 3. Created 3 indexes for optimized queries (qrToken, sessionId, expiresAt)
-- 4. Added 'method' column to attendance table (default: 'manual')
-- 5. Updated existing attendance records to have method = 'manual'
--
-- Next steps:
-- 1. Run this SQL in Neon SQL Editor
-- 2. Verify tables and indexes were created successfully
-- 3. Test QR generation and verification APIs
-- 4. Update Prisma client: npx prisma generate
-- ============================================
