export type RoadmapStatus = "not-started" | "in-progress" | "completed" | "skipped";

export interface RoadmapResource {
  id: string;
  title: string;
  url: string;
  type: "docs" | "article" | "video" | "course" | "task";
  isOfficial?: boolean;
}

export type NodePriority = "critical" | "important" | "normal" | "optional";
export type NodeColorTheme =
  | "default"
  | "gold"
  | "emerald"
  | "blue"
  | "purple"
  | "rose"
  | "cyan"
  | "orange"
  | "lime"
  | "indigo"
  | "crimson"
  | "teal"
  | "fuchsia";

export interface RoadmapNodeData {
  [key: string]: any;
  label: string;
  category?: string;
  description?: string;
  difficulty?: "beginner" | "intermediate" | "advanced";
  priority?: NodePriority;
  color?: NodeColorTheme;
  isCore?: boolean;
  isOptional?: boolean;
  status?: RoadmapStatus;
  estimatedHours?: number;
  resources?: RoadmapResource[];
  linkedTaskId?: string;
  linkedQuizId?: string;
  targetRoadmapSlug?: string;
  url?: string;
}

export interface RoadmapGraphNode {
  id: string;
  type:
    | "topic"
    | "subtopic"
    | "title"
    | "paragraph"
    | "section"
    | "button"
    | "links"
    | "label"
    | "checklist"
    | "milestone"
    | "branch"
    | "cluster"
    | "group";
  position: { x: number; y: number };
  data: RoadmapNodeData;
  style?: Record<string, any>;
  parentNode?: string;
}

export interface RoadmapGraphEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
  type?: "animated" | "interactive" | "smoothstep" | "straight" | "default";
  animated?: boolean;
  label?: string;
  style?: Record<string, any>;
}

export interface RoadmapData {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  badgeText?: string;
  iconName?: string;
  nodes: RoadmapGraphNode[];
  edges: RoadmapGraphEdge[];
  isPublished: boolean;
  version: number;
}

export interface UserProgressData {
  roadmapId: string;
  completedNodeIds: string[];
  inProgressNodeIds: string[];
  percentage: number;
  updatedAt: string;
}
