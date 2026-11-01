import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { emitRealtimeEvent } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "dashboard";

    switch (type) {
      case "supabase-config": {
        return NextResponse.json({
          success: true,
          data: {
            url: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
            anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
          },
        });
      }

      case "dashboard": {
        const currentDate = new Date();
        const [
          totalMembers,
          activeBatches,
          totalAttendancePresent,
          totalAttendanceTotal,
          totalQuizzes,
          totalTasks,
          totalEvents,
          attendancePoints,
          taskPoints,
          eventPoints,
          quizPoints,
          latestSession,
          latestTask,
          recentMembersList,
        ] = await Promise.all([
          prisma.user.count(),
          prisma.batch.count({ where: { isActive: true } }),
          prisma.attendance.count({ where: { status: "present" } }),
          prisma.attendance.count(),
          prisma.quiz.count(),
          prisma.task.count(),
          prisma.eventPoint.count(),
          prisma.attendance.aggregate({
            _sum: { points: true },
            where: { status: "present" },
          }),
          prisma.taskSubmission.aggregate({
            _sum: { pointsAwarded: true },
            where: { status: "approved" },
          }),
          prisma.eventParticipation.aggregate({
            _sum: { pointsAwarded: true },
            where: { status: "approved" },
          }),
          prisma.quizAttempt.aggregate({
            _sum: { pointsEarned: true },
            where: { completedAt: { not: null } },
          }),
          prisma.attendanceSession.findFirst({
            orderBy: { sessionNumber: "desc" },
            include: {
              _count: {
                select: {
                  attendances: { where: { status: "present" } },
                },
              },
            },
          }),
          prisma.task.findFirst({
            orderBy: { createdAt: "desc" },
            include: {
              _count: {
                select: {
                  submissions: true,
                },
              },
            },
          }),
          prisma.user.findMany({
            take: 4,
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              profileImageKey: true,
              branch: true,
            },
          }),
        ]);

        const avgAttendanceRate =
          totalAttendanceTotal > 0
            ? Math.round((totalAttendancePresent / totalAttendanceTotal) * 100)
            : 85;

        const totalPointsIssued =
          (attendancePoints._sum.points || 0) +
          (taskPoints._sum.pointsAwarded || 0) +
          (eventPoints._sum.pointsAwarded || 0) +
          (quizPoints._sum.pointsEarned || 0);

        return NextResponse.json({
          success: true,
          data: {
            totalMembers,
            activeBatches,
            avgAttendanceRate: `${avgAttendanceRate}%`,
            totalPointsIssued: totalPointsIssued >= 1000 ? `${(totalPointsIssued / 1000).toFixed(1)}k` : `${totalPointsIssued}`,
            rawPoints: totalPointsIssued,
            counts: {
              quizzes: totalQuizzes,
              tasks: totalTasks,
              events: totalEvents,
              batches: activeBatches,
            },
            recentSession: latestSession
              ? {
                  id: latestSession.id,
                  sessionNumber: latestSession.sessionNumber,
                  title: latestSession.title,
                  date: latestSession.date.toISOString(),
                  presentCount: latestSession._count.attendances,
                }
              : null,
            recentTask: latestTask
              ? {
                  id: latestTask.id,
                  title: latestTask.title,
                  points: latestTask.points,
                  submissionsCount: latestTask._count.submissions,
                  dueDate: latestTask.dueDate.toISOString(),
                }
              : null,
            recentMembers: recentMembersList.map((m) => ({
              id: m.id,
              name: m.name || m.email.split("@")[0],
              image: m.image,
              profileImageKey: m.profileImageKey,
              branch: m.branch || "General",
            })),
          },
        });
      }

      case "members": {
        const members = await prisma.user.findMany({
          take: 50,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            branch: true,
            registration: true,
            rollNumber: true,
            banned: true,
            batch: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
            createdAt: true,
          },
        });

        return NextResponse.json({
          success: true,
          data: members.map((m) => ({
            id: m.id,
            name: m.name || m.email.split("@")[0],
            email: m.email,
            role: m.role || "Member",
            branch: m.branch || "General",
            batch: m.batch ? m.batch.name : "Unassigned",
            batchCode: m.batch ? m.batch.code : null,
            status: m.banned ? "Banned" : "Active",
            createdAt: m.createdAt.toISOString(),
          })),
        });
      }

      case "member-detail": {
        const memberId = searchParams.get("id");
        if (!memberId) {
          return NextResponse.json({ error: "Member ID is required" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
          where: { id: memberId },
          include: {
            batch: {
              select: {
                id: true,
                name: true,
                code: true,
                admissionYear: true,
              },
            },
          },
        });

        if (!user) {
          return NextResponse.json({ error: "Member not found" }, { status: 404 });
        }

        // Calculate user activity and points
        const [
          attendanceCount,
          attendancePoints,
          taskSubmissionCount,
          taskPoints,
          quizAttemptCount,
          quizPoints,
          eventCount,
          eventPoints,
        ] = await Promise.all([
          prisma.attendance.count({ where: { userId: user.id, status: "present" } }),
          prisma.attendance.aggregate({
            _sum: { points: true },
            where: { userId: user.id, status: "present" },
          }),
          prisma.taskSubmission.count({ where: { userId: user.id } }),
          prisma.taskSubmission.aggregate({
            _sum: { pointsAwarded: true },
            where: { userId: user.id, status: "approved" },
          }),
          prisma.quizAttempt.count({ where: { userId: user.id, completedAt: { not: null } } }),
          prisma.quizAttempt.aggregate({
            _sum: { pointsEarned: true },
            where: { userId: user.id, completedAt: { not: null } },
          }),
          prisma.eventParticipation.count({ where: { userId: user.id } }),
          prisma.eventParticipation.aggregate({
            _sum: { pointsAwarded: true },
            where: { userId: user.id, status: "approved" },
          }),
        ]);

        const totalPoints =
          (attendancePoints._sum.points || 0) +
          (taskPoints._sum.pointsAwarded || 0) +
          (quizPoints._sum.pointsEarned || 0) +
          (eventPoints._sum.pointsAwarded || 0);

        return NextResponse.json({
          success: true,
          data: {
            id: user.id,
            name: user.name,
            email: user.email,
            emailVerified: user.emailVerified,
            image: user.image,
            mobileNumber: user.mobileNumber,
            whatsappNumber: user.whatsappNumber,
            aadhaarNumber: user.aadhaarNumber,
            upiId: user.upiId,
            state: user.state,
            district: user.district,
            collegeName: user.collegeName,
            collegeAddress: user.collegeAddress,
            username: user.username,
            cbUserId: user.cbUserId,
            firstName: user.firstName,
            middleName: user.middleName,
            lastName: user.lastName,
            registration: user.registration,
            rollNumber: user.rollNumber,
            branch: user.branch,
            admissionYear: user.admissionYear,
            address: user.address,
            postOffice: user.postOffice,
            policeStation: user.policeStation,
            block: user.block,
            pinCode: user.pinCode,
            profileComplete: user.profileComplete,
            hasLoggedIn: user.hasLoggedIn,
            loginCount: user.loginCount,
            lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
            githubUsername: user.githubUsername,
            batchId: user.batchId,
            batch: user.batch,
            specializedDomain: user.specializedDomain,
            socialLinks: user.socialLinks,
            customLinks: user.customLinks,
            role: user.role || "Member",
            banned: user.banned || false,
            banReason: user.banReason,
            createdAt: user.createdAt.toISOString(),
            updatedAt: user.updatedAt.toISOString(),
            stats: {
              totalPoints,
              attendanceCount,
              attendancePoints: attendancePoints._sum.points || 0,
              taskSubmissionCount,
              taskPoints: taskPoints._sum.pointsAwarded || 0,
              quizAttemptCount,
              quizPoints: quizPoints._sum.pointsEarned || 0,
              eventCount,
              eventPoints: eventPoints._sum.pointsAwarded || 0,
            },
          },
        });
      }

      case "batches": {
        const batches = await prisma.batch.findMany({
          orderBy: { createdAt: "desc" },
          include: {
            _count: {
              select: { members: true },
            },
          },
        });

        return NextResponse.json({
          success: true,
          data: batches.map((b) => ({
            id: b.id,
            name: b.name,
            code: b.code,
            description: b.description || "",
            admissionYear: b.admissionYear || "",
            status: b.isActive ? "Active" : "Archived",
            membersCount: b._count.members,
            createdAt: b.createdAt.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
          })),
        });
      }

      case "batch-detail": {
        const batchId = searchParams.get("id");
        if (!batchId) {
          return NextResponse.json({ error: "Batch ID is required" }, { status: 400 });
        }

        const batch = await prisma.batch.findUnique({
          where: { id: batchId },
          include: {
            members: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                branch: true,
                rollNumber: true,
                registration: true,
                image: true,
                banned: true,
                createdAt: true,
              },
              orderBy: { name: "asc" },
            },
            _count: {
              select: { members: true },
            },
          },
        });

        if (!batch) {
          return NextResponse.json({ error: "Batch not found" }, { status: 404 });
        }

        return NextResponse.json({
          success: true,
          data: {
            id: batch.id,
            name: batch.name,
            code: batch.code,
            description: batch.description || "",
            admissionYear: batch.admissionYear || "",
            status: batch.isActive ? "Active" : "Archived",
            membersCount: batch._count.members,
            createdAt: batch.createdAt.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
            members: batch.members.map((m) => ({
              id: m.id,
              name: m.name || m.email.split("@")[0],
              email: m.email,
              role: m.role || "Member",
              branch: m.branch || "General",
              rollNumber: m.rollNumber || null,
              registration: m.registration || null,
              status: m.banned ? "Banned" : "Active",
              image: m.image,
              createdAt: m.createdAt.toISOString(),
            })),
          },
        });
      }

      case "unassigned-members": {
        const unassigned = await prisma.user.findMany({
          where: {
            OR: [
              { batchId: null },
              { batchId: "" },
              { batchId: "none" },
            ],
          },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            branch: true,
            rollNumber: true,
            registration: true,
            image: true,
            banned: true,
          },
          orderBy: { name: "asc" },
        });

        return NextResponse.json({
          success: true,
          data: unassigned.map((m) => ({
            id: m.id,
            name: m.name || m.email.split("@")[0],
            email: m.email,
            role: m.role || "Member",
            branch: m.branch || "General",
            rollNumber: m.rollNumber || null,
            registration: m.registration || null,
            status: m.banned ? "Banned" : "Active",
            image: m.image,
          })),
        });
      }

      case "attendance": {
        const [sessions, allBatches, recentLogs] = await Promise.all([
          prisma.attendanceSession.findMany({
            orderBy: { sessionNumber: "desc" },
            include: {
              _count: {
                select: {
                  attendances: { where: { status: "present" } },
                },
              },
            },
          }),
          prisma.batch.findMany({
            select: { id: true, name: true, code: true, _count: { select: { members: true } } },
          }),
          prisma.attendance.findMany({
            take: 20,
            orderBy: { markedAt: "desc" },
            include: {
              session: {
                select: {
                  title: true,
                  sessionNumber: true,
                },
              },
            },
          }),
        ]);

        const batchMap = new Map(allBatches.map((b) => [b.id, b]));
        const totalBatchAssignedMembers = allBatches.reduce((acc, b) => acc + b._count.members, 0);

        // Get user names for logs
        const userIds = [...new Set(recentLogs.map((l) => l.userId))];
        const users = await prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, name: true, email: true },
        });
        const userMap = new Map(users.map((u) => [u.id, u.name || u.email]));

        return NextResponse.json({
          success: true,
          data: {
            sessions: sessions.map((s) => {
              const targetBatchNames = s.targetBatchIds && s.targetBatchIds.length > 0
                ? s.targetBatchIds.map((id) => batchMap.get(id)?.name || id).filter(Boolean)
                : ["All Batches"];

              let totalEligible = 0;
              if (s.targetBatchIds && s.targetBatchIds.length > 0) {
                totalEligible = s.targetBatchIds.reduce((sum, id) => sum + (batchMap.get(id)?._count.members || 0), 0);
              } else {
                totalEligible = totalBatchAssignedMembers;
              }

              return {
                id: s.id,
                sessionNumber: s.sessionNumber,
                title: s.title,
                date: s.date.toISOString(),
                day: s.day,
                targetBatchIds: s.targetBatchIds || [],
                targetBatchNames,
                targetBatchLabel: targetBatchNames.join(", "),
                presentCount: s._count.attendances,
                totalEligible,
                totalMarked: s._count.attendances,
              };
            }),
            recentLogs: recentLogs.map((l) => ({
              id: l.id,
              name: userMap.get(l.userId) || "Student",
              event: l.session ? `#${l.session.sessionNumber} - ${l.session.title}` : "Attendance Session",
              time: l.markedAt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }),
              status: l.status === "present" ? "Present" : "Absent",
              method: l.method,
            })),
          },
        });
      }

      case "attendance-session-detail": {
        const sessionId = searchParams.get("id");
        if (!sessionId) {
          return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
        }

        const session = await prisma.attendanceSession.findUnique({
          where: { id: sessionId },
          include: {
            attendances: true,
          },
        });

        if (!session) {
          return NextResponse.json({ error: "Attendance session not found" }, { status: 404 });
        }

        const allBatches = await prisma.batch.findMany({
          select: { id: true, name: true, code: true },
        });
        const batchMap = new Map(allBatches.map((b) => [b.id, b]));

        const targetBatchNames = session.targetBatchIds && session.targetBatchIds.length > 0
          ? session.targetBatchIds.map((id) => batchMap.get(id)?.name || id).filter(Boolean)
          : ["All Batches"];

        // Find only students belonging to assigned batches for this session
        const studentFilter: { banned: boolean; batchId?: { in: string[] } | { not: null; notIn: string[] } } = { banned: false };
        if (session.targetBatchIds && session.targetBatchIds.length > 0) {
          studentFilter.batchId = { in: session.targetBatchIds };
        } else {
          studentFilter.batchId = { not: null, notIn: ["", "none"] };
        }

        const students = await prisma.user.findMany({
          where: studentFilter,
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            branch: true,
            rollNumber: true,
            registration: true,
            image: true,
            batchId: true,
            batch: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
          orderBy: { name: "asc" },
        });

        const attendanceMap = new Map(session.attendances.map((a) => [a.userId, a]));

        let presentCount = 0;
        const studentList = students.map((stu) => {
          const att = attendanceMap.get(stu.id);
          const isPresent = att?.status === "present";
          if (isPresent) presentCount++;

          return {
            id: stu.id,
            name: stu.name || stu.email.split("@")[0],
            email: stu.email,
            role: stu.role || "Member",
            branch: stu.branch || "General",
            rollNumber: stu.rollNumber || null,
            registration: stu.registration || null,
            image: stu.image,
            batchId: stu.batchId,
            batchName: stu.batch?.name || "Unassigned",
            batchCode: stu.batch?.code || "",
            status: isPresent ? ("present" as const) : ("absent" as const),
            markedAt: att?.markedAt ? att.markedAt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }) : null,
            method: att?.method || "manual",
            points: att?.points || 0,
          };
        });

        const absentCount = students.length - presentCount;
        const rate = students.length > 0 ? Math.round((presentCount / students.length) * 100) : 0;

        return NextResponse.json({
          success: true,
          data: {
            id: session.id,
            sessionNumber: session.sessionNumber,
            title: session.title,
            date: session.date.toISOString(),
            day: session.day,
            targetBatchIds: session.targetBatchIds || [],
            targetBatchLabel: targetBatchNames.join(", "),
            totalEligible: students.length,
            presentCount,
            absentCount,
            attendanceRate: rate,
            students: studentList,
          },
        });
      }

      case "quizzes": {
        const quizzes = await prisma.quiz.findMany({
          take: 20,
          orderBy: { createdAt: "desc" },
          include: {
            _count: {
              select: { attempts: true },
            },
          },
        });

        return NextResponse.json({
          success: true,
          data: quizzes.map((q) => {
            let questionsCount = 0;
            try {
              const parsed = JSON.parse(q.questionsJson || "[]");
              questionsCount = Array.isArray(parsed) ? parsed.length : 0;
            } catch {
              questionsCount = 0;
            }

            return {
              id: q.id,
              quizId: q.quizId,
              title: q.title,
              description: q.description,
              questionsCount,
              duration: `${q.duration} mins`,
              participants: q._count.attempts,
              status: q.isActive ? "Active" : "Closed",
            };
          }),
        });
      }

      case "tasks": {
        const tasks = await prisma.task.findMany({
          take: 20,
          orderBy: { createdAt: "desc" },
          include: {
            _count: {
              select: { submissions: true },
            },
          },
        });

        return NextResponse.json({
          success: true,
          data: tasks.map((t) => ({
            id: t.id,
            taskNumber: t.taskNumber,
            title: t.title,
            description: t.description || "",
            points: `+${t.points} pts`,
            dueDate: t.dueDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
            submissionsCount: t._count.submissions,
          })),
        });
      }


      case "points": {
        const [totalPoints, recentAttendances, recentTasks] = await Promise.all([
          prisma.attendance.aggregate({ _sum: { points: true }, where: { status: "present" } }),
          prisma.attendance.findMany({
            take: 5,
            orderBy: { markedAt: "desc" },
            where: { status: "present" },
            include: { session: { select: { title: true } } },
          }),
          prisma.taskSubmission.findMany({
            take: 5,
            orderBy: { evaluatedAt: "desc" },
            where: { status: "approved" },
            include: { task: { select: { title: true } } },
          }),
        ]);

        const allLogs: { id: string; reason: string; target: string; points: string; date: string }[] = [];

        recentAttendances.forEach((a) => {
          allLogs.push({
            id: `att-${a.id}`,
            reason: a.session?.title || "Session Attendance",
            target: "Verified Member",
            points: `+${a.points || 50} pts`,
            date: a.markedAt.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          });
        });

        recentTasks.forEach((t) => {
          allLogs.push({
            id: `tsk-${t.id}`,
            reason: t.task?.title || "Task Evaluation",
            target: "Task Submitter",
            points: `+${t.pointsAwarded || 100} pts`,
            date: t.evaluatedAt ? t.evaluatedAt.toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Recent",
          });
        });

        return NextResponse.json({
          success: true,
          data: {
            totalPoints: totalPoints._sum.points || 0,
            activity: allLogs,
          },
        });
      }

      case "forms": {
        const forms = await prisma.form.findMany({
          orderBy: { createdAt: "desc" },
          include: {
            _count: {
              select: { responses: true },
            },
          },
        });

        return NextResponse.json({
          success: true,
          data: forms.map((f) => ({
            id: f.id,
            formId: f.formId,
            title: f.title,
            description: f.description || "",
            isPublished: f.isPublished,
            acceptingResponses: f.acceptingResponses,
            publishedAt: f.publishedAt ? f.publishedAt.toISOString() : null,
            responsesCount: f._count.responses,
            status: f.acceptingResponses ? "Accepting Responses" : "Closed",
            createdAt: f.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
            updatedAt: f.updatedAt.toISOString(),
          })),
        });
      }

      case "form-detail": {
        const idOrFormId = searchParams.get("id") || searchParams.get("formId");
        if (!idOrFormId) {
          return NextResponse.json({ error: "Form ID is required" }, { status: 400 });
        }

        const form = await prisma.form.findFirst({
          where: {
            OR: [{ id: idOrFormId }, { formId: idOrFormId }],
          },
          include: {
            responses: {
              include: {
                submittedBy: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    image: true,
                    branch: true,
                    rollNumber: true,
                    registration: true,
                  },
                },
                files: true,
              },
              orderBy: { createdAt: "desc" },
            },
            _count: {
              select: { responses: true },
            },
          },
        });

        if (!form) {
          return NextResponse.json({ error: "Form not found" }, { status: 404 });
        }

        return NextResponse.json({
          success: true,
          data: {
            id: form.id,
            formId: form.formId,
            title: form.title,
            description: form.description || "",
            isPublished: form.isPublished,
            acceptingResponses: form.acceptingResponses,
            publishedAt: form.publishedAt ? form.publishedAt.toISOString() : null,
            createdAt: form.createdAt.toISOString(),
            updatedAt: form.updatedAt.toISOString(),
            definition: form.definition,
            responsesCount: form._count.responses,
            responses: form.responses.map((r) => ({
              id: r.id,
              formId: r.formId,
              answers: r.answers || {},
              transactionId: r.transactionId,
              paymentStatus: r.paymentStatus || "pending",
              verifiedAt: r.verifiedAt ? r.verifiedAt.toISOString() : null,
              createdAt: r.createdAt.toISOString(),
              submittedBy: r.submittedBy
                ? {
                    id: r.submittedBy.id,
                    name: r.submittedBy.name,
                    email: r.submittedBy.email,
                    image: r.submittedBy.image,
                    branch: r.submittedBy.branch,
                    rollNumber: r.submittedBy.rollNumber,
                    registration: r.submittedBy.registration,
                  }
                : null,
              files: (r.files || []).map((f) => ({
                id: f.id,
                fieldId: f.fieldId,
                originalFileName: f.originalFileName,
                storedFileName: f.storedFileName,
                mimeType: f.mimeType,
                fileSize: f.fileSize,
                googleDriveWebViewLink: f.googleDriveWebViewLink,
                googleDriveDownloadLink: f.googleDriveDownloadLink,
              })),
            })),
          },
        });
      }

      case "form-response-detail": {
        const responseId = searchParams.get("id") || searchParams.get("responseId");
        if (!responseId) {
          return NextResponse.json({ error: "Response ID is required" }, { status: 400 });
        }

        const response = await prisma.formResponse.findUnique({
          where: { id: responseId },
          include: {
            form: {
              select: {
                id: true,
                formId: true,
                title: true,
                description: true,
                definition: true,
              },
            },
            submittedBy: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
                branch: true,
                rollNumber: true,
                registration: true,
              },
            },
            files: true,
          },
        });

        if (!response) {
          return NextResponse.json({ error: "Response not found" }, { status: 404 });
        }

        return NextResponse.json({
          success: true,
          data: {
            id: response.id,
            formId: response.formId,
            formTitle: response.form.title,
            formCode: response.form.formId,
            formDefinition: response.form.definition,
            answers: response.answers || {},
            transactionId: response.transactionId,
            paymentStatus: response.paymentStatus || "pending",
            verifiedAt: response.verifiedAt ? response.verifiedAt.toISOString() : null,
            createdAt: response.createdAt.toISOString(),
            submittedBy: response.submittedBy
              ? {
                  id: response.submittedBy.id,
                  name: response.submittedBy.name,
                  email: response.submittedBy.email,
                  image: response.submittedBy.image,
                  branch: response.submittedBy.branch,
                  rollNumber: response.submittedBy.rollNumber,
                  registration: response.submittedBy.registration,
                }
              : null,
            files: (response.files || []).map((f) => ({
              id: f.id,
              fieldId: f.fieldId,
              originalFileName: f.originalFileName,
              storedFileName: f.storedFileName,
              mimeType: f.mimeType,
              fileSize: f.fileSize,
              googleDriveWebViewLink: f.googleDriveWebViewLink,
              googleDriveDownloadLink: f.googleDriveDownloadLink,
            })),
          },
        });
      }

      case "admin-settings":
      case "profile": {
        const userId = searchParams.get("userId") || searchParams.get("id");
        let user = null;
        if (userId) {
          user = await prisma.user.findUnique({
            where: { id: userId },
          });
        }
        if (!user) {
          user = await prisma.user.findFirst({
            where: { role: { in: ["ADMIN", "admin", "SUPER_ADMIN", "superadmin", "coadmin", "COADMIN"] } },
            orderBy: { createdAt: "asc" },
          });
        }
        if (!user) {
          user = await prisma.user.findFirst();
        }

        // Fetch System Settings
        const [regSetting, quizSetting, ghSetting] = await Promise.all([
          prisma.systemSettings.findUnique({ where: { key: "registration_enabled" } }),
          prisma.systemSettings.findUnique({ where: { key: "external_quiz_enabled" } }),
          prisma.systemSettings.findUnique({ where: { key: "github_org_name" } }),
        ]);

        // Fetch Active Sessions
        let sessionsList: Array<{
          id: string;
          userId: string;
          userName: string;
          userEmail: string;
          ipAddress: string | null;
          userAgent: string | null;
          createdAt: string;
          expiresAt: string;
        }> = [];

        try {
          const sessions = await prisma.session.findMany({
            where: { expiresAt: { gt: new Date() } },
            take: 10,
            orderBy: { createdAt: "desc" },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          });
          sessionsList = sessions.map((s) => ({
            id: s.id,
            userId: s.userId,
            userName: s.user?.name || "Admin User",
            userEmail: s.user?.email || "",
            ipAddress: s.ipAddress || "Unknown IP",
            userAgent: s.userAgent || "Mobile / Web Device",
            createdAt: s.createdAt.toISOString(),
            expiresAt: s.expiresAt.toISOString(),
          }));
        } catch {
          sessionsList = [];
        }

        return NextResponse.json({
          success: true,
          data: {
            user: user
              ? {
                  id: user.id,
                  name: user.name,
                  email: user.email,
                  emailVerified: user.emailVerified,
                  role: user.role || "ADMIN",
                  image: user.image,
                  profileImageKey: user.profileImageKey,
                  username: user.username,
                  firstName: user.firstName,
                  middleName: user.middleName,
                  lastName: user.lastName,
                  mobileNumber: user.mobileNumber,
                  whatsappNumber: user.whatsappNumber,
                  registration: user.registration,
                  rollNumber: user.rollNumber,
                  branch: user.branch,
                  admissionYear: user.admissionYear,
                  collegeName: user.collegeName,
                  collegeAddress: user.collegeAddress,
                  address: user.address,
                  postOffice: user.postOffice,
                  policeStation: user.policeStation,
                  block: user.block,
                  pinCode: user.pinCode,
                  state: user.state,
                  district: user.district,
                  githubUsername: user.githubUsername,
                  socialLinks: user.socialLinks || {},
                  customLinks: user.customLinks || [],
                  profileComplete: user.profileComplete,
                  createdAt: user.createdAt.toISOString(),
                }
              : null,
            systemSettings: {
              registrationEnabled: regSetting ? regSetting.value === "true" : true,
              externalQuizEnabled: quizSetting ? quizSetting.value === "true" : false,
              githubOrgName: ghSetting ? ghSetting.value : "codebreakers-club",
            },
            sessions: sessionsList,
            googleDrive: {
              isConnected: false,
              email: undefined,
            },
          },
        });
      }

      case "leaderboard": {
        const timeframe = (searchParams.get("timeframe") || "overall").toLowerCase();
        const batchId = searchParams.get("batchId");
        const currentDate = new Date();
        const year = parseInt(searchParams.get("year") || "") || currentDate.getFullYear();
        const month = parseInt(searchParams.get("month") || "") || currentDate.getMonth() + 1;

        const effectiveBatchId = batchId && batchId !== "all" ? batchId : null;

        // 1. Fetch all batches for filter dropdown/chips
        const batches = await prisma.batch.findMany({
          select: {
            id: true,
            name: true,
            code: true,
            isActive: true,
          },
          orderBy: { createdAt: "desc" },
        });

        // 2. Fetch users (Include all batch members/students)
        const users = await prisma.user.findMany({
          where: {
            ...(effectiveBatchId ? { batchId: effectiveBatchId } : {}),
          },
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            profileImageKey: true,
            branch: true,
            rollNumber: true,
            registration: true,
            batchId: true,
            role: true,
            batch: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        });

        const userIds = users.map((u) => u.id);

        if (userIds.length === 0) {
          return NextResponse.json({
            success: true,
            data: {
              leaderboard: [],
              batches: [
                { id: "all", name: "All Batches", code: "ALL" },
                ...batches.map((b) => ({ id: b.id, name: b.name, code: b.code })),
              ],
              timeframe,
              year,
              month,
              batchId: effectiveBatchId || "all",
            },
          });
        }

        // 3. Compute aggregations based on timeframe
        let attendanceGroup: Array<{ userId: string; _sum: { points: number | null }; _count: { _all: number } }> = [];
        let taskGroup: Array<{ userId: string; _sum: { pointsAwarded: number | null }; _count: { _all: number } }> = [];
        let eventGroup: Array<{ userId: string; _sum: { pointsAwarded: number | null }; _count: { _all: number } }> = [];
        let quizAttempts: Array<{ userId: string; pointsEarned: number }> = [];

        if (timeframe === "monthly") {
          const startDate = new Date(year, month - 1, 1);
          const endDate = new Date(year, month, 0, 23, 59, 59, 999);

          const [att, tsk, evt, qz] = await Promise.all([
            prisma.attendance.groupBy({
              by: ["userId"],
              _sum: { points: true },
              _count: { _all: true },
              where: {
                status: "present",
                userId: { in: userIds },
                session: {
                  date: { gte: startDate, lte: endDate },
                },
              },
            }),
            prisma.taskSubmission.groupBy({
              by: ["userId"],
              _sum: { pointsAwarded: true },
              _count: { _all: true },
              where: {
                status: "approved",
                userId: { in: userIds },
                createdAt: { gte: startDate, lte: endDate },
              },
            }),
            prisma.eventParticipation.groupBy({
              by: ["userId"],
              _sum: { pointsAwarded: true },
              _count: { _all: true },
              where: {
                status: "approved",
                userId: { in: userIds },
                createdAt: { gte: startDate, lte: endDate },
              },
            }),
            prisma.quizAttempt.findMany({
              where: {
                userId: { in: userIds },
                completedAt: { gte: startDate, lte: endDate },
              },
              select: {
                userId: true,
                pointsEarned: true,
              },
            }),
          ]);

          attendanceGroup = att;
          taskGroup = tsk;
          eventGroup = evt;
          quizAttempts = qz;
        } else {
          // Overall
          const [att, tsk, evt, qz] = await Promise.all([
            prisma.attendance.groupBy({
              by: ["userId"],
              _sum: { points: true },
              _count: { _all: true },
              where: {
                status: "present",
                userId: { in: userIds },
              },
            }),
            prisma.taskSubmission.groupBy({
              by: ["userId"],
              _sum: { pointsAwarded: true },
              _count: { _all: true },
              where: {
                status: "approved",
                userId: { in: userIds },
              },
            }),
            prisma.eventParticipation.groupBy({
              by: ["userId"],
              _sum: { pointsAwarded: true },
              _count: { _all: true },
              where: {
                status: "approved",
                userId: { in: userIds },
              },
            }),
            prisma.quizAttempt.findMany({
              where: {
                userId: { in: userIds },
                completedAt: { not: null },
              },
              select: {
                userId: true,
                pointsEarned: true,
              },
            }),
          ]);

          attendanceGroup = att;
          taskGroup = tsk;
          eventGroup = evt;
          quizAttempts = qz;
        }

        // Map indexed aggregations
        const attendanceMap = new Map(attendanceGroup.map((a) => [a.userId, a]));
        const taskMap = new Map(taskGroup.map((t) => [t.userId, t]));
        const eventMap = new Map(eventGroup.map((e) => [e.userId, e]));

        const quizMap = new Map<string, { totalPoints: number; count: number }>();
        for (const q of quizAttempts) {
          const current = quizMap.get(q.userId) || { totalPoints: 0, count: 0 };
          quizMap.set(q.userId, {
            totalPoints: current.totalPoints + (q.pointsEarned || 0),
            count: current.count + 1,
          });
        }

        // Build rankings
        const rankedUsers = users
          .map((user) => {
            const att = attendanceMap.get(user.id);
            const tsk = taskMap.get(user.id);
            const evt = eventMap.get(user.id);
            const qz = quizMap.get(user.id);

            const attendancePoints = att?._sum.points || 0;
            const taskPoints = tsk?._sum.pointsAwarded || 0;
            const eventPoints = evt?._sum.pointsAwarded || 0;
            const quizPoints = qz?.totalPoints || 0;
            const totalPoints = attendancePoints + taskPoints + eventPoints + quizPoints;

            return {
              id: user.id,
              name: user.name || user.email.split("@")[0],
              email: user.email,
              image: user.image,
              profileImageKey: user.profileImageKey,
              branch: user.branch || "General",
              rollNumber: user.rollNumber,
              registration: user.registration,
              batchId: user.batchId,
              batchName: user.batch ? user.batch.name : "Unassigned",
              batchCode: user.batch ? user.batch.code : null,
              totalPoints,
              points: totalPoints, // alias
              attendancePoints,
              taskPoints,
              eventPoints,
              quizPoints,
              sessionsAttended: att?._count._all || 0,
              tasksCompleted: tsk?._count._all || 0,
              eventsParticipated: evt?._count._all || 0,
              quizzesTaken: qz?.count || 0,
            };
          })
          .sort((a, b) => b.totalPoints - a.totalPoints)
          .map((item, idx) => ({
            ...item,
            rank: idx + 1,
          }));

        return NextResponse.json({
          success: true,
          data: {
            leaderboard: rankedUsers,
            batches: [
              { id: "all", name: "All Batches", code: "ALL" },
              ...batches.map((b) => ({ id: b.id, name: b.name, code: b.code })),
            ],
            timeframe,
            year,
            month,
            batchId: effectiveBatchId || "all",
          },
        });
      }

      case "roadmaps": {
        const roadmaps = await prisma.roadmap.findMany({
          take: 20,
          orderBy: { createdAt: "desc" },
          include: {
            _count: {
              select: { userProgress: true },
            },
          },
        });

        return NextResponse.json({
          success: true,
          data: roadmaps.map((r) => {
            let stagesCount = 0;
            try {
              const nodes = JSON.parse(r.nodesJson || "[]");
              stagesCount = Array.isArray(nodes) ? nodes.length : 0;
            } catch {
              stagesCount = 0;
            }

            return {
              id: r.id,
              slug: r.slug,
              title: r.title,
              category: r.category,
              badgeText: r.badgeText || "Track",
              stagesCount,
              enrolledCount: r._count.userProgress,
            };
          }),
        });
      }

      case "transaction-forms":
      case "transactions": {
        const [allForms, allResponses] = await Promise.all([
          prisma.form.findMany({
            orderBy: { createdAt: "desc" },
            include: {
              _count: {
                select: { responses: true },
              },
            },
          }),
          prisma.formResponse.findMany({
            where: {
              transactionId: { not: null },
            },
            select: {
              id: true,
              formId: true,
              transactionId: true,
              paymentStatus: true,
              createdAt: true,
            },
            orderBy: { createdAt: "desc" },
          }),
        ]);

        const responsesByForm = new Map<string, typeof allResponses>();
        for (const r of allResponses) {
          const txId = (r.transactionId || "").trim();
          if (!txId || ["null", "undefined", "n/a", "none", "nil"].includes(txId.toLowerCase())) continue;
          const list = responsesByForm.get(r.formId) || [];
          list.push(r);
          responsesByForm.set(r.formId, list);
        }

        const extractPaymentInfo = (definitionJson: unknown) => {
          let hasPayment = false;
          let amount = 0;
          try {
            const def = typeof definitionJson === "string" ? JSON.parse(definitionJson) : definitionJson;
            if (def && Array.isArray(def.sections)) {
              for (const sec of def.sections) {
                if (Array.isArray(sec.fields)) {
                  for (const f of sec.fields) {
                    if (f.type === "payment") {
                      hasPayment = true;
                      if (f.paymentAmount !== undefined) {
                        amount = Number(f.paymentAmount) || 0;
                      }
                      break;
                    }
                  }
                }
              }
            }
          } catch {}
          return { hasPayment, amount };
        };

        const formSummaries = [];
        let totalOverallRevenue = 0;
        let totalOverallTransactions = 0;
        let totalOverallVerified = 0;
        let totalOverallPending = 0;

        for (const f of allForms) {
          const { hasPayment, amount } = extractPaymentInfo(f.definition);
          const formTxResponses = responsesByForm.get(f.id) || responsesByForm.get(f.formId) || [];

          if (!hasPayment && formTxResponses.length === 0) {
            continue;
          }

          let verifiedCount = 0;
          let pendingCount = 0;
          let rejectedCount = 0;

          for (const r of formTxResponses) {
            const status = (r.paymentStatus || "").toLowerCase();
            if (status === "verified" || status === "completed" || status === "approved") {
              verifiedCount++;
            } else if (status === "rejected") {
              rejectedCount++;
            } else {
              pendingCount++;
            }
          }

          const formRevenue = verifiedCount * amount;
          totalOverallRevenue += formRevenue;
          totalOverallTransactions += formTxResponses.length;
          totalOverallVerified += verifiedCount;
          totalOverallPending += pendingCount;

          formSummaries.push({
            id: f.id,
            formId: f.formId,
            title: f.title,
            description: f.description || "",
            paymentAmount: amount,
            formattedAmount: amount > 0 ? `₹${amount.toFixed(2)}` : "Free",
            totalTransactions: formTxResponses.length,
            verifiedCount,
            pendingCount,
            rejectedCount,
            totalRevenue: formRevenue,
            formattedRevenue: `₹${formRevenue.toFixed(2)}`,
            lastTransactionDate: formTxResponses.length > 0 ? formTxResponses[0].createdAt.toISOString() : null,
            createdAt: f.createdAt.toISOString(),
          });
        }

        return NextResponse.json({
          success: true,
          data: {
            forms: formSummaries,
            stats: {
              totalRevenue: totalOverallRevenue,
              formattedTotalRevenue: `₹${totalOverallRevenue.toFixed(2)}`,
              totalTransactions: totalOverallTransactions,
              totalVerified: totalOverallVerified,
              totalPending: totalOverallPending,
            },
          },
        });
      }

      case "form-transactions": {
        const formIdOrId = searchParams.get("formId") || searchParams.get("id");
        if (!formIdOrId) {
          return NextResponse.json({ error: "formId or id is required" }, { status: 400 });
        }

        const form = await prisma.form.findFirst({
          where: {
            OR: [{ id: formIdOrId }, { formId: formIdOrId }],
          },
          include: {
            responses: {
              where: {
                transactionId: { not: null },
              },
              include: {
                submittedBy: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    image: true,
                    branch: true,
                    rollNumber: true,
                    registration: true,
                    mobileNumber: true,
                    whatsappNumber: true,
                    collegeName: true,
                  },
                },
                files: true,
              },
              orderBy: { createdAt: "desc" },
            },
          },
        });

        if (!form) {
          return NextResponse.json({ error: "Form not found" }, { status: 404 });
        }

        let paymentAmount = 0;
        try {
          const def = typeof form.definition === "string" ? JSON.parse(form.definition) : form.definition;
          if (def && Array.isArray(def.sections)) {
            for (const sec of def.sections) {
              if (Array.isArray(sec.fields)) {
                for (const f of sec.fields) {
                  if (f.type === "payment" && f.paymentAmount !== undefined) {
                    paymentAmount = Number(f.paymentAmount) || 0;
                    break;
                  }
                }
              }
            }
          }
        } catch {}

        const validTxResponses = form.responses.filter((r) => {
          const txId = (r.transactionId || "").trim();
          return txId.length > 2 && !["null", "undefined", "n/a", "none", "nil"].includes(txId.toLowerCase());
        });

        let verifiedCount = 0;
        let pendingCount = 0;
        let rejectedCount = 0;

        const transactionsList = validTxResponses.map((r) => {
          const status = r.paymentStatus || "pending";
          if (status === "verified" || status === "completed" || status === "approved") {
            verifiedCount++;
          } else if (status === "rejected") {
            rejectedCount++;
          } else {
            pendingCount++;
          }

          const ans = (r.answers as Record<string, unknown>) || {};
          let payerName = r.submittedBy?.name || "";
          let payerEmail = r.submittedBy?.email || "";
          if (!payerName) {
            for (const [k, v] of Object.entries(ans)) {
              if (k.toLowerCase().includes("name") && typeof v === "string" && v.trim()) {
                payerName = v.trim();
                break;
              }
            }
          }
          if (!payerEmail) {
            for (const [k, v] of Object.entries(ans)) {
              if (typeof v === "string" && (k.toLowerCase().includes("email") || (v.includes("@") && v.includes(".")))) {
                payerEmail = v.trim();
                break;
              }
            }
          }

          const receiptNo = `CB-REC-${r.id.slice(0, 8).toUpperCase()}`;

          return {
            id: r.id,
            formId: form.formId,
            formTitle: form.title,
            receiptNumber: receiptNo,
            transactionId: r.transactionId?.trim() || "",
            paymentStatus: status,
            paymentAmount,
            formattedAmount: paymentAmount > 0 ? `₹${paymentAmount.toFixed(2)}` : "Free",
            payerName: payerName || "Participant",
            payerEmail: payerEmail || "No email",
            payerAvatar: r.submittedBy?.image || null,
            branch: r.submittedBy?.branch || null,
            rollNumber: r.submittedBy?.rollNumber || null,
            registration: r.submittedBy?.registration || null,
            createdAt: r.createdAt.toISOString(),
            verifiedAt: r.verifiedAt ? r.verifiedAt.toISOString() : null,
          };
        });

        const totalRevenue = verifiedCount * paymentAmount;

        return NextResponse.json({
          success: true,
          data: {
            formId: form.formId,
            id: form.id,
            title: form.title,
            paymentAmount,
            formattedAmount: paymentAmount > 0 ? `₹${paymentAmount.toFixed(2)}` : "Free",
            stats: {
              totalTransactions: transactionsList.length,
              verifiedCount,
              pendingCount,
              rejectedCount,
              totalRevenue,
              formattedRevenue: `₹${totalRevenue.toFixed(2)}`,
            },
            transactions: transactionsList,
          },
        });
      }

      case "transaction-detail": {
        const idOrTxId = searchParams.get("id") || searchParams.get("responseId") || searchParams.get("transactionId");
        if (!idOrTxId) {
          return NextResponse.json({ error: "id or transactionId is required" }, { status: 400 });
        }

        const response = await prisma.formResponse.findFirst({
          where: {
            OR: [
              { id: idOrTxId },
              { transactionId: idOrTxId },
            ],
          },
          include: {
            form: {
              select: {
                id: true,
                formId: true,
                title: true,
                description: true,
                definition: true,
              },
            },
            submittedBy: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
                branch: true,
                rollNumber: true,
                registration: true,
                mobileNumber: true,
                whatsappNumber: true,
                collegeName: true,
                collegeAddress: true,
              },
            },
            files: true,
          },
        });

        if (!response) {
          return NextResponse.json({ error: "Transaction response not found" }, { status: 404 });
        }

        let paymentAmount = 0;
        try {
          const def = typeof response.form.definition === "string" ? JSON.parse(response.form.definition) : response.form.definition;
          if (def && Array.isArray(def.sections)) {
            for (const sec of def.sections) {
              if (Array.isArray(sec.fields)) {
                for (const f of sec.fields) {
                  if (f.type === "payment" && f.paymentAmount !== undefined) {
                    paymentAmount = Number(f.paymentAmount) || 0;
                    break;
                  }
                }
              }
            }
          }
        } catch {}

        const receiptNo = `CB-REC-${response.id.slice(0, 8).toUpperCase()}`;

        const ans = (response.answers as Record<string, unknown>) || {};
        let payerName = response.submittedBy?.name || "";
        let payerEmail = response.submittedBy?.email || "";
        let payerPhone = response.submittedBy?.mobileNumber || response.submittedBy?.whatsappNumber || "";
        let collegeName = response.submittedBy?.collegeName || "";

        for (const [k, v] of Object.entries(ans)) {
          if (typeof v === "string") {
            const key = k.toLowerCase();
            if (!payerName && key.includes("name")) payerName = v.trim();
            if (!payerEmail && (key.includes("email") || (v.includes("@") && v.includes(".")))) payerEmail = v.trim();
            if (!payerPhone && (key.includes("phone") || key.includes("mobile") || key.includes("whatsapp") || key.includes("contact"))) payerPhone = v.trim();
            if (!collegeName && (key.includes("college") || key.includes("school") || key.includes("institute"))) collegeName = v.trim();
          }
        }

        return NextResponse.json({
          success: true,
          data: {
            id: response.id,
            receiptNumber: receiptNo,
            transactionId: response.transactionId?.trim() || "",
            paymentStatus: response.paymentStatus || "pending",
            paymentAmount,
            formattedAmount: paymentAmount > 0 ? `₹${paymentAmount.toFixed(2)}` : "Free",
            createdAt: response.createdAt.toISOString(),
            verifiedAt: response.verifiedAt ? response.verifiedAt.toISOString() : null,
            form: {
              id: response.form.id,
              formId: response.form.formId,
              title: response.form.title,
              definition: response.form.definition,
            },
            payer: {
              id: response.submittedBy?.id || null,
              name: payerName || "Participant",
              email: payerEmail || "No email",
              phone: payerPhone || null,
              college: collegeName || null,
              branch: response.submittedBy?.branch || null,
              rollNumber: response.submittedBy?.rollNumber || null,
              registration: response.submittedBy?.registration || null,
              image: response.submittedBy?.image || null,
            },
            answers: response.answers || {},
            files: (response.files || []).map((f) => ({
              id: f.id,
              fieldId: f.fieldId,
              originalFileName: f.originalFileName,
              storedFileName: f.storedFileName,
              mimeType: f.mimeType,
              fileSize: f.fileSize,
              googleDriveWebViewLink: f.googleDriveWebViewLink,
              googleDriveDownloadLink: f.googleDriveDownloadLink,
            })),
          },
        });
      }

      case "events": {
        const events = await prisma.eventPoint.findMany({
          take: 20,
          orderBy: { eventDate: "desc" },
          include: {
            _count: {
              select: { participations: true },
            },
          },
        });

        return NextResponse.json({
          success: true,
          data: events.map((e) => ({
            id: e.id,
            eventNumber: e.eventNumber,
            title: e.title,
            description: e.description || "",
            points: e.points,
            date: e.eventDate.toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short", year: "numeric" }),
            attendeesCount: e._count.participations,
            status: e.eventDate >= new Date() ? "Upcoming" : "Completed",
          })),
        });
      }

      case "system-settings": {
        const settings = await prisma.systemSettings.findMany();
        return NextResponse.json({
          success: true,
          data: {
            settings,
            serverStatus: "Operational",
            databaseEngine: "PostgreSQL",
          },
        });
      }

      default:
        return NextResponse.json({ error: "Unknown type" }, { status: 400 });
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Internal database error";
    console.error("Admin mobile API error:", error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    switch (action) {
      // 1. Members CRUD
      case "add-member": {
        const { name, email, role, branch, batchId } = body;
        if (!email) {
          return NextResponse.json({ error: "Email is required" }, { status: 400 });
        }
        const user = await prisma.user.upsert({
          where: { email: email.trim().toLowerCase() },
          update: {
            name: name || undefined,
            role: role || "Member",
            branch: branch || undefined,
            batchId: batchId || undefined,
          },
          create: {
            id: `usr_${Date.now()}`,
            email: email.trim().toLowerCase(),
            name: name || email.split("@")[0],
            role: role || "Member",
            branch: branch || "General",
            batchId: batchId || null,
          },
        });
        void emitRealtimeEvent("admin-members", "member_change", { action: "add-member", id: user.id });
        return NextResponse.json({ success: true, data: user });
      }

      case "update-member": {
        const {
          id,
          name,
          email,
          role,
          branch,
          batchId,
          specializedDomain,
          firstName,
          middleName,
          lastName,
          username,
          cbUserId,
          mobileNumber,
          whatsappNumber,
          aadhaarNumber,
          collegeName,
          collegeAddress,
          rollNumber,
          registration,
          admissionYear,
          address,
          state,
          district,
          postOffice,
          policeStation,
          block,
          pinCode,
          githubUsername,
          socialLinks,
          customLinks,
          profileComplete,
        } = body;

        if (!id) {
          return NextResponse.json({ error: "Member ID is required" }, { status: 400 });
        }

        const updated = await prisma.user.update({
          where: { id },
          data: {
            name: name !== undefined ? name : undefined,
            email: email !== undefined ? email.trim().toLowerCase() : undefined,
            role: role !== undefined ? role : undefined,
            branch: branch !== undefined ? branch : undefined,
            batchId: batchId !== undefined ? (batchId === "none" || !batchId ? null : batchId) : undefined,
            specializedDomain: specializedDomain !== undefined ? specializedDomain : undefined,
            firstName: firstName !== undefined ? firstName : undefined,
            middleName: middleName !== undefined ? middleName : undefined,
            lastName: lastName !== undefined ? lastName : undefined,
            username: username !== undefined ? username : undefined,
            cbUserId: cbUserId !== undefined ? cbUserId : undefined,
            mobileNumber: mobileNumber !== undefined ? mobileNumber : undefined,
            whatsappNumber: whatsappNumber !== undefined ? whatsappNumber : undefined,
            aadhaarNumber: aadhaarNumber !== undefined ? aadhaarNumber : undefined,
            collegeName: collegeName !== undefined ? collegeName : undefined,
            collegeAddress: collegeAddress !== undefined ? collegeAddress : undefined,
            rollNumber: rollNumber !== undefined ? rollNumber : undefined,
            registration: registration !== undefined ? registration : undefined,
            admissionYear: admissionYear !== undefined ? admissionYear : undefined,
            address: address !== undefined ? address : undefined,
            state: state !== undefined ? state : undefined,
            district: district !== undefined ? district : undefined,
            postOffice: postOffice !== undefined ? postOffice : undefined,
            policeStation: policeStation !== undefined ? policeStation : undefined,
            block: block !== undefined ? block : undefined,
            pinCode: pinCode !== undefined ? pinCode : undefined,
            githubUsername: githubUsername !== undefined ? githubUsername : undefined,
            socialLinks: socialLinks !== undefined ? socialLinks : undefined,
            customLinks: customLinks !== undefined ? customLinks : undefined,
            profileComplete: profileComplete !== undefined ? Boolean(profileComplete) : undefined,
          },
        });

        void emitRealtimeEvent("admin-members", "member_change", { action: "update-member", id });
        return NextResponse.json({ success: true, data: updated });
      }

      case "toggle-ban-member": {
        const { id, banned, banReason } = body;
        if (!id) {
          return NextResponse.json({ error: "Member ID is required" }, { status: 400 });
        }
        const updated = await prisma.user.update({
          where: { id },
          data: {
            banned: Boolean(banned),
            banReason: banned ? banReason || "Administrative decision" : null,
          },
        });
        void emitRealtimeEvent("admin-members", "member_change", { action: "toggle-ban", id });
        return NextResponse.json({ success: true, data: updated });
      }

      case "delete-member": {
        const { id } = body;
        await prisma.user.delete({ where: { id } });
        void emitRealtimeEvent("admin-members", "member_change", { action: "delete-member", id });
        return NextResponse.json({ success: true });
      }

      // 2. Batches CRUD
      case "add-batch": {
        const { name, code, description, admissionYear } = body;
        const batch = await prisma.batch.create({
          data: {
            name,
            code: code.toUpperCase(),
            description,
            admissionYear,
          },
        });
        void emitRealtimeEvent("admin-batches", "batch_change", { action: "add-batch", id: batch.id });
        return NextResponse.json({ success: true, data: batch });
      }

      case "delete-batch": {
        const { id } = body;
        await prisma.batch.delete({ where: { id } });
        void emitRealtimeEvent("admin-batches", "batch_change", { action: "delete-batch", id });
        return NextResponse.json({ success: true });
      }

      case "assign-members-to-batch": {
        const { batchId, userIds } = body;
        if (!batchId || !Array.isArray(userIds) || userIds.length === 0) {
          return NextResponse.json({ error: "batchId and userIds array are required" }, { status: 400 });
        }
        await prisma.user.updateMany({
          where: { id: { in: userIds } },
          data: { batchId },
        });
        void emitRealtimeEvent("admin-batches", "batch_change", { action: "assign-members", batchId, count: userIds.length });
        void emitRealtimeEvent("admin-members", "member_change", { action: "assign-batch", batchId, count: userIds.length });
        return NextResponse.json({ success: true, count: userIds.length });
      }

      case "remove-member-from-batch": {
        const { userId } = body;
        if (!userId) {
          return NextResponse.json({ error: "userId is required" }, { status: 400 });
        }
        await prisma.user.update({
          where: { id: userId },
          data: { batchId: null },
        });
        void emitRealtimeEvent("admin-batches", "batch_change", { action: "remove-member", userId });
        void emitRealtimeEvent("admin-members", "member_change", { action: "unassign-batch", userId });
        return NextResponse.json({ success: true });
      }

      // 3. Attendance Sessions & QR Logging
      case "add-session": {
        const { title, date, day, targetBatchIds } = body;
        const latest = await prisma.attendanceSession.findFirst({
          orderBy: { sessionNumber: "desc" },
          select: { sessionNumber: true },
        });
        const nextSessionNum = (latest?.sessionNumber || 0) + 1;

        const sessionDate = date ? new Date(date) : new Date();
        const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const sessionDay = day || days[sessionDate.getDay()];

        const session = await prisma.attendanceSession.create({
          data: {
            sessionNumber: nextSessionNum,
            title: title || `Session #${nextSessionNum}`,
            date: sessionDate,
            day: sessionDay,
            targetBatchIds: Array.isArray(targetBatchIds) ? targetBatchIds : [],
            createdBy: "admin",
          },
        });
        void emitRealtimeEvent("admin-attendance", "attendance_change", { action: "add-session", id: session.id });
        return NextResponse.json({ success: true, data: session });
      }

      case "delete-session": {
        const { id } = body;
        if (!id) {
          return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
        }
        await prisma.attendanceSession.delete({
          where: { id },
        });
        void emitRealtimeEvent("admin-attendance", "attendance_change", { action: "delete-session", id });
        return NextResponse.json({ success: true });
      }

      case "toggle-student-attendance": {
        const { sessionId, userId, status } = body;
        if (!sessionId || !userId) {
          return NextResponse.json({ error: "sessionId and userId are required" }, { status: 400 });
        }

        if (status === "absent") {
          await prisma.attendance.deleteMany({
            where: { sessionId, userId },
          });
        } else {
          await prisma.attendance.upsert({
            where: { sessionId_userId: { sessionId, userId } },
            update: {
              status: "present",
              points: 50,
              markedAt: new Date(),
              method: "manual",
            },
            create: {
              sessionId,
              userId,
              status: "present",
              points: 50,
              markedBy: "admin",
              method: "manual",
            },
          });
        }

        void emitRealtimeEvent("admin-attendance", "attendance_change", { action: "toggle-attendance", sessionId, userId, status });
        void emitRealtimeEvent("admin-points", "points_change", { action: "attendance-points", userId });
        void emitRealtimeEvent("admin-leaderboard", "leaderboard_change", { action: "attendance-points", userId });
        return NextResponse.json({ success: true });
      }

      case "scan-student": {
        const { sessionId, qrContent } = body;
        if (!sessionId || !qrContent) {
          return NextResponse.json({ error: "sessionId and qrContent are required" }, { status: 400 });
        }

        const session = await prisma.attendanceSession.findUnique({
          where: { id: sessionId },
        });

        if (!session) {
          return NextResponse.json({ error: "Attendance session not found" }, { status: 404 });
        }

        let identifier = String(qrContent).trim();
        // Check for JSON
        if (identifier.startsWith("{") && identifier.endsWith("}")) {
          try {
            const parsed = JSON.parse(identifier);
            identifier = parsed.cbUserId || parsed.userId || parsed.id || parsed.email || parsed.registration || parsed.rollNumber || identifier;
          } catch {}
        }
        // Check for URL containing /member/
        if (identifier.includes("/member/")) {
          try {
            const parts = identifier.split("/member/");
            if (parts[1]) {
              const clean = parts[1].split("?")[0].split("#")[0].split("/")[0];
              identifier = decodeURIComponent(clean).trim();
            }
          } catch {}
        }

        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { cbUserId: { equals: identifier, mode: "insensitive" } },
              { id: identifier },
              { email: { equals: identifier, mode: "insensitive" } },
              { username: { equals: identifier, mode: "insensitive" } },
              { registration: { equals: identifier, mode: "insensitive" } },
              { rollNumber: { equals: identifier, mode: "insensitive" } },
            ],
          },
          select: {
            id: true,
            name: true,
            email: true,
            cbUserId: true,
            registration: true,
            rollNumber: true,
            branch: true,
            batchId: true,
            image: true,
            banned: true,
            role: true,
          },
        });

        if (!user) {
          return NextResponse.json({ error: `Member not found for scanned code: "${identifier}"` }, { status: 404 });
        }

        if (user.banned) {
          return NextResponse.json({ error: `Member is banned: ${user.name}` }, { status: 403 });
        }

        // Check batch eligibility if session is targeted
        if (session.targetBatchIds && session.targetBatchIds.length > 0) {
          if (!user.batchId || !session.targetBatchIds.includes(user.batchId)) {
            return NextResponse.json({
              error: `Student ${user.name} does not belong to this session's assigned batch.`,
              batchMismatch: true,
              user: {
                name: user.name,
                email: user.email,
                branch: user.branch,
              },
            }, { status: 403 });
          }
        }

        // Check if already marked
        const existing = await prisma.attendance.findUnique({
          where: { sessionId_userId: { sessionId, userId: user.id } },
        });

        const isAlreadyMarked = existing?.status === "present";

        if (!isAlreadyMarked) {
          await prisma.attendance.upsert({
            where: { sessionId_userId: { sessionId, userId: user.id } },
            update: {
              status: "present",
              points: 50,
              markedAt: new Date(),
              method: "qr-scan",
            },
            create: {
              sessionId,
              userId: user.id,
              status: "present",
              points: 50,
              markedBy: "admin-qr-scanner",
              method: "qr-scan",
            },
          });

          void emitRealtimeEvent("admin-attendance", "attendance_change", { action: "qr-scan", sessionId, userId: user.id });
          void emitRealtimeEvent("admin-points", "points_change", { action: "attendance-points", userId: user.id });
          void emitRealtimeEvent("admin-leaderboard", "leaderboard_change", { action: "attendance-points", userId: user.id });
        }

        return NextResponse.json({
          success: true,
          alreadyMarked: isAlreadyMarked,
          message: isAlreadyMarked
            ? `${user.name} is already marked Present!`
            : `Marked Present: ${user.name}`,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            rollNumber: user.rollNumber,
            registration: user.registration,
            branch: user.branch,
            image: user.image,
            markedAt: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }),
          },
        });
      }

      case "mark-attendance": {
        const { sessionId, userId, status, points, method } = body;
        const att = await prisma.attendance.upsert({
          where: { sessionId_userId: { sessionId, userId } },
          update: {
            status: status || "present",
            points: points || 50,
            method: method || "manual",
          },
          create: {
            sessionId,
            userId,
            status: status || "present",
            points: points || 50,
            markedBy: "admin",
            method: method || "manual",
          },
        });
        void emitRealtimeEvent("admin-attendance", "attendance_change", { action: "mark-attendance", sessionId, userId });
        void emitRealtimeEvent("admin-points", "points_change", { action: "attendance-points", userId });
        void emitRealtimeEvent("admin-leaderboard", "leaderboard_change", { action: "attendance-points", userId });
        return NextResponse.json({ success: true, data: att });
      }

      case "sync-attendance": {
        const records = body.records as Array<{
          id?: string;
          sessionId: string;
          userId: string;
          status: "present" | "absent";
          points?: number;
          markedAt?: string;
          method?: string;
        }>;

        if (!Array.isArray(records) || records.length === 0) {
          return NextResponse.json({ success: true, syncedCount: 0, syncedIds: [] });
        }

        const syncedIds: string[] = [];
        const affectedSessionIds = new Set<string>();
        const affectedUserIds = new Set<string>();

        await Promise.all(
          records.map(async (rec) => {
            if (!rec.sessionId || !rec.userId) return;

            const markedDate = rec.markedAt ? new Date(rec.markedAt) : new Date();

            await prisma.attendance.upsert({
              where: { sessionId_userId: { sessionId: rec.sessionId, userId: rec.userId } },
              update: {
                status: rec.status || "present",
                points: rec.status === "present" ? (rec.points || 50) : 0,
                method: rec.method || "offline-sync",
                markedAt: markedDate,
              },
              create: {
                sessionId: rec.sessionId,
                userId: rec.userId,
                status: rec.status || "present",
                points: rec.status === "present" ? (rec.points || 50) : 0,
                markedBy: "admin-offline-sync",
                method: rec.method || "offline-sync",
                markedAt: markedDate,
              },
            });

            if (rec.id) syncedIds.push(rec.id);
            affectedSessionIds.add(rec.sessionId);
            affectedUserIds.add(rec.userId);
          })
        );

        for (const sId of affectedSessionIds) {
          void emitRealtimeEvent("admin-attendance", "attendance_change", { action: "sync-attendance", sessionId: sId });
        }
        for (const uId of affectedUserIds) {
          void emitRealtimeEvent("admin-points", "points_change", { action: "attendance-points", userId: uId });
          void emitRealtimeEvent("admin-leaderboard", "leaderboard_change", { action: "attendance-points", userId: uId });
        }

        return NextResponse.json({
          success: true,
          syncedCount: syncedIds.length,
          syncedIds,
          sessionIds: Array.from(affectedSessionIds),
        });
      }

      // 4. Quizzes CRUD
      case "add-quiz": {
        const { title, description, duration } = body;
        const quiz = await prisma.quiz.create({
          data: {
            quizId: `QUIZ-${Date.now().toString(36).toUpperCase()}`,
            title,
            description: description || "Coding & Assessment Challenge",
            duration: parseInt(duration) || 30,
            questionsJson: "[]",
            createdBy: "admin",
          },
        });
        void emitRealtimeEvent("admin-quizzes", "quiz_change", { action: "add-quiz", id: quiz.id });
        return NextResponse.json({ success: true, data: quiz });
      }

      case "delete-quiz": {
        const { id } = body;
        await prisma.quiz.delete({ where: { id } });
        void emitRealtimeEvent("admin-quizzes", "quiz_change", { action: "delete-quiz", id });
        return NextResponse.json({ success: true });
      }

      // 5. Tasks CRUD
      case "add-task": {
        const { title, description, dueDate, points } = body;
        const count = await prisma.task.count();
        const task = await prisma.task.create({
          data: {
            taskNumber: count + 1,
            title,
            description: description || "",
            startDate: new Date(),
            dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 7 * 86400000),
            points: parseInt(points) || 100,
            createdBy: "admin",
          },
        });
        void emitRealtimeEvent("admin-tasks", "task_change", { action: "add-task", id: task.id });
        return NextResponse.json({ success: true, data: task });
      }

      case "delete-task": {
        const { id } = body;
        await prisma.task.delete({ where: { id } });
        void emitRealtimeEvent("admin-tasks", "task_change", { action: "delete-task", id });
        return NextResponse.json({ success: true });
      }

      // 6. Events CRUD
      case "add-event": {
        const { title, description, eventDate, points } = body;
        const count = await prisma.eventPoint.count();
        const event = await prisma.eventPoint.create({
          data: {
            eventNumber: count + 1,
            title,
            description: description || "",
            eventDate: eventDate ? new Date(eventDate) : new Date(Date.now() + 3 * 86400000),
            points: parseInt(points) || 50,
            createdBy: "admin",
          },
        });
        void emitRealtimeEvent("admin-events", "event_change", { action: "add-event", id: event.id });
        return NextResponse.json({ success: true, data: event });
      }

      case "delete-event": {
        const { id } = body;
        await prisma.eventPoint.delete({ where: { id } });
        void emitRealtimeEvent("admin-events", "event_change", { action: "delete-event", id });
        return NextResponse.json({ success: true });
      }

      // 7. Forms Management
      case "add-form": {
        const { title, description } = body;
        const form = await prisma.form.create({
          data: {
            id: `frm_${Date.now()}`,
            formId: `FORM-${Date.now().toString(36).toUpperCase()}`,
            title,
            description: description || "",
            definition: {},
            isPublished: true,
            acceptingResponses: true,
          },
        });
        void emitRealtimeEvent("admin-forms", "form_change", { action: "add-form", id: form.id });
        return NextResponse.json({ success: true, data: form });
      }

      case "toggle-form-publish": {
        const { id, isPublished } = body;
        if (!id) {
          return NextResponse.json({ error: "Form ID is required" }, { status: 400 });
        }
        const updated = await prisma.form.update({
          where: { id },
          data: {
            isPublished: Boolean(isPublished),
            publishedAt: isPublished ? new Date() : undefined,
          },
        });
        void emitRealtimeEvent("admin-forms", "form_change", { action: "toggle-publish", id: updated.id });
        return NextResponse.json({ success: true, data: updated });
      }

      case "toggle-form-accepting": {
        const { id, acceptingResponses } = body;
        if (!id) {
          return NextResponse.json({ error: "Form ID is required" }, { status: 400 });
        }
        const updated = await prisma.form.update({
          where: { id },
          data: {
            acceptingResponses: Boolean(acceptingResponses),
          },
        });
        void emitRealtimeEvent("admin-forms", "form_change", { action: "toggle-accepting", id: updated.id });
        return NextResponse.json({ success: true, data: updated });
      }

      case "delete-form": {
        const { id } = body;
        if (!id) {
          return NextResponse.json({ error: "Form ID is required" }, { status: 400 });
        }
        // Also cleanup files & cascade
        await prisma.form.delete({ where: { id } });
        void emitRealtimeEvent("admin-forms", "form_change", { action: "delete-form", id });
        return NextResponse.json({ success: true });
      }

      case "update-form-response-status": {
        const { responseId, paymentStatus } = body; // "verified" | "rejected" | "pending"
        if (!responseId || !paymentStatus) {
          return NextResponse.json({ error: "responseId and paymentStatus are required" }, { status: 400 });
        }

        const updated = await prisma.formResponse.update({
          where: { id: responseId },
          data: {
            paymentStatus,
            verifiedAt: paymentStatus === "verified" ? new Date() : null,
          },
        });

        // If verified and has transaction ID, send invoice email
        if (paymentStatus === "verified") {
          try {
            const responseDetail = await prisma.formResponse.findUnique({
              where: { id: responseId },
              include: {
                form: {
                  select: {
                    title: true,
                    definition: true,
                  },
                },
              },
            });

            if (responseDetail && responseDetail.transactionId && responseDetail.transactionId.trim()) {
              const answersObj = (responseDetail.answers || {}) as Record<string, unknown>;
              let recipientEmail = "";
              let recipientName = "";
              let collegeName = "";

              for (const [k, v] of Object.entries(answersObj)) {
                if (typeof v === "string") {
                  const valStr = v.trim();
                  const keyLower = k.toLowerCase();
                  if (!recipientEmail && (keyLower.includes("email") || (valStr.includes("@") && valStr.includes(".")))) {
                    recipientEmail = valStr;
                  }
                  if (!recipientName && keyLower.includes("name") && valStr) {
                    recipientName = valStr;
                  }
                  if (!collegeName && (keyLower.includes("college") || keyLower.includes("school") || keyLower.includes("organization")) && valStr) {
                    collegeName = valStr;
                  }
                }
              }

              const { sendFormResponseInvoiceEmail } = await import("@/lib/mailer");
              const refNo = `CB-INV-${responseDetail.id.slice(0, 8).toUpperCase()}`;
              void sendFormResponseInvoiceEmail({
                to: recipientEmail,
                recipientName: recipientName || "Participant",
                formTitle: responseDetail.form.title || "Form",
                referenceNumber: refNo,
                issuedDate: new Date().toLocaleDateString("en-US"),
                transactionId: responseDetail.transactionId.trim(),
                paymentAmount: 0,
                collegeName: collegeName || undefined,
              }).catch((err) => console.error("Error sending invoice email on approval:", err));
            }
          } catch (mailErr) {
            console.warn("Mail sending error:", mailErr);
          }
        }

        void emitRealtimeEvent("admin-forms", "form_response_change", { action: "update-status", responseId, paymentStatus });
        return NextResponse.json({ success: true, data: updated });
      }

      case "delete-form-response": {
        const { responseId } = body;
        if (!responseId) {
          return NextResponse.json({ error: "responseId is required" }, { status: 400 });
        }

        await prisma.formResponse.delete({
          where: { id: responseId },
        });

        void emitRealtimeEvent("admin-forms", "form_response_change", { action: "delete-response", responseId });
        return NextResponse.json({ success: true });
      }

      // 8. Award Points
      case "award-points": {
        const { userId, points } = body;
        const firstSession = await prisma.attendanceSession.findFirst();
        if (firstSession && userId) {
          await prisma.attendance.create({
            data: {
              sessionId: firstSession.id,
              userId,
              status: "present",
              points: parseInt(points) || 50,
              markedBy: "admin",
            },
          });
        }
        void emitRealtimeEvent("admin-points", "points_change", { action: "award-points", userId, points });
        void emitRealtimeEvent("admin-leaderboard", "leaderboard_change", { action: "award-points", userId });
        return NextResponse.json({ success: true });
      }

      // 9. Admin Profile & Settings Management
      case "update-admin-profile": {
        const {
          userId,
          name,
          username,
          firstName,
          middleName,
          lastName,
          email,
          mobileNumber,
          whatsappNumber,
          admissionYear,
          registration,
          rollNumber,
          branch,
          collegeName,
          collegeAddress,
          address,
          postOffice,
          policeStation,
          block,
          pinCode,
          state,
          district,
        } = body;

        let targetId = userId;
        if (!targetId) {
          const firstAdmin = await prisma.user.findFirst({
            where: { role: { in: ["ADMIN", "admin", "SUPER_ADMIN", "superadmin"] } },
          });
          targetId = firstAdmin?.id;
        }

        if (!targetId) {
          return NextResponse.json({ error: "User ID is required" }, { status: 400 });
        }

        const updated = await prisma.user.update({
          where: { id: targetId },
          data: {
            name: name !== undefined ? name : undefined,
            username: username !== undefined ? username : undefined,
            firstName: firstName !== undefined ? firstName : undefined,
            middleName: middleName !== undefined ? middleName : undefined,
            lastName: lastName !== undefined ? lastName : undefined,
            email: email !== undefined ? email : undefined,
            mobileNumber: mobileNumber !== undefined ? mobileNumber : undefined,
            whatsappNumber: whatsappNumber !== undefined ? whatsappNumber : undefined,
            admissionYear: admissionYear !== undefined ? admissionYear : undefined,
            registration: registration !== undefined ? registration : undefined,
            rollNumber: rollNumber !== undefined ? rollNumber : undefined,
            branch: branch !== undefined ? branch : undefined,
            collegeName: collegeName !== undefined ? collegeName : undefined,
            collegeAddress: collegeAddress !== undefined ? collegeAddress : undefined,
            address: address !== undefined ? address : undefined,
            postOffice: postOffice !== undefined ? postOffice : undefined,
            policeStation: policeStation !== undefined ? policeStation : undefined,
            block: block !== undefined ? block : undefined,
            pinCode: pinCode !== undefined ? pinCode : undefined,
            state: state !== undefined ? state : undefined,
            district: district !== undefined ? district : undefined,
            profileComplete: true,
            updatedAt: new Date(),
          },
        });

        void emitRealtimeEvent("admin-members", "member_change", {
          action: "update-profile",
          userId: updated.id,
          name: updated.name,
          email: updated.email,
        });
        void emitRealtimeEvent("admin-settings", "settings_change", {
          action: "update-profile",
          userId: updated.id,
        });

        return NextResponse.json({ success: true, data: updated });
      }

      case "update-profile-image": {
        const { userId, image, profileImageKey } = body;
        let targetId = userId;
        if (!targetId) {
          const firstAdmin = await prisma.user.findFirst({
            where: { role: { in: ["ADMIN", "admin", "SUPER_ADMIN", "superadmin"] } },
          });
          targetId = firstAdmin?.id;
        }

        if (!targetId) {
          return NextResponse.json({ error: "User ID is required" }, { status: 400 });
        }

        const updated = await prisma.user.update({
          where: { id: targetId },
          data: {
            image: image !== undefined ? image : undefined,
            profileImageKey: profileImageKey !== undefined ? profileImageKey : undefined,
            updatedAt: new Date(),
          },
        });

        void emitRealtimeEvent("admin-members", "member_change", {
          action: "update-avatar",
          userId: updated.id,
          image: updated.image,
          profileImageKey: updated.profileImageKey,
        });
        void emitRealtimeEvent("admin-settings", "settings_change", {
          action: "update-avatar",
          userId: updated.id,
          image: updated.image,
          profileImageKey: updated.profileImageKey,
        });

        return NextResponse.json({
          success: true,
          data: {
            id: updated.id,
            image: updated.image,
            profileImageKey: updated.profileImageKey,
          },
        });
      }

      case "remove-profile-image": {
        const { userId } = body;
        let targetId = userId;
        if (!targetId) {
          const firstAdmin = await prisma.user.findFirst({
            where: { role: { in: ["ADMIN", "admin", "SUPER_ADMIN", "superadmin"] } },
          });
          targetId = firstAdmin?.id;
        }

        if (!targetId) {
          return NextResponse.json({ error: "User ID is required" }, { status: 400 });
        }

        const updated = await prisma.user.update({
          where: { id: targetId },
          data: {
            image: null,
            profileImageKey: null,
            updatedAt: new Date(),
          },
        });

        void emitRealtimeEvent("admin-members", "member_change", {
          action: "update-avatar",
          userId: updated.id,
          image: null,
          profileImageKey: null,
        });
        void emitRealtimeEvent("admin-settings", "settings_change", {
          action: "update-avatar",
          userId: updated.id,
          image: null,
          profileImageKey: null,
        });

        return NextResponse.json({ success: true, data: updated });
      }

      case "update-admin-social-links": {
        const { userId, socialLinks, customLinks } = body;
        let targetId = userId;
        if (!targetId) {
          const firstAdmin = await prisma.user.findFirst({
            where: { role: { in: ["ADMIN", "admin", "SUPER_ADMIN", "superadmin"] } },
          });
          targetId = firstAdmin?.id;
        }

        if (!targetId) {
          return NextResponse.json({ error: "User ID is required" }, { status: 400 });
        }

        const updated = await prisma.user.update({
          where: { id: targetId },
          data: {
            socialLinks: socialLinks !== undefined ? socialLinks : undefined,
            customLinks: customLinks !== undefined ? customLinks : undefined,
            updatedAt: new Date(),
          },
        });

        void emitRealtimeEvent("admin-settings", "settings_change", {
          action: "update-social-links",
          userId: updated.id,
        });

        return NextResponse.json({ success: true, data: updated });
      }

      case "update-system-setting": {
        const { key, value } = body;
        if (!key || value === undefined) {
          return NextResponse.json({ error: "key and value are required" }, { status: 400 });
        }

        const setting = await prisma.systemSettings.upsert({
          where: { key },
          update: {
            value: String(value),
            updatedAt: new Date(),
          },
          create: {
            key,
            value: String(value),
          },
        });

        void emitRealtimeEvent("admin-settings", "settings_change", {
          action: "update-system-setting",
          key,
          value: String(value),
        });

        return NextResponse.json({ success: true, data: setting });
      }

      case "revoke-admin-session": {
        const { sessionId } = body;
        if (!sessionId) {
          return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
        }

        try {
          await prisma.session.delete({
            where: { id: sessionId },
          });
        } catch {
          // In case session is already deleted
        }

        void emitRealtimeEvent("admin-settings", "settings_change", {
          action: "revoke-session",
          sessionId,
        });

        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Internal database error";
    console.error("Admin mobile API POST error:", error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
