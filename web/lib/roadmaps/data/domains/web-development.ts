import type { RoadmapData } from "../../types";

export const webDevelopmentRoadmap: RoadmapData = {
  id: "web-development",
  slug: "web-development",
  title: "Web Development",
  description: "Complete, all-in-one study guide for Web Development. Everything you need to master Web Architecture, HTML5 Semantics, Modern CSS3/Grid/Flexbox, JavaScript & TypeScript Runtimes, React 19, Next.js 15, REST/GraphQL APIs, PostgreSQL, Redis, and DevOps Deployment without needing external materials.",
  category: "web-dev",
  badgeText: "Foundational Track",
  iconName: "Globe",
  version: 2,
  isPublished: true,
  nodes: [
    {
      id: "title-node",
      type: "title",
      position: { x: 550, y: 30 },
      data: { label: "Web Development Roadmap" },
    },
    // 1. Web Fundamentals
    {
      id: "web-basics",
      type: "topic",
      position: { x: 550, y: 120 },
      data: {
        label: "How the Web Works",
        category: "Fundamentals",
        description: `### 🌐 Complete Guide to Web Architecture & Networking

To build fast and secure web applications, you must understand how data travels from a user's browser across the internet to servers and back.

---

### 1. The Client-Server Architecture
- **Client (User Agent)**: The browser or mobile app that requests resources and renders the graphical user interface.
- **Server**: A machine listening on specific ports (e.g., \`80\` for HTTP, \`443\` for HTTPS) that processes incoming requests, talks to databases, and returns responses.
- **Stateless Nature of HTTP**: Each request is independent. State is preserved using **Cookies**, **Session IDs**, or **Bearer Tokens (JWT)**.

---

### 2. The 6-Step Web Request Lifecycle
1. **URL Parsing**: Browser parses \`https://api.example.com:443/v1/users?limit=10\`.
2. **DNS Resolution**: Checks browser cache $\\rightarrow$ OS hosts file $\\rightarrow$ Recursive Resolver $\\rightarrow$ Root & TLD $\\rightarrow$ Authoritative Name Server to get the server's IP address (e.g. \`198.51.100.24\`).
3. **TCP 3-Way Handshake**:
   - Client sends **SYN** (Synchronize).
   - Server responds with **SYN-ACK** (Synchronize-Acknowledge).
   - Client returns **ACK** (Acknowledge).
4. **TLS 1.3 Negotiation**: Asymmetric key exchange establishes symmetric session keys for encrypted HTTPS traffic.
5. **HTTP Request & Server Execution**: Server receives request headers + body, executes route logic, queries PostgreSQL/Redis, and crafts the response.
6. **Browser Rendering Pipeline**: Browser parses HTML $\\rightarrow$ builds DOM & CSSOM $\\rightarrow$ computes Layout $\\rightarrow$ Paints pixels onto screen layers.

---

### 3. Essential HTTP Response Codes
| Status Code | Meaning | When to Use |
|---|---|---|
| **200 OK** | Standard Success | Successful GET, PUT, or PATCH. |
| **201 Created** | Resource Created | Successful POST creating a new DB record. |
| **204 No Content** | Action Succeeded, No Body | Successful DELETE request. |
| **301 / 308** | Permanent Redirect | URL permanently moved (SEO friendly). |
| **304 Not Modified** | Cached Resource Valid | Client E-Tag matches server; zero payload downloaded. |
| **400 Bad Request** | Invalid Input | Validation failed (Zod schema rejection). |
| **401 Unauthorized** | Missing Authentication | User is not logged in / missing token. |
| **403 Forbidden** | Insufficient Permissions | User logged in but lacks admin role. |
| **404 Not Found** | Missing Resource | URL or resource ID does not exist. |
| **429 Too Many Requests** | Rate Limit Exceeded | Client exceeded API rate limit bucket. |
| **500 Internal Error** | Server Crashed | Unhandled exception or database crash. |
| **502 / 504** | Bad Gateway / Gateway Timeout | Reverse proxy (Nginx) cannot reach upstream app. |

---

### 4. Interactive Knowledge Check
- **Q**: Why does HTTPS require both Asymmetric and Symmetric encryption?
- **A**: Asymmetric encryption (RSA/ECC) is computationally expensive, so it is only used during the initial TLS handshake to securely share a symmetric key. Once shared, fast Symmetric encryption (AES-GCM) encrypts the rest of the session.
`,
        difficulty: "beginner",
        colorKey: "B",
        estimatedHours: 6,
        resources: [
          { id: "wd-1", title: "MDN: How the Web Works", url: "https://developer.mozilla.org/en-US/docs/Learn/Common_questions/Web_mechanics/How_does_the_Internet_work", type: "docs", isOfficial: true },
          { id: "wd-2", title: "Cloudflare: What is DNS?", url: "https://www.cloudflare.com/learning/dns/what-is-dns/", type: "article" },
        ],
      },
    },
    {
      id: "sub-http-lifecycle",
      type: "subtopic",
      position: { x: 860, y: 100 },
      data: {
        label: "HTTP/1.1 vs HTTP/2 vs HTTP/3",
        colorKey: "C",
        description: `### ⚡ Deep Dive: HTTP Evolution & Network Transport

Learn how modern protocols eliminate network latency and head-of-line blocking.

---

### 1. Protocol Comparison Matrix

| Feature | HTTP/1.1 (1997) | HTTP/2 (2015) | HTTP/3 (QUIC, 2022) |
|---|---|---|---|
| **Transport Layer** | TCP | TCP | **UDP (QUIC)** |
| **Data Framing** | Plaintext ASCII | Binary Frames | Binary Frames |
| **Multiplexing** | No (Head-of-line blocking) | **Yes** (Single TCP connection) | **Yes** (Zero TCP HOL blocking) |
| **Header Compression** | None (Repeated headers) | **HPACK** compression | **QPACK** compression |
| **Handshake Latency** | 2-3 RTTs (TCP + TLS) | 2 RTTs | **0-RTT or 1-RTT** |
| **Connection Migration**| Breaks on IP switch | Breaks on IP switch | **Seamless** (Survives Wi-Fi $\\leftrightarrow$ 5G switch) |

---

### 2. HTTP/2 Multiplexing Explained
In HTTP/1.1, browsers opened 6 parallel TCP connections per domain. If one request was slow, subsequent requests were blocked (**Head-of-Line Blocking**).

In HTTP/2:
- A single TCP connection is split into multiple independent bidirectional **Streams**.
- Streams carry interleaved **Binary Frames** (\`HEADERS\`, \`DATA\`, \`SETTINGS\`).
- Eliminates the need for legacy hacks like image spriting, domain sharding, or asset concatenation!

---

### 3. Why HTTP/3 Uses UDP (QUIC)
Even though HTTP/2 multiplexes streams, TCP guarantees strict packet ordering. If a single TCP packet is dropped on flaky mobile networks, the entire connection halts until retransmission occurs (**TCP Head-of-Line Blocking**).

QUIC implements loss recovery per stream at the user space UDP level. Dropping a packet in Stream A never delays Stream B!

\`\`\`bash
# Inspect protocols with cURL
curl -I --http2 https://google.com
curl -I --http3 https://cloudflare.com
\`\`\`
`,
      },
    },
    {
      id: "sub-dns-hosting",
      type: "subtopic",
      position: { x: 860, y: 150 },
      data: {
        label: "DNS, Domains & IP Routing",
        colorKey: "C",
        description: `### 📡 DNS Hierarchy & Domain Record Types

DNS (Domain Name System) translates human-friendly domain names (\`codebreakers.org\`) into machine IP addresses.

---

### 1. DNS Resolution Steps
1. **Browser Cache**: Checked first (TTL 60s - 300s).
2. **OS Hosts File / Resolver Cache**: \`/etc/hosts\` (Linux/Mac) or \`C:\\Windows\\System32\\drivers\\etc\\hosts\` (Windows).
3. **Recursive Resolver**: Provided by your ISP or public DNS (\`1.1.1.1\`, \`8.8.8.8\`).
4. **Root Nameservers (\`.\`)**: 13 root server clusters directing query to the TLD server.
5. **TLD Nameservers (\`.com\`, \`.org\`)**: Directs query to the authoritative nameserver.
6. **Authoritative Nameservers**: The source of truth configured with your domain registrar (Route53, Cloudflare).

---

### 2. Critical DNS Record Types
- **A Record**: Points a hostname to an IPv4 address (\`@ $\\rightarrow$ 76.76.21.21\`).
- **AAAA Record**: Points a hostname to an IPv6 address (\`@ $\\rightarrow$ 2606:4700::6810:84e5\`).
- **CNAME (Canonical Name)**: Aliases a domain to another domain (\`www $\\rightarrow$ cname.vercel-dns.com\`).
- **MX Record**: Mail Exchange servers with priority weighting (\`10 mail.google.com\`).
- **TXT Record**: Arbitrary plaintext strings used for domain ownership verification, **SPF**, **DKIM**, and **DMARC** email authentication.
- **NS Record**: Specifies which authoritative nameservers manage DNS for the zone.

\`\`\`bash
# Lookup DNS records directly from terminal using dig
dig codebreakers.org A +short
dig codebreakers.org MX
dig codebreakers.org TXT
\`\`\`
`,
      },
    },
    {
      id: "sub-browser-engine",
      type: "subtopic",
      position: { x: 860, y: 200 },
      data: {
        label: "Browser Engine & Critical Rendering Path",
        colorKey: "C",
        description: `### 🚀 Critical Rendering Path (CRP) & Optimization

How the browser converts raw HTML, CSS, and JS into visible, interactive pixels.

---

### 1. The Step-by-Step Rendering Pipeline
\`\`\`
HTML Bytes ──> Characters ──> Tokens ──> DOM Tree ──┐
                                                    ├──> Render Tree ──> Layout ──> Paint ──> Composite
CSS Bytes  ──> Characters ──> Tokens ──> CSSOM Tree ┘
\`\`\`

1. **DOM Construction**: HTML parser streams tokens into a tree of Document Object Model nodes. HTML parsing is incremental.
2. **CSSOM Construction**: CSS is **render-blocking**. The browser cannot render until all external \`<link rel="stylesheet">\` files are downloaded and parsed.
3. **Render Tree**: Combines DOM and CSSOM. Elements with \`display: none\` are excluded (unlike \`visibility: hidden\`, which occupies space).
4. **Layout (Reflow)**: Calculates exact pixel coordinates and bounding boxes ($x, y, \\text{width}, \\text{height}$).
5. **Paint**: Fills pixels with colors, borders, text, shadows, and background images into multiple GPU layers.
6. **Compositing**: GPU blends composite layers onto the screen in correct stacking order (\`z-index\`).

---

### 2. High-Performance CSS Properties
- **Cheap Properties (GPU Composited)**: \`transform\`, \`opacity\`. They bypass Layout and Paint stages completely!
- **Expensive Properties (Triggers Reflow)**: \`width\`, \`height\`, \`padding\`, \`margin\`, \`font-size\`, \`top\`, \`left\`. Changing these forces the browser to recalculate the entire page geometry.
`,
      },
    },

    // 2. HTML5 & Semantic Web
    {
      id: "html5-semantics",
      type: "topic",
      position: { x: 550, y: 320 },
      data: {
        label: "HTML5 & Accessibility (a11y)",
        category: "Frontend Core",
        description: `### 📄 Semantic HTML5, Forms & Accessibility Masterclass

HTML gives structure and meaning to web content. Writing clean semantic HTML is the foundation of high SEO scores and full accessibility.

---

### 1. The Power of Semantic Markup
Semantic tags clearly describe their meaning to both developer, browser, and assistive technologies.

\`\`\`html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Accessible Web App</title>
</head>
<body>
  <header>
    <nav aria-label="Main Navigation">
      <a href="/">Home</a>
      <a href="/courses">Roadmaps</a>
    </nav>
  </header>

  <main>
    <article>
      <h1>Full Stack Engineering in 2026</h1>
      <p>Published on <time datetime="2026-08-29">Aug 29, 2026</time></p>
      
      <section>
        <h2>Prerequisites</h2>
        <p>Before diving in, ensure you understand basic computer architecture.</p>
      </section>
    </article>

    <aside aria-label="Related Topics">
      <h3>Recommended Tracks</h3>
      <ul>
        <li><a href="/dashboard/roadmaps/frontend-development">Frontend Track</a></li>
      </ul>
    </aside>
  </main>

  <footer>
    <p>&copy; 2026 CodeBreakers. All rights reserved.</p>
  </footer>
</body>
</html>
\`\`\`

---

### 2. Non-Negotiable Semantic Rules
- **One \`<h1>\` per Page**: Reserve \`<h1>\` strictly for the main page title. Use \`<h2>\` through \`<h6>\` for subsections.
- **Buttons vs Links**:
  - Use \`<button>\` for actions (submitting forms, opening dialogs, deleting records).
  - Use \`<a href="...">\` strictly for page navigation. Never write \`<div onClick="...">\`.
- **Always provide \`alt\` text**: Every \`<img src="..." alt="...">\` must have meaningful descriptive text (or \`alt=""\` if purely decorative).
`,
        difficulty: "beginner",
        colorKey: "B",
        estimatedHours: 8,
      },
    },
    {
      id: "sub-semantic-tags",
      type: "subtopic",
      position: { x: 240, y: 280 },
      data: {
        label: "Semantic Structure & SEO",
        colorKey: "C",
        description: `### 🔍 Technical SEO & Open Graph Metadata

Optimize web pages for search engines, web crawlers, and social media preview cards.

---

### 1. Essential Meta Tags in \`<head>\`
\`\`\`html
<head>
  <!-- Primary Meta Tags -->
  <title>Full Stack Roadmap 2026 | CodeBreakers</title>
  <meta name="title" content="Full Stack Roadmap 2026 | CodeBreakers">
  <meta name="description" content="Master Frontend, Backend, Databases, and DevOps with our interactive curriculum.">
  <link rel="canonical" href="https://codebreakers.org/dashboard/roadmaps/full-stack-development">

  <!-- Open Graph / Facebook / LinkedIn -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://codebreakers.org/dashboard/roadmaps/full-stack-development">
  <meta property="og:title" content="Full Stack Roadmap 2026 | CodeBreakers">
  <meta property="og:description" content="Step-by-step masterclass to becoming a lead fullstack engineer.">
  <meta property="og:image" content="https://codebreakers.org/og-banner.png">

  <!-- Twitter Card -->
  <meta property="twitter:card" content="summary_large_image">
  <meta property="twitter:title" content="Full Stack Roadmap 2026 | CodeBreakers">
  <meta property="twitter:image" content="https://codebreakers.org/og-banner.png">
</head>
\`\`\`

---

### 2. Structured Data with JSON-LD
Search engines use Schema.org JSON-LD to display rich snippets (ratings, course modules, breadcrumbs):

\`\`\`html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Course",
  "name": "Full Stack Web Development",
  "description": "Comprehensive engineering roadmap from React to Distributed Systems",
  "provider": {
    "@type": "Organization",
    "name": "CodeBreakers",
    "sameAs": "https://codebreakers.org"
  }
}
</script>
\`\`\`
`,
      },
    },
    {
      id: "sub-forms-validation",
      type: "subtopic",
      position: { x: 240, y: 330 },
      data: {
        label: "HTML5 Forms & Native Validations",
        colorKey: "C",
        description: `### 📝 Native HTML5 Forms & Constraint Validation API

Leverage native browser form validation before reaching for heavy JavaScript libraries.

---

### 1. Robust Accessible Form Template
\`\`\`html
<form id="signup-form" novalidate>
  <div class="field">
    <label for="user-email">Email Address <span aria-hidden="true">*</span></label>
    <input 
      type="email" 
      id="user-email" 
      name="email" 
      required 
      autocomplete="email"
      placeholder="alex@example.com"
      aria-describedby="email-error"
    />
    <span id="email-error" class="error-msg" role="alert"></span>
  </div>

  <div class="field">
    <label for="user-pass">Password (Min 8 characters, 1 digit)</label>
    <input 
      type="password" 
      id="user-pass" 
      name="password" 
      required 
      minlength="8"
      pattern="(?=.*\\d)(?=.*[a-z])(?=.*[A-Z]).{8,}"
      autocomplete="new-password"
    />
  </div>

  <button type="submit">Create Account</button>
</form>
\`\`\`

---

### 2. Constraint Validation API in JavaScript
\`\`\`js
const form = document.getElementById('signup-form');
const emailInput = document.getElementById('user-email');
const emailError = document.getElementById('email-error');

form.addEventListener('submit', (e) => {
  e.preventDefault();
  if (!emailInput.validity.valid) {
    if (emailInput.validity.valueMissing) {
      emailError.textContent = 'Email is required.';
    } else if (emailInput.validity.typeMismatch) {
      emailError.textContent = 'Please enter a valid email address.';
    }
    emailInput.focus();
    return;
  }
  
  // Submit valid data via fetch()
  const formData = new FormData(form);
  console.log(Object.fromEntries(formData));
});
\`\`\`
`,
      },
    },
    {
      id: "sub-a11y-aria",
      type: "subtopic",
      position: { x: 240, y: 380 },
      data: {
        label: "WAI-ARIA & Web Accessibility",
        colorKey: "C",
        description: `### ♿ WCAG 2.2 Guidelines & WAI-ARIA Practices

Make your websites accessible to users relying on screen readers, keyboard navigation, and high-contrast modes.

---

### 1. The Golden Rule of ARIA
> **First Rule of ARIA**: If you can use a native HTML element or attribute with the semantics and behavior you need already built in, then do so instead of re-purposing an element and adding ARIA.

---

### 2. Crucial ARIA Roles & Attributes
- **\`aria-label="Close modal"\`**: Provides an invisible label for icon-only buttons.
- **\`aria-expanded="true|false"\`**: Communicates state on accordion headers and dropdown toggles.
- **\`aria-hidden="true"\`**: Hides decorative visual elements (like SVG icons) from screen readers.
- **\`aria-live="polite" | "assertive"\`**: Announces dynamic content changes (such as new chat messages or toast alerts) automatically.
- **\`role="alert"\`**: Immediately interrupts screen reader to announce time-critical errors.

---

### 3. Keyboard Navigation Checklist
- [ ] Every interactive element must be reachable using \`Tab\` and \`Shift + Tab\`.
- [ ] Modals must trap focus inside while open and return focus to the trigger button when closed with \`Escape\`.
- [ ] Never set \`outline: none\` in CSS without providing a custom, high-contrast \`:focus-visible\` indicator.
`,
      },
    },

    // 3. Modern CSS & Design Systems
    {
      id: "modern-css",
      type: "topic",
      position: { x: 550, y: 520 },
      data: {
        label: "Modern CSS & Responsive Design",
        category: "Styling",
        description: `### 🎨 Modern CSS3, Flexbox, Grid, Cascade Layers & Tokens

CSS has evolved dramatically. Modern CSS includes native nesting, CSS Grid subgrid, container queries, color-mix, and cascade layers.

---

### 1. Modern CSS Reset (Production Ready)
\`\`\`css
/* 1. Use a more-intuitive box-sizing model */
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

/* 2. Remove default margins and enable smooth font smoothing */
body {
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  font-family: system-ui, -apple-system, sans-serif;
  color: var(--text-foreground);
  background-color: var(--bg-background);
}

/* 3. Improve media defaults */
img, picture, video, canvas, svg {
  display: block;
  max-width: 100%;
  height: auto;
}

/* 4. Inherit fonts for form controls */
input, button, textarea, select {
  font: inherit;
}
\`\`\`

---

### 2. CSS Specificity Calculator Hierarchy
1. **Inline Styles** (\`style="..."\`): $1000$ points.
2. **IDs** (\`#header\`): $100$ points.
3. **Classes, Attributes & Pseudo-classes** (\`.btn\`, \`[type="text"]\`, \`:hover\`): $10$ points.
4. **Elements & Pseudo-elements** (\`div\`, \`p\`, \`::before\`): $1$ point.
5. **Universal Selector (\`*\`) & Inherited**: $0$ points.
`,
        difficulty: "beginner",
        colorKey: "B",
        estimatedHours: 14,
      },
    },
    {
      id: "sub-flexbox-grid",
      type: "subtopic",
      position: { x: 860, y: 480 },
      data: {
        label: "Flexbox & CSS Grid Mastery",
        colorKey: "C",
        description: `### 📐 1D vs 2D Layout Mastery: Flexbox & Grid

Master when to use Flexbox versus CSS Grid for any UI pattern.

---

### 1. Flexbox (One-Dimensional Layout)
Use Flexbox when aligning items in a single row or single column (navbars, card headers, tag lists).

\`\`\`css
.navbar {
  display: flex;
  justify-content: space-between; /* Space out brand & nav links */
  align-items: center;            /* Vertically center all child items */
  gap: 1.5rem;
  flex-wrap: wrap;                /* Wrap onto next line on small screens */
}

.nav-links {
  display: flex;
  gap: 1rem;
  margin-left: auto;              /* Push remaining items to the right */
}
\`\`\`

---

### 2. CSS Grid (Two-Dimensional Layout)
Use CSS Grid when aligning items across both rows and columns simultaneously.

\`\`\`css
/* Responsive auto-fitting card grid with ZERO media queries */
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

/* Holy Grail Application Layout */
.app-layout {
  display: grid;
  grid-template-areas:
    "header  header"
    "sidebar main"
    "footer  footer";
  grid-template-columns: 260px 1fr;
  grid-template-rows: 64px 1fr 48px;
  min-height: 100vh;
}

.header  { grid-area: header; }
.sidebar { grid-area: sidebar; }
.main    { grid-area: main; }
.footer  { grid-area: footer; }
\`\`\`
`,
      },
    },
    {
      id: "sub-responsive-container",
      type: "subtopic",
      position: { x: 860, y: 530 },
      data: {
        label: "Responsive & Container Queries",
        colorKey: "C",
        description: `### 📱 Container Queries & Fluid Typography

Build truly modular components that respond to their parent container's width rather than the viewport.

---

### 1. Container Queries in Modern CSS
\`\`\`css
/* 1. Define parent element as a containment context */
.card-wrapper {
  container-type: inline-size;
  container-name: product-card;
}

/* 2. Style child components based on wrapper container size */
.card {
  display: flex;
  flex-direction: column;
}

@container product-card (min-width: 500px) {
  .card {
    flex-direction: row; /* Switch to horizontal layout when container is wide! */
    align-items: center;
  }
}
\`\`\`

---

### 2. Fluid Typography with \`clamp()\`
Eliminate messy media queries for font sizes by setting smooth mathematical bounds:

\`\`\`css
/* clamp(MIN, VAL, MAX) */
h1 {
  font-size: clamp(2rem, 1.2rem + 2.5vw, 3.75rem);
  line-height: 1.15;
}

.container {
  width: min(100% - 2rem, 1200px);
  margin-inline: auto; /* Centered with minimum 1rem side padding */
}
\`\`\`
`,
      },
    },
    {
      id: "sub-css-variables-tailwind",
      type: "subtopic",
      position: { x: 860, y: 580 },
      data: {
        label: "CSS Custom Properties & Tailwind CSS",
        colorKey: "C",
        description: `### 🎯 Design Tokens & Utility-First Tailwind CSS

Implement theme switching (Dark/Light mode) and maintain clean design tokens.

---

### 1. CSS Custom Properties (Variables)
\`\`\`css
:root {
  --color-primary: #3b82f6;
  --color-bg: #ffffff;
  --color-text: #0f172a;
  --radius-lg: 0.75rem;
}

[data-theme="dark"] {
  --color-primary: #60a5fa;
  --color-bg: #09090b;
  --color-text: #f8fafc;
}

.card {
  background-color: var(--color-bg);
  color: var(--color-text);
  border-radius: var(--radius-lg);
  border: 1px solid color-mix(in srgb, var(--color-text) 15%, transparent);
}
\`\`\`

---

### 2. Tailwind CSS v4 Best Practices
\`\`\`tsx
export function MetricCard({ title, value, change }: MetricProps) {
  return (
    <div className="p-6 rounded-2xl bg-card border border-border/60 shadow-xs hover:shadow-md transition-all duration-200">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
      <div className="flex items-baseline justify-between mt-2">
        <h3 className="text-2xl font-bold tracking-tight text-foreground">{value}</h3>
        <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", change >= 0 ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600")}>
          {change >= 0 ? \`+\${change}%\` : \`\${change}%\`}
        </span>
      </div>
    </div>
  );
}
\`\`\`
`,
      },
    },

    // 4. JavaScript Core & TypeScript
    {
      id: "js-typescript",
      type: "topic",
      position: { x: 550, y: 720 },
      data: {
        label: "JavaScript Deep Dive & TypeScript",
        category: "Programming",
        description: `### 💻 JavaScript Engine Internals & Enterprise TypeScript

Deep dive into memory heap, closures, event loop microtasks, prototype chains, and strict TypeScript types.

---

### 1. Key JavaScript Concepts You Must Master
- **Execution Context & Hoisting**: Variables declared with \`var\` are hoisted with \`undefined\`; \`let\` and \`const\` reside in the Temporal Dead Zone (TDZ).
- **Closures**: A function bundled together with references to its lexical environment. Enables encapsulation and factory patterns.
- **Prototypes & Inheritance**: Objects inherit properties through the prototype chain (\`__proto__\` $\\rightarrow$ \`prototype\`).

---

### 2. Code Example: Custom Debounce Implementation
\`\`\`typescript
/**
 * Limits the rate at which a function can fire.
 */
export function debounce<T extends (...args: any[]) => void>(
  fn: T,
  delayMs: number
): (...args: Parameters<T>) => void {
  let timerId: ReturnType<typeof setTimeout> | undefined;

  return function (...args: Parameters<T>) {
    if (timerId !== undefined) {
      clearTimeout(timerId);
    }
    timerId = setTimeout(() => {
      fn(...args);
    }, delayMs);
  };
}
\`\`\`
`,
        difficulty: "intermediate",
        colorKey: "B",
        estimatedHours: 25,
      },
    },
    {
      id: "sub-es6-async",
      type: "subtopic",
      position: { x: 240, y: 680 },
      data: {
        label: "Event Loop, Promises & Async/Await",
        colorKey: "C",
        description: `### 🔄 The JavaScript Event Loop & Concurrency Model

Understand how single-threaded JavaScript executes asynchronous code without blocking.

---

### 1. Execution Priority Order
1. **Call Stack**: Executes synchronous statements.
2. **Microtask Queue (Higher Priority)**: \`Promise.then()\`, \`queueMicrotask()\`, \`MutationObserver\`. Emptied completely before the browser repaints.
3. **Macrotask Queue (Lower Priority)**: \`setTimeout()\`, \`setInterval()\`, \`setImmediate()\`, I/O events.

---

### 2. Predict the Output (Interview Favorite!)
\`\`\`javascript
console.log('1'); // Sync

setTimeout(() => {
  console.log('2'); // Macrotask
}, 0);

Promise.resolve().then(() => {
  console.log('3'); // Microtask
});

queueMicrotask(() => {
  console.log('4'); // Microtask
});

console.log('5'); // Sync

// Output: 1 -> 5 -> 3 -> 4 -> 2
\`\`\`

---

### 3. Asynchronous Error Handling with \`Promise.allSettled\`
\`\`\`javascript
// Promise.all fails fast if ANY promise rejects
// Promise.allSettled waits for ALL to resolve or reject:
const results = await Promise.allSettled([
  fetch('/api/user'),
  fetch('/api/notifications'),
  fetch('/api/analytics')
]);

results.forEach((res, idx) => {
  if (res.status === 'fulfilled') {
    console.log(\`Task \${idx} succeeded:\`, res.value);
  } else {
    console.error(\`Task \${idx} failed:\`, res.reason);
  }
});
\`\`\`
`,
      },
    },
    {
      id: "sub-typescript-types",
      type: "subtopic",
      position: { x: 240, y: 730 },
      data: {
        label: "TypeScript Interfaces, Generics & Utility Types",
        colorKey: "C",
        description: `### 🛡️ TypeScript: Generics, Narrowing & Utility Types

Transform potential runtime errors into instant compile-time feedback.

---

### 1. Discriminated Unions for Clean State Modeling
\`\`\`typescript
type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T; timestamp: number }
  | { status: 'error'; error: Error };

function renderUI(state: AsyncState<User[]>) {
  switch (state.status) {
    case 'idle':
      return null;
    case 'loading':
      return <Spinner />;
    case 'success':
      // TypeScript automatically knows state.data exists here!
      return <UserList users={state.data} />;
    case 'error':
      return <ErrorMessage message={state.error.message} />;
  }
}
\`\`\`

---

### 2. Essential Built-in Utility Types
\`\`\`typescript
interface UserProfile {
  id: string;
  name: string;
  email: string;
  age?: number;
  role: 'admin' | 'member';
}

// 1. Partial: All fields optional
type UpdateUserDto = Partial<UserProfile>;

// 2. Required: All fields mandatory
type CompleteProfile = Required<UserProfile>;

// 3. Pick: Select specific fields
type UserCredentials = Pick<UserProfile, 'email' | 'id'>;

// 4. Omit: Remove specific fields
type PublicUser = Omit<UserProfile, 'email'>;

// 5. Record: Dictionary mapping
type UserRolesMap = Record<string, UserProfile>;
\`\`\`
`,
      },
    },

    // 5. Frontend Frameworks
    {
      id: "frontend-frameworks",
      type: "topic",
      position: { x: 550, y: 920 },
      data: {
        label: "Frontend Frameworks (React & Next.js)",
        category: "Frameworks",
        description: `### ⚛️ React 19, Server Components & State Management

Build declarative, reactive user interfaces with modern React paradigms.

---

### 1. The Core Philosophy of React
$$\\text{UI} = f(\\text{state})$$
- Components are pure functions that transform state and props into Virtual DOM representations.
- React reconciles Virtual DOM diffs and applies minimal batched mutations to the real browser DOM.

---

### 2. Custom Hook: Window Resize & Media Query
\`\`\`typescript
import { useState, useEffect } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [query, matches]);

  return matches;
}
\`\`\`
`,
        difficulty: "intermediate",
        colorKey: "B",
        estimatedHours: 24,
      },
    },
    {
      id: "sub-react-hooks",
      type: "subtopic",
      position: { x: 860, y: 880 },
      data: {
        label: "React 19 & Modern Hooks",
        colorKey: "C",
        description: `### ⚡ React 19 Actions: useActionState & useOptimistic

Streamline form submissions and provide instant optimistic UI updates.

---

### 1. Optimistic UI Updates Example
\`\`\`tsx
import { useOptimistic, useTransition } from 'react';

export function LikeButton({ initialLikes, postId }: { initialLikes: number; postId: string }) {
  const [isPending, startTransition] = useTransition();
  const [optimisticLikes, setOptimisticLikes] = useOptimistic(
    initialLikes,
    (current, update: number) => current + update
  );

  const handleLike = () => {
    startTransition(async () => {
      setOptimisticLikes(1); // UI updates instantly!
      await toggleLikeOnServer(postId); // Network call
    });
  };

  return (
    <button onClick={handleLike} disabled={isPending} className="flex items-center gap-2">
      ❤️ <span>{optimisticLikes}</span>
    </button>
  );
}
\`\`\`
`,
      },
    },
    {
      id: "sub-nextjs-meta",
      type: "subtopic",
      position: { x: 860, y: 930 },
      data: {
        label: "Next.js App Router & SSR",
        colorKey: "C",
        description: `### ⚡ Fullstack Next.js 15 & Server Components

Run code securely on the server with zero client bundle overhead.

---

### 1. React Server Components vs Client Components
| Feature | Server Components (\`default\`) | Client Components (\`"use client"\`) |
|---|---|---|
| **Data Fetching** | Direct DB / Prisma query | \`fetch()\` / TanStack Query |
| **Secrets / API Keys** | Kept secure on server | Exposed in client bundle if public |
| **Bundle Size** | **0 KB** added to client | Adds JS weight to client bundle |
| **Interactivity** | No \`onClick\`, \`useState\` | Supports \`useState\`, \`useEffect\`, Event Listeners |

---

### 2. Server Action with Zod Validation
\`\`\`typescript
"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

const schema = z.object({
  title: z.string().min(3).max(100),
});

export async function createTopicAction(formData: FormData) {
  const parsed = schema.safeParse({ title: formData.get("title") });
  if (!parsed.success) {
    return { error: "Invalid title length." };
  }

  await prisma.task.create({ data: { title: parsed.data.title } });
  revalidatePath("/dashboard/tasks");
  return { success: true };
}
\`\`\`
`,
      },
    },

    // 6. Backend & APIs
    {
      id: "backend-apis",
      type: "topic",
      position: { x: 550, y: 1120 },
      data: {
        label: "Backend Architecture & APIs",
        category: "Backend",
        description: `### 🔌 RESTful Design, GraphQL, Auth & API Gateways

Architect scalable backend services, clean endpoints, and secure authorization layers.
`,
        difficulty: "intermediate",
        colorKey: "B",
        estimatedHours: 20,
      },
    },
    {
      id: "sub-rest-graphql",
      type: "subtopic",
      position: { x: 240, y: 1080 },
      data: {
        label: "RESTful Design & OpenAPI / Swagger",
        colorKey: "C",
        description: `### 📋 RESTful API Best Practices

Follow industry standards when designing REST API endpoints.

---

### 1. Proper URI Naming Conventions
- **Use plural nouns**: \`/api/v1/users\`, \`/api/v1/orders\`.
- **Nested resources for relationships**: \`/api/v1/users/102/orders\`.
- **Filtering, Sorting & Pagination via Query Params**:
  \`GET /api/v1/products?category=electronics&sort=-price&page=2&limit=20\`.

---

### 2. Idempotency Rules
- **Idempotent**: Performing the operation multiple times yields the same result on the server (\`GET\`, \`PUT\`, \`DELETE\`, \`HEAD\`).
- **Non-Idempotent**: Each request creates a new state mutation (\`POST\`). Use \`Idempotency-Key\` headers on checkout endpoints to prevent duplicate charges!
`,
      },
    },
    {
      id: "sub-auth-sessions",
      type: "subtopic",
      position: { x: 240, y: 1130 },
      data: {
        label: "Auth, JWT, OAuth 2.0 & Sessions",
        colorKey: "C",
        description: `### 🔒 Authentication & Authorization Mechanisms

Protect user identity and prevent unauthorized access.

---

### 1. JWT vs Session Cookies
- **Session Cookies (\`HttpOnly\`, \`SameSite=Lax\`, \`Secure\`)**: State is stored on the server (Redis/DB). Easy to revoke instantly. Immune to JavaScript XSS theft.
- **JWT (JSON Web Tokens)**: Stateless. Contains \`header.payload.signature\`. Cannot be revoked easily before expiration without token blacklisting.
- **Best Practice**: Short-lived Access Token (15 min) + Refresh Token stored in \`HttpOnly\` secure cookie with token rotation.
`,
      },
    },

    // 7. Databases & Storage
    {
      id: "databases-storage",
      type: "topic",
      position: { x: 550, y: 1320 },
      data: {
        label: "Databases & Data Modeling",
        category: "Data",
        description: `### 🗄️ Relational PostgreSQL, Prisma ORM, Indexing & Redis

Persistent storage architecture, query plans, indexing strategies, and caching layers.
`,
        difficulty: "intermediate",
        colorKey: "B",
        estimatedHours: 18,
      },
    },
    {
      id: "sub-sql-postgres",
      type: "subtopic",
      position: { x: 860, y: 1280 },
      data: {
        label: "PostgreSQL & Prisma ORM",
        colorKey: "C",
        description: `### 🐘 PostgreSQL Relational Modeling & Prisma Schema

Model one-to-one, one-to-many, and many-to-many relationships.

\`\`\`prisma
model User {
  id        String    @id @default(cuid())
  email     String    @unique
  name      String
  posts     Post[]
  profile   Profile?
  createdAt DateTime  @default(now())

  @@index([email])
}

model Post {
  id        String   @id @default(cuid())
  title     String
  content   String   @db.Text
  authorId  String
  author    User     @relation(fields: [authorId], references: [id], onDelete: Cascade)

  @@index([authorId])
}
\`\`\`
`,
      },
    },
    {
      id: "sub-caching-redis",
      type: "subtopic",
      position: { x: 860, y: 1330 },
      data: {
        label: "Redis Caching & Key-Value Storage",
        colorKey: "C",
        description: `### ⚡ Redis In-Memory Caching (Cache-Aside Pattern)

Serve read-heavy endpoints in $<2\\text{ms}$ latency.

\`\`\`typescript
import { redis } from "@/lib/redis";
import { prisma } from "@/lib/db";

export async function getCachedUserProfile(userId: string) {
  const cacheKey = \`user:profile:\${userId}\`;

  // 1. Check Redis cache
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  // 2. Cache miss -> query Postgres database
  const user = await prisma.user.findUnique({ where: { id: userId } });

  // 3. Write back to Redis with 1-hour TTL (Time-To-Live)
  if (user) {
    await redis.set(cacheKey, JSON.stringify(user), "EX", 3600);
  }

  return user;
}
\`\`\`
`,
      },
    },

    // 8. DevOps, CI/CD & Cloud Deployment
    {
      id: "devops-deployment",
      type: "topic",
      position: { x: 550, y: 1520 },
      data: {
        label: "Deployment, CI/CD & Web Performance",
        category: "Operations",
        description: `### 🚀 Docker, GitHub Actions, Vercel & Production Monitoring

Automate build pipelines, run tests on pull requests, and monitor Core Web Vitals.
`,
        difficulty: "advanced",
        colorKey: "B",
        estimatedHours: 15,
      },
    },
    {
      id: "sub-git-cicd",
      type: "subtopic",
      position: { x: 240, y: 1480 },
      data: {
        label: "Git Workflows & GitHub Actions CI/CD",
        colorKey: "C",
        description: `### 🤖 GitHub Actions Workflow Configuration

Automate linting, testing, and production builds on every commit.

\`\`\`yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install Dependencies
        run: npm ci

      - name: Run Typecheck
        run: npx tsc --noEmit

      - name: Run Linter
        run: npm run lint

      - name: Run Unit Tests
        run: npm run test
\`\`\`
`,
      },
    },
    {
      id: "sub-web-vitals",
      type: "subtopic",
      position: { x: 240, y: 1530 },
      data: {
        label: "Core Web Vitals & Production Monitoring",
        colorKey: "C",
        description: `### 📊 Google Core Web Vitals Benchmarks

- **LCP (Largest Contentful Paint)**: Measure loading performance. Good: $\\le 2.5\\text{s}$. Fix: Preload hero images, use WebP/AVIF formats, optimize TTFB.
- **INP (Interaction to Next Paint)**: Measure page responsiveness to user clicks. Good: $\\le 200\\text{ms}$. Fix: Avoid long main-thread JS execution, split tasks.
- **CLS (Cumulative Layout Shift)**: Measure visual layout stability. Good: $\\le 0.1$. Fix: Set explicit \`width\` and \`height\` on all images and ad slots.
`,
      },
    },

    // 9. Capstone Milestone
    {
      id: "milestone-web-dev",
      type: "milestone",
      position: { x: 550, y: 1720 },
      data: {
        label: "Certified Modern Web Developer",
        category: "Milestone",
        description: `### 🎓 Web Development Mastery Attained!

You have completed the entire curriculum:
- Web protocols (HTTP/3, DNS, CRP).
- Accessible Semantic HTML5 & Responsive CSS Grid/Flexbox.
- Modern TypeScript & Asynchronous Concurrency.
- React 19, Server Components & Next.js 15 App Router.
- REST/GraphQL APIs, PostgreSQL & Redis caching.
- Automated GitHub Actions CI/CD and Web Vitals optimization.
`,
        difficulty: "advanced",
        color: "gold",
        status: "not-started",
      },
    },
  ],
  edges: [
    { id: "e-wd-1", source: "web-basics", target: "html5-semantics", type: "interactive" },
    { id: "e-wd-2", source: "html5-semantics", target: "modern-css", type: "interactive" },
    { id: "e-wd-3", source: "modern-css", target: "js-typescript", type: "interactive" },
    { id: "e-wd-4", source: "js-typescript", target: "frontend-frameworks", type: "interactive" },
    { id: "e-wd-5", source: "frontend-frameworks", target: "backend-apis", type: "interactive" },
    { id: "e-wd-6", source: "backend-apis", target: "databases-storage", type: "interactive" },
    { id: "e-wd-7", source: "databases-storage", target: "devops-deployment", type: "interactive" },
    { id: "e-wd-8", source: "devops-deployment", target: "milestone-web-dev", type: "interactive" },

    // Subtopic edges
    { id: "e-wd-sub-1", source: "web-basics", target: "sub-http-lifecycle" },
    { id: "e-wd-sub-2", source: "web-basics", target: "sub-dns-hosting" },
    { id: "e-wd-sub-3", source: "web-basics", target: "sub-browser-engine" },

    { id: "e-wd-sub-4", source: "html5-semantics", target: "sub-semantic-tags" },
    { id: "e-wd-sub-5", source: "html5-semantics", target: "sub-forms-validation" },
    { id: "e-wd-sub-6", source: "html5-semantics", target: "sub-a11y-aria" },

    { id: "e-wd-sub-7", source: "modern-css", target: "sub-flexbox-grid" },
    { id: "e-wd-sub-8", source: "modern-css", target: "sub-responsive-container" },
    { id: "e-wd-sub-9", source: "modern-css", target: "sub-css-variables-tailwind" },

    { id: "e-wd-sub-10", source: "js-typescript", target: "sub-es6-async" },
    { id: "e-wd-sub-11", source: "js-typescript", target: "sub-typescript-types" },

    { id: "e-wd-sub-12", source: "frontend-frameworks", target: "sub-react-hooks" },
    { id: "e-wd-sub-13", source: "frontend-frameworks", target: "sub-nextjs-meta" },

    { id: "e-wd-sub-14", source: "backend-apis", target: "sub-rest-graphql" },
    { id: "e-wd-sub-15", source: "backend-apis", target: "sub-auth-sessions" },

    { id: "e-wd-sub-16", source: "databases-storage", target: "sub-sql-postgres" },
    { id: "e-wd-sub-17", source: "databases-storage", target: "sub-caching-redis" },

    { id: "e-wd-sub-18", source: "devops-deployment", target: "sub-git-cicd" },
    { id: "e-wd-sub-19", source: "devops-deployment", target: "sub-web-vitals" },
  ],
};
