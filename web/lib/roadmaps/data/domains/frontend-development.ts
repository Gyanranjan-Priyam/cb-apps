import type { RoadmapData } from "../../types";

export const frontendDevelopmentRoadmap: RoadmapData = {
  id: "frontend-development",
  slug: "frontend-development",
  title: "Frontend Development",
  description: "Comprehensive, all-in-one guide to Modern Frontend Engineering. Complete with in-depth lessons on HTML5 a11y, Modern CSS3/Grid/Container Queries, JavaScript Async Engines, TypeScript Generics, React 19, Next.js 15, State Machines, Web Performance, and E2E Testing with Playwright.",
  category: "web-dev",
  badgeText: "Most Popular",
  iconName: "Layout",
  version: 2,
  isPublished: true,
  nodes: [
    {
      id: "title-node",
      type: "title",
      position: { x: 550, y: 30 },
      data: { label: "Frontend Developer Roadmap" },
    },
    // 1. Web & Internet
    {
      id: "internet-basics",
      type: "topic",
      position: { x: 550, y: 120 },
      data: {
        label: "Internet Fundamentals",
        category: "Fundamentals",
        description: `### 🌐 Internet Architecture for Frontend Engineers

Understanding how assets are delivered across networks allows you to optimize Time-to-First-Byte (TTFB) and render performance.

---

### 1. HTTP Request-Response Lifecycle
- **DNS Lookup**: Converts domain to IP address ($<50\\text{ms}$ with Anycast).
- **TLS 1.3 Handshake**: Encrypts connection in 1 Round Trip Time (RTT).
- **HTTP Request Headers**:
  - \`Accept: text/html, application/json\`
  - \`User-Agent\`: Identifies browser engine for polyfills.
  - \`Authorization: Bearer <token>\`
  - \`Cache-Control: public, max-age=31536000, immutable\`
- **CORS (Cross-Origin Resource Sharing)**: Browser security mechanism blocking cross-origin AJAX requests unless the server sends \`Access-Control-Allow-Origin: *\` or your specific origin.
`,
        difficulty: "beginner",
        colorKey: "B",
        estimatedHours: 4,
        resources: [
          { id: "fe-1", title: "MDN: How the Web Works", url: "https://developer.mozilla.org/en-US/docs/Learn/Common_questions/Web_mechanics/How_does_the_Internet_work", type: "docs", isOfficial: true },
        ],
      },
    },
    {
      id: "sub-http-dns",
      type: "subtopic",
      position: { x: 860, y: 100 },
      data: {
        label: "HTTP/HTTPS & SSL/TLS",
        colorKey: "C",
        description: `### 🔒 HTTP Headers, CORS & Security Policies

Master the HTTP mechanics that protect client-side web applications.

---

### 1. Understanding CORS Preflight Requests
When a frontend makes a request with custom headers (e.g. \`Authorization\`) or methods other than simple GET/POST:
1. The browser automatically sends an **OPTIONS** preflight request.
2. The server responds with allowed headers, methods, and origins.
3. If valid, the actual request is sent.

\`\`\`http
OPTIONS /api/v1/profile HTTP/1.1
Host: api.example.com
Origin: https://myapp.com
Access-Control-Request-Method: POST
Access-Control-Request-Headers: authorization, content-type
\`\`\`

---

### 2. Essential Security Headers
- **Content-Security-Policy (CSP)**: Blocks XSS attacks by restricting where scripts, styles, and images can be loaded from.
- **X-Frame-Options: DENY**: Prevents Clickjacking by disallowing your site inside \`<iframe>\`.
- **Strict-Transport-Security (HSTS)**: Forces browser to always use HTTPS.
`,
      },
    },
    {
      id: "sub-browsers-cdn",
      type: "subtopic",
      position: { x: 860, y: 150 },
      data: {
        label: "Browsers, DNS & Edge CDNs",
        colorKey: "C",
        description: `### ⚡ CDNs, Edge Caching & Cache-Control Headers

Serve static assets (JS, CSS, images) with $<20\\text{ms}$ global latency.

---

### 1. The Ideal Cache-Control Strategy
For hashed static build bundles (e.g. \`main.7b3f91a.js\`):
\`\`\`http
Cache-Control: public, max-age=31536000, immutable
\`\`\`
- Browser caches file for 1 full year without ever querying the origin server again!

For \`index.html\` (which references the latest bundle hashes):
\`\`\`http
Cache-Control: no-cache
\`\`\`
- Browser checks with server using \`ETag\` / \`If-None-Match\` (\`304 Not Modified\`).

---

### 2. Edge CDN Capabilities
- Cloudflare, Vercel Edge Network, and Fastly execute lightweight JavaScript (V8 isolates) in $<5\\text{ms}$ cold starts.
- Allows geo-routing, A/B testing header manipulation, and instant bot protection directly at the network edge.
`,
      },
    },

    // 2. HTML & CSS Mastery
    {
      id: "html-css-mastery",
      type: "topic",
      position: { x: 550, y: 320 },
      data: {
        label: "HTML5 & Advanced CSS",
        category: "Fundamentals",
        description: `### 🎨 Semantic HTML5 & Modern CSS3 Architecture

Craft accessible markup and robust styling systems that scale across thousands of components.
`,
        difficulty: "beginner",
        colorKey: "B",
        estimatedHours: 12,
      },
    },
    {
      id: "sub-semantic-a11y",
      type: "subtopic",
      position: { x: 240, y: 280 },
      data: {
        label: "Semantic HTML & Accessibility (a11y)",
        colorKey: "C",
        description: `### ♿ Accessible Component Patterns (WAI-ARIA)

Build accessible dialogs, tabs, and menus that pass WCAG 2.2 AA audits.

---

### 1. Accessible Modal Dialog with \`<dialog>\`
Modern HTML includes native accessible modal dialogs with built-in backdrop styling and focus trapping!

\`\`\`html
<!-- Native HTML5 Dialog -->
<button id="open-btn">Open Profile</button>

<dialog id="profile-dialog" aria-labelledby="dialog-title">
  <form method="dialog">
    <h2 id="dialog-title">Edit Profile</h2>
    <p>Update your public account information.</p>
    
    <label for="name">Full Name</label>
    <input type="text" id="name" required />
    
    <div class="actions">
      <button value="cancel">Cancel</button>
      <button value="save" class="btn-primary">Save Changes</button>
    </div>
  </form>
</dialog>

<script>
  const dialog = document.getElementById('profile-dialog');
  document.getElementById('open-btn').addEventListener('click', () => dialog.showModal());
</script>
\`\`\`
`,
      },
    },
    {
      id: "sub-flexbox-grid-fe",
      type: "subtopic",
      position: { x: 240, y: 330 },
      data: {
        label: "Flexbox & CSS Grid Systems",
        colorKey: "C",
        description: `### 📐 Deep Dive: CSS Grid Subgrid & Auto-Placement

Align nested child elements across parent grid tracks.

---

### 1. CSS Subgrid in Action
\`\`\`css
.parent-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
}

.card {
  /* Span 1 column and create a 3-row subgrid */
  display: grid;
  grid-template-rows: subgrid;
  grid-row: span 3;
}

/* Header, Content, and Footer across ALL cards will align perfectly regardless of varying text lengths! */
.card-header { grid-row: 1; }
.card-body   { grid-row: 2; }
.card-footer { grid-row: 3; }
\`\`\`
`,
      },
    },
    {
      id: "sub-responsive-fluid",
      type: "subtopic",
      position: { x: 240, y: 380 },
      data: {
        label: "Responsive & Fluid Design (Clamp)",
        colorKey: "C",
        description: `### 📱 Fluid Responsive Calculations with CSS Math

Mathematical formulas for perfect fluid typography and spacing scales.

---

### 1. Linear Interpolation Formula in CSS
$$\\text{size} = \\text{clamp}(y_{\\min}, y_{\\min} + (y_{\\max} - y_{\\min}) \\cdot \\frac{\\text{vw} - x_{\\min}}{x_{\\max} - x_{\\min}}, y_{\\max})$$

\`\`\`css
/* Scales smoothly from 16px (at 375px viewport) up to 24px (at 1280px viewport) */
p {
  font-size: clamp(1rem, 0.83rem + 0.88vw, 1.5rem);
}

/* Fluid section padding */
section {
  padding-block: clamp(2rem, 1rem + 5vw, 6rem);
}
\`\`\`
`,
      },
    },

    // 3. JavaScript & TypeScript
    {
      id: "js-ts-engine",
      type: "topic",
      position: { x: 550, y: 520 },
      data: {
        label: "JavaScript Deep Dive & TypeScript",
        category: "Programming",
        description: `### 💻 V8 Engine Internals, Prototypes & Strict TypeScript

Understand memory management, garbage collection cycles, and advanced generic constraints.
`,
        difficulty: "intermediate",
        colorKey: "B",
        estimatedHours: 22,
      },
    },
    {
      id: "sub-event-loop-dom",
      type: "subtopic",
      position: { x: 860, y: 480 },
      data: {
        label: "Event Loop, Closures & DOM API",
        colorKey: "C",
        description: `### 🧠 Memory Leaks & Event Delegation in JavaScript

Avoid common memory pitfalls in long-running single-page applications.

---

### 1. Common Memory Leak Scenarios
1. **Dangling Event Listeners**: Adding event listeners on window/document without removing them during component unmounting.
2. **Uncleared \`setInterval\`**: Retaining references to closed scopes.
3. **Detached DOM Nodes**: Keeping JavaScript object references to elements removed from the DOM tree.

---

### 2. High-Performance Event Delegation
Instead of adding 1,000 listeners on every table row, add **1 listener** on the parent container:

\`\`\`javascript
const table = document.querySelector('#data-table');

table.addEventListener('click', (event) => {
  const deleteBtn = event.target.closest('.delete-btn');
  if (!deleteBtn) return;

  const row = deleteBtn.closest('tr');
  const recordId = row.dataset.id;
  deleteRecord(recordId);
});
\`\`\`
`,
      },
    },
    {
      id: "sub-ts-enterprise",
      type: "subtopic",
      position: { x: 860, y: 530 },
      data: {
        label: "TypeScript Generics & Strict Typing",
        colorKey: "C",
        description: `### 🛡️ Advanced TypeScript: Mapped Types & Conditional Types

Create advanced, type-safe API wrappers and state models.

---

### 1. Conditional Types & \`infer\` Keyword
\`\`\`typescript
// Unwraps the return type of a Promise
type AwaitedReturnType<T> = T extends (...args: any[]) => Promise<infer R>
  ? R
  : T extends (...args: any[]) => infer R
  ? R
  : never;

async function fetchLeaderboard() {
  return [
    { rank: 1, user: 'Alex', points: 1540 },
    { rank: 2, user: 'Priya', points: 1420 }
  ];
}

// Result: { rank: number; user: string; points: number }[]
type LeaderboardData = AwaitedReturnType<typeof fetchLeaderboard>;
\`\`\`
`,
      },
    },

    // 4. React 19 & State Management
    {
      id: "react-state-architecture",
      type: "topic",
      position: { x: 550, y: 720 },
      data: {
        label: "React 19 & State Management",
        category: "Frameworks",
        description: `### ⚛️ React 19 Architecture, Hooks & State Management

Build highly reactive user interfaces with TanStack Query and Zustand.
`,
        difficulty: "intermediate",
        colorKey: "B",
        estimatedHours: 25,
      },
    },
    {
      id: "sub-react-core-hooks",
      type: "subtopic",
      position: { x: 240, y: 680 },
      data: {
        label: "React 19 Hooks & Compiler",
        colorKey: "C",
        description: `### ⚡ The React 19 Compiler & Automatic Memoization

Forget manual \`useMemo\` and \`useCallback\` boilerplate!

---

### 1. How the React Compiler Works
- Automatically analyzes JavaScript semantics and memoizes expensive calculations and callback references.
- Prevents re-renders across the component tree whenever input values are referentially identical.
- Eliminates dependency array bugs previously caused by missing dependencies in \`useCallback\`.
`,
      },
    },
    {
      id: "sub-tanstack-zustand",
      type: "subtopic",
      position: { x: 240, y: 730 },
      data: {
        label: "TanStack Query & Zustand",
        colorKey: "C",
        description: `### 🐻 Global State with Zustand & Server State with TanStack Query

Clean separation between UI state and server caching.

---

### 1. Minimalist Zustand Store
\`\`\`typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeState {
  isDarkMode: boolean;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      isDarkMode: true,
      toggleTheme: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
    }),
    { name: 'app-theme-storage' }
  )
);
\`\`\`
`,
      },
    },

    // 5. Meta-Frameworks: Next.js
    {
      id: "nextjs-mastery",
      type: "topic",
      position: { x: 550, y: 920 },
      data: {
        label: "Next.js 15 & Server Components",
        category: "Frameworks",
        description: `### ⚡ Next.js 15, Streaming & Server Actions

Master React Server Components, Turbopack, nested layouts, and edge middleware.
`,
        difficulty: "advanced",
        colorKey: "B",
        estimatedHours: 20,
      },
    },
    {
      id: "sub-rsc-streaming",
      type: "subtopic",
      position: { x: 860, y: 880 },
      data: {
        label: "React Server Components & Streaming",
        colorKey: "C",
        description: `### 🌊 Suspense Streaming & Instant Navigation

Stream slow data fetches to the client as they resolve.

\`\`\`tsx
import { Suspense } from "react";
import { SkeletonLeaderboard } from "@/components/skeletons";

export default function LeaderboardPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Club Leaderboard</h1>
      
      {/* Shell renders instantly; table streams when ready */}
      <Suspense fallback={<SkeletonLeaderboard />}>
        <AsyncLeaderboardTable />
      </Suspense>
    </div>
  );
}

async function AsyncLeaderboardTable() {
  const members = await prisma.user.findMany({
    orderBy: { points: "desc" },
    take: 50,
  });

  return <Table data={members} />;
}
\`\`\`
`,
      },
    },
    {
      id: "sub-next-routing-actions",
      type: "subtopic",
      position: { x: 860, y: 930 },
      data: {
        label: "App Router & Server Actions",
        colorKey: "C",
        description: `### 🚀 Route Groups, Intercepting Routes & Server Actions

Build modal routing overlays and secure server mutations.

---

### 1. App Router Special Files
- \`layout.tsx\`: Shared UI that preserves state on navigation.
- \`loading.tsx\`: Instant Suspense loading state for the segment.
- \`error.tsx\`: Error boundary handling uncaught segment errors.
- \`not-found.tsx\`: Custom 404 handler for \`notFound()\` calls.
- \`route.ts\`: Raw HTTP API endpoints (\`GET\`, \`POST\`, \`DELETE\`).
`,
      },
    },

    // 6. UI Engineering & Styling Systems
    {
      id: "ui-engineering",
      type: "topic",
      position: { x: 550, y: 1120 },
      data: {
        label: "UI Engineering & Design Systems",
        category: "Design Systems",
        description: `### 💎 Shadcn UI, Radix Primitives & Framer Motion

Construct high-polish accessible user interfaces with micro-interactions.
`,
        difficulty: "intermediate",
        colorKey: "B",
        estimatedHours: 15,
      },
    },
    {
      id: "sub-shadcn-radix",
      type: "subtopic",
      position: { x: 240, y: 1080 },
      data: {
        label: "Shadcn UI & Radix Primitives",
        colorKey: "C",
        description: `### 🧩 Accessible Unstyled Primitives

How Shadcn UI pairs Radix accessibility with Tailwind CSS customization.

---

### 1. The \`cn()\` Class Merger Utility
\`\`\`typescript
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines conditional classes and intelligently resolves Tailwind class conflicts
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Example: Resolves conflicting padding correctly:
// cn("px-4 py-2", "px-6") => "py-2 px-6"
\`\`\`
`,
      },
    },
    {
      id: "sub-framer-motion",
      type: "subtopic",
      position: { x: 240, y: 1130 },
      data: {
        label: "Framer Motion & Micro-Interactions",
        colorKey: "C",
        description: `### 🎬 Spring Physics Animations with Framer Motion

Create natural animations that respond to user momentum.

\`\`\`tsx
import { motion, AnimatePresence } from "framer-motion";

export function NotificationToast({ isVisible, message }: ToastProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="fixed bottom-6 right-6 p-4 rounded-xl bg-card border shadow-xl z-50"
        >
          <p className="text-sm font-medium">{message}</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
\`\`\`
`,
      },
    },

    // 7. Testing & Quality Assurance
    {
      id: "testing-qa",
      type: "topic",
      position: { x: 550, y: 1320 },
      data: {
        label: "Testing & Code Quality",
        category: "Quality",
        description: `### 🧪 Vitest, React Testing Library & Playwright E2E

Prevent regressions and verify end-to-end user workflows.
`,
        difficulty: "intermediate",
        colorKey: "B",
        estimatedHours: 14,
      },
    },
    {
      id: "sub-unit-integration-tests",
      type: "subtopic",
      position: { x: 860, y: 1280 },
      data: {
        label: "Vitest & React Testing Library",
        colorKey: "C",
        description: `### 🧪 Component Unit & Integration Testing

Test software from the perspective of real users.

\`\`\`typescript
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Counter } from "./Counter";
import { expect, test } from "vitest";

test("increments count on button click", async () => {
  const user = userEvent.setup();
  render(<Counter initialCount={0} />);

  const button = screen.getByRole("button", { name: /increment/i });
  const display = screen.getByTestId("count-value");

  expect(display).toHaveTextContent("0");
  await user.click(button);
  expect(display).toHaveTextContent("1");
});
\`\`\`
`,
      },
    },
    {
      id: "sub-playwright-e2e",
      type: "subtopic",
      position: { x: 860, y: 1330 },
      data: {
        label: "Playwright End-to-End (E2E) Testing",
        colorKey: "C",
        description: `### 🎭 Cross-Browser End-to-End Automation

Automate critical authentication and checkout flows.

\`\`\`typescript
import { test, expect } from "@playwright/test";

test("User can successfully log in and access dashboard", async ({ page }) => {
  await page.goto("http://localhost:3000/login");

  await page.fill('input[type="email"]', "alex@example.com");
  await page.fill('input[type="password"]', "SecretPass123!");
  await page.click('button[type="submit"]');

  // Verify URL redirects to dashboard
  await expect(page).toHaveURL("http://localhost:3000/dashboard");
  await expect(page.locator("h1")).toContainText("Welcome back, Alex");
});
\`\`\`
`,
      },
    },

    // 8. Web Performance & Optimization
    {
      id: "web-perf-opt",
      type: "topic",
      position: { x: 550, y: 1520 },
      data: {
        label: "Web Performance & Core Vitals",
        category: "Optimization",
        description: `### ⚡ Core Web Vitals, Bundle Analysis & Asset Optimization

Achieve 100/100 Lighthouse performance scores.
`,
        difficulty: "advanced",
        colorKey: "B",
        estimatedHours: 12,
      },
    },
    {
      id: "sub-bundle-lazy",
      type: "subtopic",
      position: { x: 240, y: 1480 },
      data: {
        label: "Code Splitting & Dynamic Imports",
        colorKey: "C",
        description: `### 📦 Dynamic Imports for Heavy Client Libraries

Only load code when the user actually needs it.

\`\`\`tsx
import dynamic from "next/dynamic";

// Monaco Editor and Chart.js are loaded only when the modal opens!
const HeavyMonacoEditor = dynamic(
  () => import("@monaco-editor/react").then((mod) => mod.Editor),
  { ssr: false, loading: () => <div className="h-64 bg-muted animate-pulse rounded-xl" /> }
);
\`\`\`
`,
      },
    },
    {
      id: "sub-vitals-metrics",
      type: "subtopic",
      position: { x: 240, y: 1530 },
      data: {
        label: "Core Web Vitals (LCP, INP, CLS)",
        colorKey: "C",
        description: `### 📈 Performance Auditing Checklist

1. **Images**: Use AVIF/WebP, set \`priority\` on above-the-fold hero banners.
2. **Fonts**: Use \`next/font\` to self-host Google fonts and eliminate layout shift (\`font-display: swap\`).
3. **JS Execution**: Offload heavy regex or data processing to Web Workers.
`,
      },
    },

    // 9. Milestone
    {
      id: "milestone-frontend-lead",
      type: "milestone",
      position: { x: 550, y: 1720 },
      data: {
        label: "Certified Frontend Engineer",
        category: "Milestone",
        description: `### 🎓 Frontend Engineering Mastery Attained!

You have completed the entire Frontend Developer curriculum:
- HTML5 accessible semantics & modern responsive CSS Grid/Subgrid.
- JavaScript engine internals, closures, and enterprise TypeScript.
- React 19, Server Components, Next.js 15 App Router, and Zustand.
- Accessible design systems with Tailwind CSS, Shadcn UI, and Framer Motion.
- Vitest unit testing, Playwright E2E automation, and 100/100 Core Web Vitals optimization.
`,
        difficulty: "advanced",
        color: "gold",
        status: "not-started",
      },
    },
  ],
  edges: [
    { id: "e-fe-1", source: "internet-basics", target: "html-css-mastery", type: "interactive" },
    { id: "e-fe-2", source: "html-css-mastery", target: "js-ts-engine", type: "interactive" },
    { id: "e-fe-3", source: "js-ts-engine", target: "react-state-architecture", type: "interactive" },
    { id: "e-fe-4", source: "react-state-architecture", target: "nextjs-mastery", type: "interactive" },
    { id: "e-fe-5", source: "nextjs-mastery", target: "ui-engineering", type: "interactive" },
    { id: "e-fe-6", source: "ui-engineering", target: "testing-qa", type: "interactive" },
    { id: "e-fe-7", source: "testing-qa", target: "web-perf-opt", type: "interactive" },
    { id: "e-fe-8", source: "web-perf-opt", target: "milestone-frontend-lead", type: "interactive" },

    // Subtopic edges
    { id: "e-fe-sub-1", source: "internet-basics", target: "sub-http-dns" },
    { id: "e-fe-sub-2", source: "internet-basics", target: "sub-browsers-cdn" },

    { id: "e-fe-sub-3", source: "html-css-mastery", target: "sub-semantic-a11y" },
    { id: "e-fe-sub-4", source: "html-css-mastery", target: "sub-flexbox-grid-fe" },
    { id: "e-fe-sub-5", source: "html-css-mastery", target: "sub-responsive-fluid" },

    { id: "e-fe-sub-6", source: "js-ts-engine", target: "sub-event-loop-dom" },
    { id: "e-fe-sub-7", source: "js-ts-engine", target: "sub-ts-enterprise" },

    { id: "e-fe-sub-8", source: "react-state-architecture", target: "sub-react-core-hooks" },
    { id: "e-fe-sub-9", source: "react-state-architecture", target: "sub-tanstack-zustand" },

    { id: "e-fe-sub-10", source: "nextjs-mastery", target: "sub-rsc-streaming" },
    { id: "e-fe-sub-11", source: "nextjs-mastery", target: "sub-next-routing-actions" },

    { id: "e-fe-sub-12", source: "ui-engineering", target: "sub-shadcn-radix" },
    { id: "e-fe-sub-13", source: "ui-engineering", target: "sub-framer-motion" },

    { id: "e-fe-sub-14", source: "testing-qa", target: "sub-unit-integration-tests" },
    { id: "e-fe-sub-15", source: "testing-qa", target: "sub-playwright-e2e" },

    { id: "e-fe-sub-16", source: "web-perf-opt", target: "sub-bundle-lazy" },
    { id: "e-fe-sub-17", source: "web-perf-opt", target: "sub-vitals-metrics" },
  ],
};
