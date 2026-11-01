import type { RoadmapData } from "../../types";

export const fullStackDevelopmentRoadmap: RoadmapData = {
  id: "full-stack-development",
  slug: "full-stack-development",
  title: "Full Stack Development",
  description: "Complete, all-in-one guide to Full Stack Software Engineering. Master End-to-End TypeScript, React 19, Next.js 15 App Router, Server Actions, PostgreSQL & Prisma ORM, Redis Caching, Better Auth, S3 File Uploads, Docker Containers, and CI/CD Cloud Deployments without needing external materials.",
  category: "web-dev",
  badgeText: "Comprehensive",
  iconName: "Layers",
  version: 2,
  isPublished: true,
  nodes: [
    {
      id: "title-node",
      type: "title",
      position: { x: 550, y: 30 },
      data: { label: "Full Stack Developer Roadmap" },
    },
    // 1. Fundamentals & Version Control
    {
      id: "fs-fundamentals",
      type: "topic",
      position: { x: 550, y: 120 },
      data: {
        label: "Foundations & Version Control",
        category: "Foundations",
        description: `### 🌐 Full Stack Architecture, Git & Developer Tooling

The bedrock of professional fullstack engineering: Unix terminal commands, Git branching, and HTTP architecture.
`,
        difficulty: "beginner",
        colorKey: "B",
        estimatedHours: 8,
      },
    },
    {
      id: "sub-git-collaboration",
      type: "subtopic",
      position: { x: 860, y: 100 },
      data: {
        label: "Git & GitHub Collaboration Workflows",
        colorKey: "C",
        description: `### 🌿 Professional Git Branching & Rebase Workflows

Trunk-based development and interactive rebase tricks.

\`\`\`bash
# 1. Clean interactive rebase to squash last 3 commits before PR
git rebase -i HEAD~3

# 2. Sync local branch cleanly with upstream main without messy merge commits
git fetch origin
git rebase origin/main

# 3. Undo a bad commit while keeping staged file changes
git reset --soft HEAD~1
\`\`\`
`,
      },
    },
    {
      id: "sub-http-rest-standards",
      type: "subtopic",
      position: { x: 860, y: 150 },
      data: {
        label: "HTTP/HTTPS & REST Contract Standards",
        colorKey: "C",
        description: `### 📋 Standard Fullstack JSON Error Schema

Enforce uniform API responses across client and server.

\`\`\`typescript
export interface ApiResponse<T> {
  status: "success" | "error";
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}
\`\`\`
`,
      },
    },

    // 2. Modern Frontend UI & TypeScript
    {
      id: "fs-frontend",
      type: "topic",
      position: { x: 550, y: 320 },
      data: {
        label: "Frontend UI, TypeScript & React 19",
        category: "Frontend",
        description: `### ⚛️ Reactive Frontends & End-to-End TypeScript Contracts

Build UI components that share type schemas directly with backend validation layers.
`,
        difficulty: "intermediate",
        colorKey: "B",
        estimatedHours: 25,
      },
    },
    {
      id: "sub-react19-ts",
      type: "subtopic",
      position: { x: 240, y: 280 },
      data: {
        label: "React 19 & End-to-End TypeScript",
        colorKey: "C",
        description: `### 🔗 Shared Zod Schemas Between Client & Server

Validate forms on the client and verify data on the server with one single schema.

\`\`\`typescript
import { z } from "zod";

export const CreateUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  rollNumber: z.string().regex(/^[0-9]{2}[A-Z]{2}[0-9]{4}$/, "Invalid college roll number"),
});

export type CreateUserInput = z.infer<typeof CreateUserSchema>;
\`\`\`
`,
      },
    },
    {
      id: "sub-tailwind-shadcn",
      type: "subtopic",
      position: { x: 240, y: 330 },
      data: {
        label: "Tailwind CSS & Shadcn Component Systems",
        colorKey: "C",
        description: `### 🎨 Radix UI Primitives & Tailwind Tokens

Build accessible dialogs, dropdowns, and data tables with Tailwind tokens and dark mode.
`,
      },
    },

    // 3. Fullstack Meta-Frameworks (Next.js)
    {
      id: "fs-metaframeworks",
      type: "topic",
      position: { x: 550, y: 520 },
      data: {
        label: "Next.js 15 Fullstack Architecture",
        category: "Fullstack",
        description: `### ⚡ App Router, Server Components & Server Actions

Unify client rendering and backend execution in a seamless fullstack meta-framework.
`,
        difficulty: "intermediate",
        colorKey: "B",
        estimatedHours: 20,
      },
    },
    {
      id: "sub-rsc-server-actions",
      type: "subtopic",
      position: { x: 860, y: 480 },
      data: {
        label: "Server Components & Server Actions",
        colorKey: "C",
        description: `### ⚡ Server Actions with Revalidation

Mutate backend database records and trigger instant UI re-renders with \`revalidatePath\`.

\`\`\`typescript
"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function submitTaskSolution(taskId: string, userId: string, projectUrl: string) {
  await prisma.taskSubmission.upsert({
    where: { taskId_userId: { taskId, userId } },
    update: { projectUrl, status: "submitted", submittedAt: new Date() },
    create: { taskId, userId, projectUrl, status: "submitted" },
  });

  revalidatePath("/dashboard/tasks");
  return { status: "success" };
}
\`\`\`
`,
      },
    },
    {
      id: "sub-middleware-auth-routing",
      type: "subtopic",
      position: { x: 860, y: 530 },
      data: {
        label: "Edge Middleware & Route Protection",
        colorKey: "C",
        description: `### 🛡️ Edge Route Guards

Redirect unauthenticated users before page assets even begin downloading.

\`\`\`typescript
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const sessionToken = request.cookies.get("auth_session")?.value;
  const isDashboard = request.nextUrl.pathname.startsWith("/dashboard");

  if (isDashboard && !sessionToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}
\`\`\`
`,
      },
    },

    // 4. Backend Systems & Database Modeling
    {
      id: "fs-backend-db",
      type: "topic",
      position: { x: 550, y: 720 },
      data: {
        label: "Databases, ORMs & Schema Migrations",
        category: "Databases",
        description: `### 🗄️ PostgreSQL, Prisma ORM & Redis Session Cache

Model robust relational schemas with type safety, foreign keys, and indexes.
`,
        difficulty: "intermediate",
        colorKey: "B",
        estimatedHours: 20,
      },
    },
    {
      id: "sub-prisma-postgres",
      type: "subtopic",
      position: { x: 240, y: 680 },
      data: {
        label: "PostgreSQL Modeling & Prisma / Drizzle ORM",
        colorKey: "C",
        description: `### 🐘 Prisma Schema & Migration Workflows

Execute type-safe queries and zero-downtime migrations.

\`\`\`bash
# Create migration and apply to database
npx prisma migrate dev --name add_roadmap_progress

# Generate updated TypeScript types
npx prisma generate
\`\`\`
`,
      },
    },
    {
      id: "sub-redis-session-cache",
      type: "subtopic",
      position: { x: 240, y: 730 },
      data: {
        label: "Redis Caching & Session Storage",
        colorKey: "C",
        description: `### ⚡ Redis Pub/Sub & High-Speed In-Memory Cache

Reduce relational database queries by 80%+ through high-speed cache layers.
`,
      },
    },

    // 5. Authentication & Authorisation
    {
      id: "fs-auth-security",
      type: "topic",
      position: { x: 550, y: 920 },
      data: {
        label: "Authentication, OAuth 2.0 & Role Permissions",
        category: "Security",
        description: `### 🔐 Better Auth / NextAuth, Social Logins, RBAC & Multi-Tenancy

Implement secure user authentication and role-based permissions.
`,
        difficulty: "intermediate",
        colorKey: "B",
        estimatedHours: 15,
      },
    },
    {
      id: "sub-social-oauth-betterauth",
      type: "subtopic",
      position: { x: 860, y: 880 },
      data: {
        label: "Social OAuth (Google/GitHub) & Email Magic Links",
        colorKey: "C",
        description: `### 🔑 Better Auth Integration

Handle multi-session management, two-factor authentication (2FA), and password resets.
`,
      },
    },
    {
      id: "sub-rbac-multitenancy",
      type: "subtopic",
      position: { x: 860, y: 930 },
      data: {
        label: "Role-Based Access Control (RBAC) & Multi-Tenancy",
        colorKey: "C",
        description: `### 👥 Enterprise Role Guard Implementation

\`\`\`typescript
export type UserRole = "super_admin" | "admin" | "faculty" | "member";

export function isSystemAdminRole(role?: string | null): boolean {
  return role === "super_admin" || role === "admin";
}
\`\`\`
`,
      },
    },

    // 6. File Storage, Background Jobs & Real-Time
    {
      id: "fs-storage-realtime",
      type: "topic",
      position: { x: 550, y: 1120 },
      data: {
        label: "Cloud Storage, Queues & Real-Time Sockets",
        category: "Services",
        description: `### ☁️ AWS S3 Pre-signed Uploads, BullMQ & Socket.io

Handle massive file uploads directly from browsers, job queues, and real-time live events.
`,
        difficulty: "advanced",
        colorKey: "B",
        estimatedHours: 18,
      },
    },
    {
      id: "sub-s3-presigned",
      type: "subtopic",
      position: { x: 240, y: 1080 },
      data: {
        label: "AWS S3 Pre-signed Direct Uploads",
        colorKey: "C",
        description: `### 📤 S3 Direct Upload Flow

Generate secure pre-signed PUT URLs so clients upload files directly to S3 buckets without loading backend web servers!

\`\`\`typescript
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client } from "@/lib/s3";

export async function getPresignedUploadUrl(fileName: string, contentType: string) {
  const fileKey = \`uploads/\${Date.now()}-\${fileName}\`;
  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET_NAME!,
    Key: fileKey,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });
  return { uploadUrl, fileKey };
}
\`\`\`
`,
      },
    },
    {
      id: "sub-realtime-websockets",
      type: "subtopic",
      position: { x: 240, y: 1130 },
      data: {
        label: "WebSockets, Server-Sent Events (SSE) & Socket.io",
        colorKey: "C",
        description: `### 🔴 Real-Time Streaming & Live Leaderboard Sync

Push live quiz answers, chat messages, and leaderboard point updates instantly.
`,
      },
    },

    // 7. DevOps, CI/CD, Containerization & Cloud
    {
      id: "fs-devops-cloud",
      type: "topic",
      position: { x: 550, y: 1320 },
      data: {
        label: "Docker, CI/CD, Vercel & AWS Cloud",
        category: "DevOps",
        description: `### 🐳 Production Docker Multi-Stage Builds & Automated CI/CD

Package fullstack applications into production-ready containers and deploy to global clouds.
`,
        difficulty: "advanced",
        colorKey: "B",
        estimatedHours: 16,
      },
    },
    {
      id: "sub-docker-multistage",
      type: "subtopic",
      position: { x: 860, y: 1280 },
      data: {
        label: "Docker Multi-Stage Builds & Compose",
        colorKey: "C",
        description: `### 📦 Production-Ready Next.js Dockerfile

\`\`\`dockerfile
# 1. Install dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json prisma ./
RUN npm ci

# 2. Build Next.js application
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# 3. Production runner image (<120MB)
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
USER node
EXPOSE 3000
CMD ["node", "server.js"]
\`\`\`
`,
      },
    },
    {
      id: "sub-cicd-cloud-deploy",
      type: "subtopic",
      position: { x: 860, y: 1330 },
      data: {
        label: "GitHub Actions CI/CD & Cloud Deployments",
        colorKey: "C",
        description: `### 🚀 Automated Deployment Pipelines

Run typecheck, linting, tests, database migrations, and deploy automatically on git merge.
`,
      },
    },

    // 8. Milestone
    {
      id: "milestone-fullstack-lead",
      type: "milestone",
      position: { x: 550, y: 1520 },
      data: {
        label: "Certified Full Stack Lead Engineer",
        category: "Milestone",
        description: `### 🎓 Full Stack Mastery Attained!

Congratulations! You are now equipped to build and scale complete software products from scratch:
- Sleek, responsive Frontends (React 19, TypeScript, Tailwind).
- Robust Fullstack Architectures (Next.js 15, Server Components, Server Actions).
- Scalable Databases & Caching (PostgreSQL, Prisma, Redis).
- Secure Auth, S3 Media Storage, Real-time WebSockets.
- Automated CI/CD, Docker containers, and Cloud deployment.
`,
        difficulty: "advanced",
        color: "gold",
        status: "not-started",
      },
    },
  ],
  edges: [
    { id: "e-fs-1", source: "fs-fundamentals", target: "fs-frontend", type: "interactive" },
    { id: "e-fs-2", source: "fs-frontend", target: "fs-metaframeworks", type: "interactive" },
    { id: "e-fs-3", source: "fs-metaframeworks", target: "fs-backend-db", type: "interactive" },
    { id: "e-fs-4", source: "fs-backend-db", target: "fs-auth-security", type: "interactive" },
    { id: "e-fs-5", source: "fs-auth-security", target: "fs-storage-realtime", type: "interactive" },
    { id: "e-fs-6", source: "fs-storage-realtime", target: "fs-devops-cloud", type: "interactive" },
    { id: "e-fs-7", source: "fs-devops-cloud", target: "milestone-fullstack-lead", type: "interactive" },

    // Subtopics
    { id: "e-fs-sub-1", source: "fs-fundamentals", target: "sub-git-collaboration" },
    { id: "e-fs-sub-2", source: "fs-fundamentals", target: "sub-http-rest-standards" },

    { id: "e-fs-sub-3", source: "fs-frontend", target: "sub-react19-ts" },
    { id: "e-fs-sub-4", source: "fs-frontend", target: "sub-tailwind-shadcn" },

    { id: "e-fs-sub-5", source: "fs-metaframeworks", target: "sub-rsc-server-actions" },
    { id: "e-fs-sub-6", source: "fs-metaframeworks", target: "sub-middleware-auth-routing" },

    { id: "e-fs-sub-7", source: "fs-backend-db", target: "sub-prisma-postgres" },
    { id: "e-fs-sub-8", source: "fs-backend-db", target: "sub-redis-session-cache" },

    { id: "e-fs-sub-9", source: "fs-auth-security", target: "sub-social-oauth-betterauth" },
    { id: "e-fs-sub-10", source: "fs-auth-security", target: "sub-rbac-multitenancy" },

    { id: "e-fs-sub-11", source: "fs-storage-realtime", target: "sub-s3-presigned" },
    { id: "e-fs-sub-12", source: "fs-storage-realtime", target: "sub-realtime-websockets" },

    { id: "e-fs-sub-13", source: "fs-devops-cloud", target: "sub-docker-multistage" },
    { id: "e-fs-sub-14", source: "fs-devops-cloud", target: "sub-cicd-cloud-deploy" },
  ],
};
