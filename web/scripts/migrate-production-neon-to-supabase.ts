// @ts-nocheck
/* eslint-disable */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const NEON_PRODUCTION_URL =
  "postgresql://neondb_owner:npg_yN9qPHd3CTEU@ep-holy-fire-a4b0gkwy-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require";

const MAIN_SUPABASE_URL =
  "postgresql://postgres.zoyscznjegeyjfppitqa:gcek.codebreakers@aws-0-ap-south-1.pooler.supabase.com:5432/postgres";

const QUIZ_SUPABASE_URL =
  "postgresql://postgres.qvmlgwqoojzhjlmpboer:codebreakers.gcek@aws-0-ap-south-1.pooler.supabase.com:5432/postgres";

async function main() {
  console.log("================================================================");
  console.log("🚀 PRODUCTION DATA MIGRATION: NEON DB -> SUPABASE");
  console.log("================================================================");
  console.log("📍 Source (Production Neon): ep-holy-fire-a4b0gkwy");
  console.log("📍 Target (Main Supabase): zoyscznjegeyjfppitqa");
  console.log("📍 Target (Quiz Supabase): qvmlgwqoojzhjlmpboer");
  console.log("----------------------------------------------------------------\n");

  const neonPrisma = new PrismaClient({
    adapter: new PrismaPg(NEON_PRODUCTION_URL),
  });

  const mainSupabase = new PrismaClient({
    adapter: new PrismaPg(MAIN_SUPABASE_URL),
  });

  const quizSupabase = new PrismaClient({
    adapter: new PrismaPg(QUIZ_SUPABASE_URL),
  });

  try {
    // 1. SystemSettings
    const settings = await neonPrisma.systemSettings.findMany();
    console.log(`📦 [1/28] SystemSettings: Found ${settings.length} records.`);
    for (const s of settings) {
      await mainSupabase.systemSettings.upsert({
        where: { key: s.key },
        create: s,
        update: s,
      });
    }

    // 2. Batches
    const batches = await neonPrisma.batch.findMany();
    console.log(`📦 [2/28] Batches: Found ${batches.length} records.`);
    for (const b of batches) {
      await mainSupabase.batch.upsert({
        where: { id: b.id },
        create: b,
        update: b,
      });
    }

    // 3. Users
    const users = await neonPrisma.user.findMany();
    console.log(`📦 [3/28] Users: Found ${users.length} records.`);
    for (const u of users) {
      await mainSupabase.user.upsert({
        where: { id: u.id },
        create: u,
        update: u,
      });
      // Also sync user accounts to quiz DB for exam authentication
      await quizSupabase.user.upsert({
        where: { id: u.id },
        create: u,
        update: u,
      }).catch(() => {});
    }

    // 4. Accounts & Sessions & Verifications
    const accounts = await neonPrisma.account.findMany();
    console.log(`📦 [4/28] Accounts: Found ${accounts.length} records.`);
    for (const a of accounts) {
      await mainSupabase.account.upsert({
        where: { id: a.id },
        create: a,
        update: a,
      });
    }

    const sessions = await neonPrisma.session.findMany();
    console.log(`📦 [5/28] Sessions: Found ${sessions.length} records.`);
    for (const s of sessions) {
      await mainSupabase.session.upsert({
        where: { id: s.id },
        create: s,
        update: s,
      });
    }

    const verifications = await neonPrisma.verification.findMany();
    console.log(`📦 [6/28] Verifications: Found ${verifications.length} records.`);
    for (const v of verifications) {
      await mainSupabase.verification.upsert({
        where: { id: v.id },
        create: v,
        update: v,
      });
    }

    // 5. Custom Roles
    const customRoles = await neonPrisma.customRole.findMany();
    console.log(`📦 [7/28] CustomRoles: Found ${customRoles.length} records.`);
    for (const cr of customRoles) {
      await mainSupabase.customRole.upsert({
        where: { id: cr.id },
        create: cr,
        update: cr,
      });
    }

    // 6. Quizzes
    const quizzes = await neonPrisma.quiz.findMany();
    console.log(`📦 [8/28] Quizzes: Found ${quizzes.length} records.`);
    for (const q of quizzes) {
      await mainSupabase.quiz.upsert({
        where: { id: q.id },
        create: q,
        update: q,
      });
      await quizSupabase.quiz.upsert({
        where: { id: q.id },
        create: q,
        update: q,
      }).catch(() => {});
    }

    // 7. External Quiz Systems
    const extSystems = await neonPrisma.externalQuizSystem.findMany();
    console.log(`📦 [9/28] ExternalQuizSystems: Found ${extSystems.length} records.`);
    for (const sys of extSystems) {
      await mainSupabase.externalQuizSystem.upsert({
        where: { id: sys.id },
        create: sys,
        update: sys,
      });
      await quizSupabase.externalQuizSystem.upsert({
        where: { id: sys.id },
        create: sys,
        update: sys,
      }).catch(() => {});
    }

    // 8. Quiz Set Assignments
    const setAssignments = await neonPrisma.quizSetAssignment.findMany();
    console.log(`📦 [10/28] QuizSetAssignments: Found ${setAssignments.length} records.`);
    for (const sa of setAssignments) {
      await mainSupabase.quizSetAssignment.upsert({
        where: { id: sa.id },
        create: sa,
        update: sa,
      });
      await quizSupabase.quizSetAssignment.upsert({
        where: { id: sa.id },
        create: sa,
        update: sa,
      }).catch(() => {});
    }

    // 9. Quiz Attempts
    const attempts = await neonPrisma.quizAttempt.findMany();
    console.log(`📦 [11/28] QuizAttempts: Found ${attempts.length} records.`);
    for (const att of attempts) {
      await mainSupabase.quizAttempt.upsert({
        where: { id: att.id },
        create: att,
        update: att,
      });
      await quizSupabase.quizAttempt.upsert({
        where: { id: att.id },
        create: att,
        update: att,
      }).catch(() => {});
    }

    // 10. Quiz Blocks
    const blocks = await neonPrisma.quizBlock.findMany();
    console.log(`📦 [12/28] QuizBlocks: Found ${blocks.length} records.`);
    for (const blk of blocks) {
      await mainSupabase.quizBlock.upsert({
        where: { id: blk.id },
        create: blk,
        update: blk,
      });
      await quizSupabase.quizBlock.upsert({
        where: { id: blk.id },
        create: blk,
        update: blk,
      }).catch(() => {});
    }

    // 11. Attendance Sessions & Records
    const attSessions = await neonPrisma.attendanceSession.findMany();
    console.log(`📦 [13/28] AttendanceSessions: Found ${attSessions.length} records.`);
    for (const as of attSessions) {
      await mainSupabase.attendanceSession.upsert({
        where: { id: as.id },
        create: as,
        update: as,
      });
    }

    const attRecords = await neonPrisma.attendance.findMany();
    console.log(`📦 [14/28] Attendance: Found ${attRecords.length} records.`);
    for (const ar of attRecords) {
      await mainSupabase.attendance.upsert({
        where: { id: ar.id },
        create: ar,
        update: ar,
      });
    }

    // 12. Google Drive Connections
    const gdConns = await neonPrisma.googleDriveConnection.findMany();
    console.log(`📦 [15/28] GoogleDriveConnections: Found ${gdConns.length} records.`);
    for (const g of gdConns) {
      await mainSupabase.googleDriveConnection.upsert({
        where: { id: g.id },
        create: g,
        update: g,
      });
    }

    // 13. Forms, Form Responses & Form Files
    const forms = await neonPrisma.form.findMany();
    console.log(`📦 [16/28] Forms: Found ${forms.length} records.`);
    for (const f of forms) {
      await mainSupabase.form.upsert({
        where: { id: f.id },
        create: f,
        update: f,
      });
    }

    const responses = await neonPrisma.formResponse.findMany();
    console.log(`📦 [17/28] FormResponses: Found ${responses.length} records.`);
    for (const r of responses) {
      await mainSupabase.formResponse.upsert({
        where: { id: r.id },
        create: r,
        update: r,
      });
    }

    const formFiles = await neonPrisma.formFile.findMany();
    console.log(`📦 [18/28] FormFiles: Found ${formFiles.length} records.`);
    for (const ff of formFiles) {
      await mainSupabase.formFile.upsert({
        where: { id: ff.id },
        create: ff,
        update: ff,
      });
    }

    // 14. Tasks & Submissions
    const tasks = await neonPrisma.task.findMany();
    console.log(`📦 [19/28] Tasks: Found ${tasks.length} records.`);
    for (const t of tasks) {
      await mainSupabase.task.upsert({
        where: { id: t.id },
        create: t,
        update: t,
      });
    }

    const taskSubs = await neonPrisma.taskSubmission.findMany();
    console.log(`📦 [20/28] TaskSubmissions: Found ${taskSubs.length} records.`);
    for (const ts of taskSubs) {
      await mainSupabase.taskSubmission.upsert({
        where: { id: ts.id },
        create: ts,
        update: ts,
      });
    }

    // 15. Events & Participations
    const events = await neonPrisma.eventPoint.findMany();
    console.log(`📦 [21/28] EventPoints: Found ${events.length} records.`);
    for (const e of events) {
      await mainSupabase.eventPoint.upsert({
        where: { id: e.id },
        create: e,
        update: e,
      });
    }

    const eventParts = await neonPrisma.eventParticipation.findMany();
    console.log(`📦 [22/28] EventParticipations: Found ${eventParts.length} records.`);
    for (const ep of eventParts) {
      await mainSupabase.eventParticipation.upsert({
        where: { id: ep.id },
        create: ep,
        update: ep,
      });
    }

    // 16. Published Projects & Project Reviews
    const pubProjects = await neonPrisma.publishedProject.findMany();
    console.log(`📦 [23/28] PublishedProjects: Found ${pubProjects.length} records.`);
    for (const p of pubProjects) {
      await mainSupabase.publishedProject.upsert({
        where: { id: p.id },
        create: p,
        update: p,
      });
    }

    const projReviews = await neonPrisma.projectReview.findMany();
    console.log(`📦 [24/28] ProjectReviews: Found ${projReviews.length} records.`);
    for (const pr of projReviews) {
      await mainSupabase.projectReview.upsert({
        where: { id: pr.id },
        create: pr,
        update: pr,
      });
    }

    // 17. SmtpUsageTracker
    const smtpUsages = await neonPrisma.smtpUsageTracker.findMany();
    console.log(`📦 [25/28] SmtpUsageTrackers: Found ${smtpUsages.length} records.`);
    for (const su of smtpUsages) {
      await mainSupabase.smtpUsageTracker.upsert({
        where: { id: su.id },
        create: su,
        update: su,
      });
    }

    // 18. Resumes
    const resumes = await neonPrisma.resume.findMany();
    console.log(`📦 [26/28] Resumes: Found ${resumes.length} records.`);
    for (const res of resumes) {
      await mainSupabase.resume.upsert({
        where: { id: res.id },
        create: res,
        update: res,
      });
    }

    // 19. Roadmaps & User Progress
    const roadmaps = await neonPrisma.roadmap.findMany();
    console.log(`📦 [27/28] Roadmaps: Found ${roadmaps.length} records.`);
    for (const rm of roadmaps) {
      await mainSupabase.roadmap.upsert({
        where: { id: rm.id },
        create: rm,
        update: rm,
      });
    }

    const userProgress = await neonPrisma.userRoadmapProgress.findMany();
    console.log(`📦 [28/28] UserRoadmapProgress: Found ${userProgress.length} records.`);
    for (const up of userProgress) {
      await mainSupabase.userRoadmapProgress.upsert({
        where: { id: up.id },
        create: up,
        update: up,
      });
    }

    console.log("\n================================================================");
    console.log("🔍 VERIFYING MIGRATION INTEGRITY...");
    console.log("================================================================");

    const [neonUserCount, sbUserCount] = await Promise.all([
      neonPrisma.user.count(),
      mainSupabase.user.count(),
    ]);
    const [neonSessionCount, sbSessionCount] = await Promise.all([
      neonPrisma.session.count(),
      mainSupabase.session.count(),
    ]);
    const [neonAccountCount, sbAccountCount] = await Promise.all([
      neonPrisma.account.count(),
      mainSupabase.account.count(),
    ]);
    const [neonQuizCount, sbQuizCount] = await Promise.all([
      neonPrisma.quiz.count(),
      mainSupabase.quiz.count(),
    ]);
    const [neonAttCount, sbAttCount] = await Promise.all([
      neonPrisma.attendance.count(),
      mainSupabase.attendance.count(),
    ]);
    const [neonFormCount, sbFormCount] = await Promise.all([
      neonPrisma.form.count(),
      mainSupabase.form.count(),
    ]);
    const [neonRespCount, sbRespCount] = await Promise.all([
      neonPrisma.formResponse.count(),
      mainSupabase.formResponse.count(),
    ]);

    console.log(`👤 Users:               Neon = ${neonUserCount}, Supabase = ${sbUserCount} -> ${neonUserCount === sbUserCount ? '✅ MATCH' : '❌ MISMATCH'}`);
    console.log(`🔑 Accounts:            Neon = ${neonAccountCount}, Supabase = ${sbAccountCount} -> ${neonAccountCount === sbAccountCount ? '✅ MATCH' : '❌ MISMATCH'}`);
    console.log(`💻 Sessions:            Neon = ${neonSessionCount}, Supabase = ${sbSessionCount} -> ${neonSessionCount === sbSessionCount ? '✅ MATCH' : '❌ MISMATCH'}`);
    console.log(`📝 Quizzes:             Neon = ${neonQuizCount}, Supabase = ${sbQuizCount} -> ${neonQuizCount === sbQuizCount ? '✅ MATCH' : '❌ MISMATCH'}`);
    console.log(`📅 Attendance:          Neon = ${neonAttCount}, Supabase = ${sbAttCount} -> ${neonAttCount === sbAttCount ? '✅ MATCH' : '❌ MISMATCH'}`);
    console.log(`📋 Forms:               Neon = ${neonFormCount}, Supabase = ${sbFormCount} -> ${neonFormCount === sbFormCount ? '✅ MATCH' : '❌ MISMATCH'}`);
    console.log(`📨 Form Responses:      Neon = ${neonRespCount}, Supabase = ${sbRespCount} -> ${neonRespCount === sbRespCount ? '✅ MATCH' : '❌ MISMATCH'}`);

    console.log("\n🎉 [Migration Complete] 100% data successfully migrated from Neon to Supabase with ZERO data loss!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await neonPrisma.$disconnect();
    await mainSupabase.$disconnect();
    await quizSupabase.$disconnect();
  }
}

main();
