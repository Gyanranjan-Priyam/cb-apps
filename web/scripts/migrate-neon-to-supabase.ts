// @ts-nocheck
/* eslint-disable */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const NEON_DATABASE_URL =
  process.env.NEON_DATABASE_URL ||
  "postgresql://neondb_owner:npg_5OfzCmV8hRHD@ep-odd-forest-ad0pgx1y-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require";

const SUPABASE_DIRECT_URL =
  process.env.DIRECT_URL ||
  "postgresql://postgres.fzhccyxoqfufewlfoscq:gcek.codebreakers@aws-0-ap-south-1.pooler.supabase.com:5432/postgres";

async function main() {
  console.log("🚀 Starting data migration from Neon DB to Supabase...");
  console.log("📍 Source (Neon):", NEON_DATABASE_URL.split("@")[1]);
  console.log("📍 Target (Supabase):", SUPABASE_DIRECT_URL.split("@")[1]);

  const neonPrisma = new PrismaClient({
    adapter: new PrismaPg(NEON_DATABASE_URL),
  });

  const supabasePrisma = new PrismaClient({
    adapter: new PrismaPg(SUPABASE_DIRECT_URL),
  });

  try {
    // 1. System Settings
    const settings = await neonPrisma.systemSettings.findMany();
    console.log(`📦 Found ${settings.length} SystemSettings records.`);
    for (const s of settings) {
      await supabasePrisma.systemSettings.upsert({
        where: { key: s.key },
        create: s,
        update: s,
      });
    }

    // 2. Batches
    const batches = await neonPrisma.batch.findMany();
    console.log(`📦 Found ${batches.length} Batches.`);
    for (const b of batches) {
      await supabasePrisma.batch.upsert({
        where: { id: b.id },
        create: b,
        update: b,
      });
    }

    // 3. Users
    const users = await neonPrisma.user.findMany();
    console.log(`📦 Found ${users.length} Users.`);
    for (const u of users) {
      await supabasePrisma.user.upsert({
        where: { id: u.id },
        create: u,
        update: u,
      });
    }

    // 4. Accounts & Sessions
    const accounts = await neonPrisma.account.findMany();
    console.log(`📦 Found ${accounts.length} Accounts.`);
    for (const a of accounts) {
      await supabasePrisma.account.upsert({
        where: { id: a.id },
        create: a,
        update: a,
      });
    }

    const sessions = await neonPrisma.session.findMany();
    console.log(`📦 Found ${sessions.length} Sessions.`);
    for (const s of sessions) {
      await supabasePrisma.session.upsert({
        where: { id: s.id },
        create: s,
        update: s,
      });
    }

    // 5. Quizzes
    const quizzes = await neonPrisma.quiz.findMany();
    console.log(`📦 Found ${quizzes.length} Quizzes.`);
    for (const q of quizzes) {
      await supabasePrisma.quiz.upsert({
        where: { id: q.id },
        create: q,
        update: q,
      });
    }

    // 6. External Quiz Systems
    const extSystems = await neonPrisma.externalQuizSystem.findMany();
    console.log(`📦 Found ${extSystems.length} ExternalQuizSystems.`);
    for (const sys of extSystems) {
      await supabasePrisma.externalQuizSystem.upsert({
        where: { id: sys.id },
        create: sys,
        update: sys,
      });
    }

    // 7. Quiz Attempts
    const attempts = await neonPrisma.quizAttempt.findMany();
    console.log(`📦 Found ${attempts.length} QuizAttempts.`);
    for (const att of attempts) {
      await supabasePrisma.quizAttempt.upsert({
        where: { id: att.id },
        create: att,
        update: att,
      });
    }

    // 8. Quiz Blocks
    const blocks = await neonPrisma.quizBlock.findMany();
    console.log(`📦 Found ${blocks.length} QuizBlocks.`);
    for (const blk of blocks) {
      await supabasePrisma.quizBlock.upsert({
        where: { id: blk.id },
        create: blk,
        update: blk,
      });
    }

    // 9. Attendance Sessions & Attendances
    const attSessions = await neonPrisma.attendanceSession.findMany();
    console.log(`📦 Found ${attSessions.length} AttendanceSessions.`);
    for (const as of attSessions) {
      await supabasePrisma.attendanceSession.upsert({
        where: { id: as.id },
        create: as,
        update: as,
      });
    }

    const attRecords = await neonPrisma.attendance.findMany();
    console.log(`📦 Found ${attRecords.length} Attendance records.`);
    for (const ar of attRecords) {
      await supabasePrisma.attendance.upsert({
        where: { id: ar.id },
        create: ar,
        update: ar,
      });
    }

    // 10. Forms, Form Responses & Form Files
    const forms = await neonPrisma.form.findMany();
    console.log(`📦 Found ${forms.length} Forms.`);
    for (const f of forms) {
      await supabasePrisma.form.upsert({
        where: { id: f.id },
        create: f,
        update: f,
      });
    }

    const responses = await neonPrisma.formResponse.findMany();
    console.log(`📦 Found ${responses.length} FormResponses.`);
    for (const r of responses) {
      await supabasePrisma.formResponse.upsert({
        where: { id: r.id },
        create: r,
        update: r,
      });
    }

    const formFiles = await neonPrisma.formFile.findMany();
    console.log(`📦 Found ${formFiles.length} FormFiles.`);
    for (const ff of formFiles) {
      await supabasePrisma.formFile.upsert({
        where: { id: ff.id },
        create: ff,
        update: ff,
      });
    }

    // 11. Tasks & Submissions
    const tasks = await neonPrisma.task.findMany();
    console.log(`📦 Found ${tasks.length} Tasks.`);
    for (const t of tasks) {
      await supabasePrisma.task.upsert({
        where: { id: t.id },
        create: t,
        update: t,
      });
    }

    const taskSubs = await neonPrisma.taskSubmission.findMany();
    console.log(`📦 Found ${taskSubs.length} TaskSubmissions.`);
    for (const ts of taskSubs) {
      await supabasePrisma.taskSubmission.upsert({
        where: { id: ts.id },
        create: ts,
        update: ts,
      });
    }

    // 12. Events & Participations
    const events = await neonPrisma.eventPoint.findMany();
    console.log(`📦 Found ${events.length} EventPoints.`);
    for (const e of events) {
      await supabasePrisma.eventPoint.upsert({
        where: { id: e.id },
        create: e,
        update: e,
      });
    }

    const eventParts = await neonPrisma.eventParticipation.findMany();
    console.log(`📦 Found ${eventParts.length} EventParticipations.`);
    for (const ep of eventParts) {
      await supabasePrisma.eventParticipation.upsert({
        where: { id: ep.id },
        create: ep,
        update: ep,
      });
    }

    console.log("\n✅ [Migration Success] All data migrated safely to Supabase!");
  } catch (error) {
    console.error("❌ Migration error:", error);
    process.exit(1);
  } finally {
    await neonPrisma.$disconnect();
    await supabasePrisma.$disconnect();
  }
}

main();
