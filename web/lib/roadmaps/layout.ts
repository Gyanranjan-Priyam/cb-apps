import type { Node, Edge } from "@xyflow/react";

const TOPIC_WIDTH = 220;
const SUBTOPIC_WIDTH = 200;
const SUBTOPIC_HEIGHT = 44;
const SUBTOPIC_GAP = 12;
const SPINE_X = 550;

/**
 * Authentic Roadmap.sh Layout Engine
 * - Central Spine: Main Topic nodes flow down the exact center axis (x = 550).
 * - Symmetrical Wing Distribution:
 *     - If a Topic has <= 3 subtopics: Alternates between Left Wing and Right Wing.
 *     - If a Topic has > 3 subtopics: Splits them evenly across BOTH Left and Right wings for balanced symmetry!
 * - Handles:
 *     - Left subtopics: Parent Left -> Subtopic Right.
 *     - Right subtopics: Parent Right -> Subtopic Left.
 *     - Spine Connections: Parent Bottom -> Child Top.
 */
export function getAutoLayoutedElements(
  nodes: Node[],
  edges: Edge[],
  _direction: "TB" | "LR" = "TB"
): { nodes: Node[]; edges: Edge[] } {
  if (!nodes || nodes.length === 0) return { nodes: [], edges: [] };

  const nodeMap = new Map<string, Node>();
  nodes.forEach((n) => nodeMap.set(n.id, { ...n }));

  // Separate node categories
  const titleNodes: Node[] = [];
  const cardNodes: Node[] = [];
  const subtopicNodes: Node[] = [];
  const mainTopicNodes: Node[] = [];
  const otherNodes: Node[] = [];

  nodes.forEach((n) => {
    if (n.type === "title") {
      titleNodes.push(n);
    } else if (n.type === "paragraph") {
      cardNodes.push(n);
    } else if (n.type === "subtopic" || n.type === "branch" || n.type === "links" || n.type === "checklist") {
      subtopicNodes.push(n);
    } else if (n.type === "topic" || n.type === "milestone" || n.type === "button") {
      mainTopicNodes.push(n);
    } else {
      otherNodes.push(n);
    }
  });

  // Helper to find the ultimate parent Topic for any node
  const findRootTopic = (nodeId: string, visited = new Set<string>()): Node | null => {
    if (visited.has(nodeId)) return null;
    visited.add(nodeId);

    const node = nodeMap.get(nodeId);
    if (!node) return null;
    if (node.type === "topic" || node.type === "milestone") return node;

    // Find incoming edge
    const incomingEdge = edges.find((e) => e.target === nodeId);
    if (incomingEdge) {
      return findRootTopic(incomingEdge.source, visited);
    }
    return null;
  };

  // Map subtopics to their ROOT parent topic
  const parentToSubtopics = new Map<string, Node[]>();
  const assignedSubtopics = new Set<string>();

  subtopicNodes.forEach((sub) => {
    const rootParent = findRootTopic(sub.id);
    if (rootParent) {
      const current = parentToSubtopics.get(rootParent.id) || [];
      if (!current.some((c) => c.id === sub.id)) {
        current.push(sub);
        parentToSubtopics.set(rootParent.id, current);
        assignedSubtopics.add(sub.id);
      }
    }
  });

  // Sort Main Topics by topological order along the spine
  const topicIncoming = new Map<string, number>();
  mainTopicNodes.forEach((t) => topicIncoming.set(t.id, 0));

  edges.forEach((e) => {
    const src = nodeMap.get(e.source);
    const tgt = nodeMap.get(e.target);
    if (
      src &&
      tgt &&
      (src.type === "topic" || src.type === "milestone") &&
      (tgt.type === "topic" || tgt.type === "milestone")
    ) {
      topicIncoming.set(tgt.id, (topicIncoming.get(tgt.id) || 0) + 1);
    }
  });

  // Topological sort for spine topics
  const sortedMainTopics: Node[] = [];
  const queue: Node[] = mainTopicNodes.filter((t) => (topicIncoming.get(t.id) || 0) === 0);

  while (queue.length > 0) {
    const curr = queue.shift()!;
    sortedMainTopics.push(curr);

    edges
      .filter((e) => e.source === curr.id)
      .forEach((e) => {
        const tgt = nodeMap.get(e.target);
        if (tgt && (tgt.type === "topic" || tgt.type === "milestone")) {
          const count = (topicIncoming.get(tgt.id) || 1) - 1;
          topicIncoming.set(tgt.id, count);
          if (count === 0 && !sortedMainTopics.some((s) => s.id === tgt.id)) {
            queue.push(tgt);
          }
        }
      });
  }

  // Add any unlinked topics
  mainTopicNodes.forEach((t) => {
    if (!sortedMainTopics.some((s) => s.id === t.id)) {
      sortedMainTopics.push(t);
    }
  });

  // ── 1. Position Title Nodes Centered at Top of Spine ──
  let currentY = 40;
  const layoutedNodes: Node[] = [];

  titleNodes.forEach((title, idx) => {
    layoutedNodes.push({
      ...title,
      position: { x: SPINE_X - 100, y: currentY + idx * 50 },
    });
  });

  if (titleNodes.length > 0) {
    currentY += titleNodes.length * 50 + 40;
  } else {
    currentY = 100;
  }

  // ── 2. Position Instruction Cards on the Top-Left ──
  cardNodes.forEach((card, idx) => {
    layoutedNodes.push({
      ...card,
      position: { x: 60, y: 80 + idx * 180 },
    });
  });

  // ── 3. Position Main Topics on Spine with Symmetrical Left/Right Subtopics ──
  sortedMainTopics.forEach((topic, idx) => {
    const subtopics = parentToSubtopics.get(topic.id) || [];
    const subtopicCount = subtopics.length;

    if (subtopicCount > 3) {
      // Split evenly across Left and Right wings for balanced layout
      const leftCount = Math.ceil(subtopicCount / 2);
      const leftSubs = subtopics.slice(0, leftCount);
      const rightSubs = subtopics.slice(leftCount);

      const maxSideCount = Math.max(leftSubs.length, rightSubs.length);
      const stackHeight = maxSideCount * (SUBTOPIC_HEIGHT + SUBTOPIC_GAP) - SUBTOPIC_GAP;
      const verticalSpan = Math.max(70, stackHeight);

      const topicY = currentY + (maxSideCount > 1 ? (stackHeight / 2) - 20 : 0);
      layoutedNodes.push({
        ...topic,
        position: { x: SPINE_X, y: topicY },
      });

      // Left wing subtopics
      leftSubs.forEach((sub, subIdx) => {
        layoutedNodes.push({
          ...sub,
          position: {
            x: SPINE_X - SUBTOPIC_WIDTH - 70,
            y: currentY + subIdx * (SUBTOPIC_HEIGHT + SUBTOPIC_GAP),
          },
        });
      });

      // Right wing subtopics
      rightSubs.forEach((sub, subIdx) => {
        layoutedNodes.push({
          ...sub,
          position: {
            x: SPINE_X + TOPIC_WIDTH + 70,
            y: currentY + subIdx * (SUBTOPIC_HEIGHT + SUBTOPIC_GAP),
          },
        });
      });

      currentY += verticalSpan + 95;
    } else if (subtopicCount > 0) {
      // Alternate left or right for smaller groups (1 to 3 items)
      const isLeft = idx % 2 === 1;
      const stackHeight = subtopicCount * (SUBTOPIC_HEIGHT + SUBTOPIC_GAP) - SUBTOPIC_GAP;
      const verticalSpan = Math.max(65, stackHeight);

      const topicY = currentY + (subtopicCount > 1 ? (stackHeight / 2) - 16 : 0);
      layoutedNodes.push({
        ...topic,
        position: { x: SPINE_X, y: topicY },
      });

      const subtopicX = isLeft
        ? SPINE_X - SUBTOPIC_WIDTH - 70
        : SPINE_X + TOPIC_WIDTH + 70;

      subtopics.forEach((sub, subIdx) => {
        layoutedNodes.push({
          ...sub,
          position: {
            x: subtopicX,
            y: currentY + subIdx * (SUBTOPIC_HEIGHT + SUBTOPIC_GAP),
          },
        });
      });

      currentY += verticalSpan + 90;
    } else {
      // Lone main topic on the spine
      layoutedNodes.push({
        ...topic,
        position: { x: SPINE_X, y: currentY },
      });
      currentY += 105;
    }
  });

  // ── 4. Position any Orphan Subtopics or Other Nodes ──
  subtopicNodes.forEach((sub) => {
    if (!assignedSubtopics.has(sub.id) && !layoutedNodes.some((n) => n.id === sub.id)) {
      layoutedNodes.push({
        ...sub,
        position: { x: SPINE_X + TOPIC_WIDTH + 70, y: currentY },
      });
      currentY += 60;
    }
  });

  otherNodes.forEach((other) => {
    if (!layoutedNodes.some((n) => n.id === other.id)) {
      layoutedNodes.push({
        ...other,
        position: { x: SPINE_X, y: currentY },
      });
      currentY += 70;
    }
  });

  // ── 5. Normalize Coordinates so there is clean left/top padding ──
  if (layoutedNodes.length > 0) {
    const minX = Math.min(...layoutedNodes.map((n) => n.position.x));
    const minY = Math.min(...layoutedNodes.map((n) => n.position.y));
    layoutedNodes.forEach((n) => {
      n.position.x = Math.round(n.position.x - minX + 60);
      n.position.y = Math.round(n.position.y - minY + 60);
    });
  }

  // Create lookup for new positions
  const posMap = new Map<string, { x: number; y: number }>();
  layoutedNodes.forEach((n) => posMap.set(n.id, n.position));

  // ── 6. Clean Up and Re-Route Edges Cleanly ──
  const cleanedEdges: Edge[] = [];
  const processedPairs = new Set<string>();

  // 6A. Connect each subtopic directly to its root parent Topic
  parentToSubtopics.forEach((subtopics, parentId) => {
    const parentPos = posMap.get(parentId);
    if (!parentPos) return;

    subtopics.forEach((sub) => {
      const subPos = posMap.get(sub.id);
      if (!subPos) return;

      const isSubtopicOnLeft = subPos.x < parentPos.x;
      const pairKey = `${parentId}->${sub.id}`;
      processedPairs.add(pairKey);

      cleanedEdges.push({
        id: `edge-${parentId}-${sub.id}`,
        source: parentId,
        target: sub.id,
        sourceHandle: isSubtopicOnLeft ? "left" : "right",
        targetHandle: isSubtopicOnLeft ? "right" : "left",
        type: "interactive",
        animated: false,
        style: {
          stroke: "#3b82f6",
          strokeWidth: 2,
          strokeDasharray: "4 4",
        },
      });
    });
  });

  // 6B. Connect spine topics sequentially down the spine
  for (let i = 0; i < sortedMainTopics.length - 1; i++) {
    const curr = sortedMainTopics[i];
    const next = sortedMainTopics[i + 1];
    const pairKey = `${curr.id}->${next.id}`;

    if (!processedPairs.has(pairKey)) {
      processedPairs.add(pairKey);
      cleanedEdges.push({
        id: `spine-${curr.id}-${next.id}`,
        source: curr.id,
        target: next.id,
        sourceHandle: "bottom",
        targetHandle: "top",
        type: "interactive",
        animated: false,
        style: {
          stroke: "#3b82f6",
          strokeWidth: 2.5,
        },
      });
    }
  }

  // 6C. Preserve other non-subtopic custom edges
  edges.forEach((e) => {
    const pairKey = `${e.source}->${e.target}`;
    if (!processedPairs.has(pairKey)) {
      const srcNode = nodeMap.get(e.source);
      const tgtNode = nodeMap.get(e.target);

      if (srcNode && tgtNode) {
        processedPairs.add(pairKey);
        cleanedEdges.push({
          ...e,
          type: "interactive",
          style: e.style || {
            stroke: "#3b82f6",
            strokeWidth: 2,
          },
        });
      }
    }
  });

  return { nodes: layoutedNodes, edges: cleanedEdges };
}
