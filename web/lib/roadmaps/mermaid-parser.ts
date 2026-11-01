/* eslint-disable @typescript-eslint/no-explicit-any */
import dagre from "@dagrejs/dagre";
import type {
  RoadmapGraphNode,
  RoadmapGraphEdge,
  NodeColorTheme,
} from "./types";

export interface MermaidParseResult {
  nodes: RoadmapGraphNode[];
  edges: RoadmapGraphEdge[];
  direction: "TB" | "LR" | "BT" | "RL";
  subgraphs: Array<{ id: string; title: string; nodeIds: string[] }>;
  rawError?: string;
}

export interface MermaidConversionOptions {
  direction?: "TB" | "LR" | "auto";
  spacing?: "compact" | "normal" | "spacious";
  defaultColor?: NodeColorTheme;
}

/**
 * Parses Mermaid flowchart/graph syntax and converts it into positioned RoadmapGraphNode & RoadmapGraphEdge elements.
 */
export function parseMermaidToRoadmap(
  mermaidCode: string,
  options: MermaidConversionOptions = {}
): MermaidParseResult {
  if (!mermaidCode || !mermaidCode.trim()) {
    return { nodes: [], edges: [], direction: "TB", subgraphs: [] };
  }

  const lines = mermaidCode.split(/\r?\n/);
  let direction: "TB" | "LR" | "BT" | "RL" = "TB";

  const nodeMap = new Map<
    string,
    {
      id: string;
      label: string;
      type: RoadmapGraphNode["type"];
      color?: NodeColorTheme;
      description?: string;
      resources?: Array<{ id: string; title: string; url: string; type: "docs" }>;
      isCore?: boolean;
      isOptional?: boolean;
      subgraphId?: string;
      shape?: string;
    }
  >();

  const rawEdges: Array<{
    source: string;
    target: string;
    label?: string;
    isDotted?: boolean;
    isBold?: boolean;
  }> = [];

  const subgraphs: Array<{ id: string; title: string; nodeIds: string[] }> = [];
  let currentSubgraph: { id: string; title: string; nodeIds: string[] } | null = null;

  // Custom class colors mapping
  const classColors = new Map<string, NodeColorTheme>();
  classColors.set("gold", "gold");
  classColors.set("emerald", "emerald");
  classColors.set("green", "emerald");
  classColors.set("blue", "blue");
  classColors.set("purple", "purple");
  classColors.set("rose", "rose");
  classColors.set("red", "crimson");
  classColors.set("cyan", "cyan");
  classColors.set("orange", "orange");
  classColors.set("indigo", "indigo");

  for (const rawLine of lines) {
    const line = rawLine.trim();

    // Skip empty lines & comments
    if (!line || line.startsWith("%%")) continue;

    // 1. Detect Direction (e.g. "graph TD", "flowchart LR", "graph TB")
    const dirMatch = line.match(/^(?:graph|flowchart)\s+(TB|TD|LR|RL|BT)/i);
    if (dirMatch) {
      const detected = dirMatch[1].toUpperCase();
      direction = detected === "TD" ? "TB" : (detected as any);
      continue;
    }

    // 2. Subgraph start: "subgraph SubgraphId [Title]" or "subgraph Title"
    const subMatch = line.match(/^subgraph\s+(?:([A-Za-z0-9_-]+)\s*)?(?:\[["']?(.*?)["']?\]|["'](.*?)["']|(.*?))?$/i);
    if (subMatch && !line.includes("-->") && !line.includes("---")) {
      const subId = subMatch[1] || `sub_${subgraphs.length + 1}`;
      const subTitle = (subMatch[2] || subMatch[3] || subMatch[4] || subId).trim();
      currentSubgraph = { id: subId, title: subTitle, nodeIds: [] };
      subgraphs.push(currentSubgraph);
      continue;
    }

    // Subgraph end
    if (line.toLowerCase() === "end" && currentSubgraph) {
      currentSubgraph = null;
      continue;
    }

    // 3. Class definitions: "classDef myClass fill:#f9f,stroke:#333"
    const classDefMatch = line.match(/^classDef\s+([A-Za-z0-9_-]+)\s+(.*)/i);
    if (classDefMatch) {
      const className = classDefMatch[1].toLowerCase();
      const styleBody = classDefMatch[2];
      if (styleBody.includes("gold") || styleBody.includes("#fbbf24") || styleBody.includes("#f59e0b")) {
        classColors.set(className, "gold");
      } else if (styleBody.includes("emerald") || styleBody.includes("#10b981") || styleBody.includes("#22c55e")) {
        classColors.set(className, "emerald");
      } else if (styleBody.includes("blue") || styleBody.includes("#3b82f6") || styleBody.includes("#0284c7")) {
        classColors.set(className, "blue");
      } else if (styleBody.includes("purple") || styleBody.includes("#a855f7") || styleBody.includes("#8b5cf6")) {
        classColors.set(className, "purple");
      } else if (styleBody.includes("rose") || styleBody.includes("#f43f5e") || styleBody.includes("#ef4444")) {
        classColors.set(className, "rose");
      } else if (styleBody.includes("cyan") || styleBody.includes("#06b6d4")) {
        classColors.set(className, "cyan");
      } else if (styleBody.includes("orange") || styleBody.includes("#f97316")) {
        classColors.set(className, "orange");
      }
      continue;
    }

    // 4. Click events / Docs links: click NodeA "https://..." "Docs"
    const clickMatch = line.match(/^click\s+([A-Za-z0-9_-]+)\s+["'](https?:\/\/[^"']+)["'](?:\s+["'](.*?)["'])?/i);
    if (clickMatch) {
      const targetNodeId = clickMatch[1];
      const linkUrl = clickMatch[2];
      const linkTitle = clickMatch[3] || "Documentation & Reference";
      const existing = nodeMap.get(targetNodeId);
      if (existing) {
        existing.resources = existing.resources || [];
        existing.resources.push({
          id: `res-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          title: linkTitle,
          url: linkUrl,
          type: "docs",
        });
      }
      continue;
    }

    // 5. Node Class Assign: class NodeA,NodeB myClass
    const classAssignMatch = line.match(/^class\s+([A-Za-z0-9_,-]+)\s+([A-Za-z0-9_-]+)/i);
    if (classAssignMatch) {
      const targetIds = classAssignMatch[1].split(",").map((s) => s.trim());
      const cls = classAssignMatch[2].toLowerCase();
      const color = classColors.get(cls);
      for (const tId of targetIds) {
        const n = nodeMap.get(tId);
        if (n) {
          if (color) n.color = color;
          if (cls === "core") n.isCore = true;
          if (cls === "optional") n.isOptional = true;
          if (cls === "milestone") n.type = "milestone";
        }
      }
      continue;
    }

    // 6. Parse Edge Statements (e.g. A --> B, A[Title] -->|Label| B(Other), A & B --> C & D)
    const edgeRegex = /(-->|---|-.->|==>|--\s*["']?([^"'-]+?)["']?\s*-->|-->\|["']?([^"|]+?)["']?\|)/g;
    if (edgeRegex.test(line)) {
      parseEdgeStatement(line, nodeMap, rawEdges, currentSubgraph?.id);
      continue;
    }

    // 7. Standalone Node Declarations (e.g. A["Topic Title"], B(("Milestone")), C{"Decision"})
    parseStandaloneNode(line, nodeMap, currentSubgraph?.id);
  }

  // Register subgraph nodes
  for (const [nId, nVal] of nodeMap.entries()) {
    if (nVal.subgraphId) {
      const sub = subgraphs.find((s) => s.id === nVal.subgraphId);
      if (sub && !sub.nodeIds.includes(nId)) {
        sub.nodeIds.push(nId);
      }
    }
  }

  // Determine final layout direction
  const finalDir = options.direction === "auto" || !options.direction ? direction : options.direction;

  // Perform Dagre Layout
  const layouted = layoutMermaidNodes(nodeMap, rawEdges, finalDir, options.spacing || "normal");

  return {
    nodes: layouted.nodes,
    edges: layouted.edges,
    direction: finalDir,
    subgraphs,
  };
}

// ─────────────────────────────────────────────────────────────
// Node Syntax Parser Helpers
// ─────────────────────────────────────────────────────────────
function extractNodeFromToken(
  token: string
): { id: string; label: string; type: RoadmapGraphNode["type"]; classTheme?: string } | null {
  const t = token.trim();
  if (!t) return null;

  // Patterns for different Mermaid bracket shapes:
  // [Rectangle] -> topic
  // ([Stadium/Pill]) -> subtopic
  // (Rounded) -> subtopic
  // [[Subroutine]] -> checklist
  // [(Cylinder/DB)] -> topic
  // ((Circle)) -> milestone
  // {{Hexagon}} -> milestone
  // {Diamond} -> milestone
  // >Flag] -> label
  // [/Parallelogram/] -> links
  const patterns: Array<{ regex: RegExp; type: RoadmapGraphNode["type"] }> = [
    { regex: /^([A-Za-z0-9_-]+)\s*\[\(\s*["']?(.*?)["']?\s*\)\](?:::([A-Za-z0-9_-]+))?$/, type: "topic" }, // [(DB)]
    { regex: /^([A-Za-z0-9_-]+)\s*\[\[\s*["']?(.*?)["']?\s*\]\](?:::([A-Za-z0-9_-]+))?$/, type: "checklist" }, // [[Task]]
    { regex: /^([A-Za-z0-9_-]+)\s*\(\[\s*["']?(.*?)["']?\s*\]\)(?:::([A-Za-z0-9_-]+))?$/, type: "subtopic" }, // ([Pill])
    { regex: /^([A-Za-z0-9_-]+)\s*\(\(\s*["']?(.*?)["']?\s*\)\)(?:::([A-Za-z0-9_-]+))?$/, type: "milestone" }, // ((Circle))
    { regex: /^([A-Za-z0-9_-]+)\s*\{\{\s*["']?(.*?)["']?\s*\}\}(?:::([A-Za-z0-9_-]+))?$/, type: "milestone" }, // {{Hexagon}}
    { regex: /^([A-Za-z0-9_-]+)\s*\{\s*["']?(.*?)["']?\s*\}(?:::([A-Za-z0-9_-]+))?$/, type: "milestone" }, // {Diamond}
    { regex: /^([A-Za-z0-9_-]+)\s*\[\/\s*["']?(.*?)["']?\s*\/\\](?:::([A-Za-z0-9_-]+))?$/, type: "links" }, // [/Link/]
    { regex: /^([A-Za-z0-9_-]+)\s*>\s*["']?(.*?)["']?\s*\](?:::([A-Za-z0-9_-]+))?$/, type: "label" }, // >Flag]
    { regex: /^([A-Za-z0-9_-]+)\s*\(\s*["']?(.*?)["']?\s*\)(?:::([A-Za-z0-9_-]+))?$/, type: "subtopic" }, // (Rounded)
    { regex: /^([A-Za-z0-9_-]+)\s*\[\s*["']?(.*?)["']?\s*\](?:::([A-Za-z0-9_-]+))?$/, type: "topic" }, // [Rectangle]
    { regex: /^([A-Za-z0-9_-]+)(?:::([A-Za-z0-9_-]+))?$/, type: "topic" }, // bare ID
  ];

  for (const { regex, type } of patterns) {
    const match = t.match(regex);
    if (match) {
      const id = match[1];
      const label = (match[2] !== undefined ? match[2] : id).trim() || id;
      const classTheme = match[3] || undefined;
      return { id, label, type, classTheme };
    }
  }

  return null;
}

function parseStandaloneNode(line: string, nodeMap: Map<string, any>, subgraphId?: string) {
  const parsed = extractNodeFromToken(line);
  if (parsed && parsed.id) {
    if (!nodeMap.has(parsed.id)) {
      nodeMap.set(parsed.id, {
        id: parsed.id,
        label: cleanLabel(parsed.label),
        type: parsed.type,
        color: resolveClassColor(parsed.classTheme),
        subgraphId,
      });
    } else {
      const existing = nodeMap.get(parsed.id);
      if (parsed.label !== parsed.id) existing.label = cleanLabel(parsed.label);
      if (parsed.type !== "topic") existing.type = parsed.type;
      if (parsed.classTheme) existing.color = resolveClassColor(parsed.classTheme);
    }
  }
}

function parseEdgeStatement(
  line: string,
  nodeMap: Map<string, any>,
  rawEdges: Array<any>,
  subgraphId?: string
) {
  // Regex to split on connection operators:
  // e.g. A --> B, A -.-> B, A ==> B, A -- Label --> B, A -->|Label| B
  const parts = line.split(/(?:-->|---|-.->|==>|--\s*["']?.*?["']?\s*-->|-->\|.*?\|)/);
  const operatorMatches = line.match(/(?:-->|---|-.->|==>|--\s*["']?(.*?)["']?\s*-->|-->\|(.*?)\|)/g) || [];

  if (parts.length < 2) return;

  for (let i = 0; i < parts.length - 1; i++) {
    const leftToken = parts[i].trim();
    const rightToken = parts[i + 1].trim();
    const op = operatorMatches[i] || "-->";

    const leftNodes = parseMultiNodeToken(leftToken, nodeMap, subgraphId);
    const rightNodes = parseMultiNodeToken(rightToken, nodeMap, subgraphId);

    // Extract edge label
    let edgeLabel: string | undefined;
    const labelPipeMatch = op.match(/-->\|(.*?)\|/);
    const labelDashMatch = op.match(/--\s*["']?(.*?)["']?\s*-->/);
    if (labelPipeMatch) edgeLabel = labelPipeMatch[1]?.trim();
    else if (labelDashMatch) edgeLabel = labelDashMatch[1]?.trim();

    const isDotted = op.includes("-.->");
    const isBold = op.includes("==>");

    for (const src of leftNodes) {
      for (const tgt of rightNodes) {
        rawEdges.push({
          source: src,
          target: tgt,
          label: edgeLabel,
          isDotted,
          isBold,
        });
      }
    }
  }
}

function parseMultiNodeToken(token: string, nodeMap: Map<string, any>, subgraphId?: string): string[] {
  // Handles multi-target syntax: "A & B & C"
  const subTokens = token.split(/\s+&\s+/);
  const nodeIds: string[] = [];

  for (const st of subTokens) {
    const parsed = extractNodeFromToken(st);
    if (parsed && parsed.id) {
      nodeIds.push(parsed.id);
      if (!nodeMap.has(parsed.id)) {
        nodeMap.set(parsed.id, {
          id: parsed.id,
          label: cleanLabel(parsed.label),
          type: parsed.type,
          color: resolveClassColor(parsed.classTheme),
          subgraphId,
        });
      } else {
        const existing = nodeMap.get(parsed.id);
        if (parsed.label !== parsed.id) existing.label = cleanLabel(parsed.label);
        if (parsed.type !== "topic") existing.type = parsed.type;
        if (parsed.classTheme) existing.color = resolveClassColor(parsed.classTheme);
      }
    }
  }

  return nodeIds;
}

function cleanLabel(label: string): string {
  return label
    .replace(/^["']|["']$/g, "")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/\\n/g, " ")
    .trim();
}

function resolveClassColor(className?: string): NodeColorTheme | undefined {
  if (!className) return undefined;
  const c = className.toLowerCase();
  const validColors: NodeColorTheme[] = [
    "gold",
    "emerald",
    "blue",
    "purple",
    "rose",
    "cyan",
    "orange",
    "lime",
    "indigo",
    "crimson",
    "teal",
    "fuchsia",
  ];
  return validColors.find((color) => color === c || c.includes(color));
}

import { getAutoLayoutedElements } from "./layout";

// ─────────────────────────────────────────────────────────────
// Roadmap.sh Central Spine & Symmetrical Wing Layout Engine
// ─────────────────────────────────────────────────────────────
function layoutMermaidNodes(
  nodeMap: Map<string, any>,
  edges: Array<any>,
  direction: "TB" | "LR" | "BT" | "RL",
  spacing: "compact" | "normal" | "spacious"
): { nodes: RoadmapGraphNode[]; edges: RoadmapGraphEdge[] } {
  const initialNodes: RoadmapGraphNode[] = [];
  const initialEdges: RoadmapGraphEdge[] = [];

  for (const [id, nData] of nodeMap.entries()) {
    initialNodes.push({
      id,
      type: nData.type,
      position: { x: 550, y: 100 },
      data: {
        label: nData.label,
        category: nData.subgraphId || "General",
        description: `Step and key concept for **${nData.label}**. Complete topics and recommended resources to master this concept.`,
        difficulty: nData.type === "milestone" ? "intermediate" : "beginner",
        color: nData.color || (nData.type === "milestone" ? "gold" : "blue"),
        isCore: nData.isCore ?? true,
        isOptional: nData.isOptional ?? false,
        status: "not-started",
        resources: nData.resources || [
          {
            id: `res-${id}-1`,
            title: `${nData.label} Documentation & Guides`,
            url: `https://developer.mozilla.org/en-US/search?q=${encodeURIComponent(nData.label)}`,
            type: "docs",
            isOfficial: true,
          },
        ],
      },
    });
  }

  for (let i = 0; i < edges.length; i++) {
    const e = edges[i];
    initialEdges.push({
      id: `e-${e.source}-${e.target}-${i}`,
      source: e.source,
      target: e.target,
      type: "interactive",
      animated: e.isDotted || false,
      label: e.label,
      style: e.isBold ? { strokeWidth: 3, stroke: "#38bdf8" } : undefined,
    });
  }

  // Pass through authentic roadmap.sh layout engine
  const layouted = getAutoLayoutedElements(
    initialNodes as any,
    initialEdges as any,
    direction === "LR" ? "LR" : "TB"
  );
  return { nodes: layouted.nodes as any, edges: layouted.edges as any };
}

// ─────────────────────────────────────────────────────────────
// Sample Starter Templates for Admins
// ─────────────────────────────────────────────────────────────
export const MERMAID_ROADMAP_TEMPLATES = [
  {
    title: "Full Stack Web Developer Track",
    category: "Web Development",
    code: `flowchart TB
    %% Direction and Graph Title
    Start((Web Dev Start)):::gold --> Internet[Internet & HTTP Basics]:::blue
    
    subgraph Frontend ["1. Frontend Foundations"]
        Internet --> HTML[HTML5 Semantics]:::emerald
        Internet --> CSS[CSS3 & Flexbox/Grid]:::emerald
        HTML --> JS[JavaScript ES6+]:::gold
        CSS --> Tailwind[Tailwind CSS]:::cyan
        JS --> React[React.js & Next.js]:::blue
        Tailwind --> React
    end

    subgraph Backend ["2. Backend & API Services"]
        React --> Milestone1{{Milestone: Build Frontend SPA}}:::rose
        Milestone1 --> Node[Node.js & Express]:::emerald
        Node --> Auth[Authentication & JWT/OAuth]:::purple
        Auth --> DB[(PostgreSQL & Prisma ORM)]:::indigo
        DB --> REST[RESTful APIs & WebSockets]:::cyan
    end

    subgraph DevOps ["3. Deployment & DevOps"]
        REST --> Milestone2{{Milestone: Full Stack Production App}}:::gold
        Milestone2 --> Docker[[Docker & Containers]]:::blue
        Docker --> CI[GitHub Actions CI/CD]:::emerald
        CI --> Cloud[AWS / Vercel Deployment]:::purple
    end

    Cloud --> Certified((Certified Full-Stack Engineer)):::gold`,
  },
  {
    title: "Backend & System Design Path",
    category: "Systems & Cloud",
    code: `flowchart TB
    Start((Backend Path)):::gold --> Lang[Core Language: Go / Java / Node]:::blue
    Lang --> OOP[OOP & Clean Architecture]:::cyan
    OOP --> DB[(Relational & NoSQL DBs)]:::indigo
    DB --> Indexing[Indexing & Query Optimization]:::emerald
    
    subgraph DistributedSystems ["Distributed Systems & Scaling"]
        Indexing --> Cache[(Redis Caching & CDN)]:::rose
        Cache --> MQ[Message Queues: Kafka / RabbitMQ]:::purple
        MQ --> Microservices[Microservices & gRPC]:::blue
    end

    subgraph SystemDesign ["System Design & Production"]
        Microservices --> LB[Load Balancing & Reverse Proxies]:::emerald
        LB --> Milestone{{Milestone: High Throughput System}}:::gold
        Milestone --> Observability[Logging & Monitoring: Prometheus/Grafana]:::cyan
    end`,
  },
  {
    title: "AI & Machine Learning Engineer",
    category: "AI & Data",
    code: `flowchart TB
    Start((AI/ML Start)):::gold --> Math[Linear Algebra & Calculus]:::blue
    Math --> Python[Python & NumPy / Pandas]:::emerald
    Python --> EDA[Exploratory Data Analysis]:::cyan
    
    subgraph ClassicalML ["Classical Machine Learning"]
        EDA --> Scikit[Scikit-Learn Models]:::purple
        Scikit --> Metrics[Cross-Validation & Metrics]:::orange
    end

    subgraph DeepLearning ["Deep Learning & GenAI"]
        Metrics --> PyTorch[PyTorch Fundamentals]:::rose
        PyTorch --> CNN_RNN[Computer Vision & NLP]:::indigo
        CNN_RNN --> Transformers[Transformers & HuggingFace]:::gold
        Transformers --> RAG[RAG & LLM Application Agents]:::cyan
    end`,
  },
  {
    title: "DevOps & Cloud Architect",
    category: "Cloud & Security",
    code: `flowchart TB
    Start((DevOps Start)):::gold --> Linux[Linux Shell & Scripting]:::blue
    Linux --> Git[Git Branching & GitHub]:::emerald
    Git --> Net[Networking: DNS, SSL, VPC]:::cyan
    
    subgraph Infrastructure ["Infrastructure as Code & CI/CD"]
        Net --> Docker[[Docker Containerization]]:::blue
        Docker --> K8s[Kubernetes Orchestration]:::purple
        K8s --> Terraform[Terraform & IaC]:::indigo
        Terraform --> CI[GitHub Actions & ArgoCD]:::emerald
    end

    subgraph CloudOps ["Cloud Platforms & SRE"]
        CI --> AWS[AWS / GCP Architecture]:::orange
        AWS --> SRE[Site Reliability Engineering & SLOs]:::gold
    end`,
  },
];
