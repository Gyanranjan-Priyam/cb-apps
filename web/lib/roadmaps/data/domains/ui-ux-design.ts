import type { RoadmapData } from "../../types";

export const uiUxDesignRoadmap: RoadmapData = {
  id: "ui-ux-design",
  slug: "ui-ux-design",
  title: "UI/UX Design",
  description: "Complete, all-in-one guide to UI/UX & Product Design. Master Design Thinking, Qualitative User Research & Empathy Maps, Wireframing & Information Architecture, Advanced Figma (Auto-Layout 5.0, Component Sets, Variables), Modular Typography & 60-30-10 Color Harmonies, Atomic Design Systems, and Usability Testing without needing external materials.",
  category: "design",
  badgeText: "Creative Track",
  iconName: "Palette",
  version: 2,
  isPublished: true,
  nodes: [
    {
      id: "title-node",
      type: "title",
      position: { x: 550, y: 30 },
      data: { label: "UI/UX Design Roadmap" },
    },
    // 1. UX Research & Design Thinking
    {
      id: "ux-research-thinking",
      type: "topic",
      position: { x: 550, y: 120 },
      data: {
        label: "Design Thinking & User Research",
        category: "UX Research",
        description: `### 🎨 Double Diamond Design Process & User Research

Understand user pain points, synthesize qualitative research, and validate product problem spaces.
`,
        difficulty: "beginner",
        colorKey: "B",
        estimatedHours: 14,
      },
    },
    {
      id: "sub-user-research-methods",
      type: "subtopic",
      position: { x: 860, y: 100 },
      data: {
        label: "User Interviews, Surveys & Competitive Audits",
        colorKey: "C",
        description: `### 🎙️ The Art of Non-Biased User Interviews

- Ask about past behavior rather than hypothetical futures (e.g., "Tell me about the last time you completed a coding task" vs "Would you use an automated task checker?").
- Nielsen's 10 Usability Heuristics: Visibility of system status, Match between system and real world, User control and freedom, Consistency and standards, Error prevention.
`,
      },
    },
    {
      id: "sub-personas-journey-maps",
      type: "subtopic",
      position: { x: 860, y: 150 },
      data: {
        label: "User Personas & Customer Journey Mapping",
        colorKey: "C",
        description: `### 🗺️ Customer Journey Mapping Framework

1. **Stages**: Discovery $\\rightarrow$ Onboarding $\\rightarrow$ Learning $\\rightarrow$ Quiz Execution $\\rightarrow$ Reward Claim.
2. **User Actions**: What the user does at each touchpoint.
3. **Emotional Curve**: High points (joy/success) vs Low dips (confusion/errors).
4. **Opportunities**: UX interventions to eliminate friction.
`,
      },
    },

    // 2. Information Architecture & Wireframing
    {
      id: "ia-wireframing",
      type: "topic",
      position: { x: 550, y: 320 },
      data: {
        label: "Information Architecture & Wireframing",
        category: "UX Design",
        description: `### 📐 Sitemaps, User Flows & Low-Fidelity Wireframes

Structure navigation hierarchies and iterate rapidly on layout concepts.
`,
        difficulty: "beginner",
        colorKey: "B",
        estimatedHours: 12,
      },
    },
    {
      id: "sub-user-flows-ia",
      type: "subtopic",
      position: { x: 240, y: 280 },
      data: {
        label: "User Flows & Sitemap Navigation Architecture",
        colorKey: "C",
        description: `### 🔀 User Flow Diagrams

Map decision nodes, validation loops, and success confirmations before designing screens.
`,
      },
    },
    {
      id: "sub-lofi-wireframing",
      type: "subtopic",
      position: { x: 240, y: 330 },
      data: {
        label: "Low-Fidelity Wireframes & Rapid Prototyping",
        colorKey: "C",
        description: `### ✏️ Grayscale Wireframe Principles

- Use strict 8pt grid spacing.
- Zero color palette (shades of gray only) to prevent stakeholders from getting distracted by colors.
- Clear visual hierarchy: Main Action CTA > Secondary Action > Informational Body.
`,
      },
    },

    // 3. Figma Mastery & Component Architecture
    {
      id: "figma-mastery",
      type: "topic",
      position: { x: 550, y: 520 },
      data: {
        label: "Figma Mastery & Advanced Prototyping",
        category: "UI Design",
        description: `### 💎 Auto-Layout 5.0, Component Sets & Figma Variables

Master the industry standard collaborative design tool.
`,
        difficulty: "intermediate",
        colorKey: "B",
        estimatedHours: 20,
      },
    },
    {
      id: "sub-auto-layout-variants",
      type: "subtopic",
      position: { x: 860, y: 480 },
      data: {
        label: "Auto-Layout, Responsive Resizing & Component Sets",
        colorKey: "C",
        description: `### 📐 Auto-Layout Responsive Rules in Figma

- **Fill Container**: Replaces CSS \`flex-grow: 1; width: 100%\`.
- **Hug Contents**: Replaces CSS \`width: fit-content\`.
- **Fixed Width/Height**: Absolute dimensions in pixels.
- Min / Max Width constraints for realistic responsive previewing.
`,
      },
    },
    {
      id: "sub-figma-variables-proto",
      type: "subtopic",
      position: { x: 860, y: 530 },
      data: {
        label: "Figma Variables, Token Modes & Smart Animate",
        colorKey: "C",
        description: `### 🎨 Figma Variables & Modes (Dark / Light Theme)

- Color Variables with **Modes** (Light Mode / Dark Mode). Switching mode on a frame instantly updates all nested component colors!
- Number variables bound to border radius and spacing tokens.
`,
      },
    },

    // 4. Visual Design: Typography & Color Theory
    {
      id: "visual-design-foundations",
      type: "topic",
      position: { x: 550, y: 720 },
      data: {
        label: "Visual Design: Typography & Color Systems",
        category: "Visual Design",
        description: `### 🎨 Modular Typography Scales & 60-30-10 Color Harmonies

Craft aesthetic, balanced, readable user interfaces.
`,
        difficulty: "intermediate",
        colorKey: "B",
        estimatedHours: 15,
      },
    },
    {
      id: "sub-typography-modular-scale",
      type: "subtopic",
      position: { x: 240, y: 680 },
      data: {
        label: "Modular Typography Scales, Line Heights & Pairing",
        colorKey: "C",
        description: `### 🔤 Modular Scale (1.250 Major Third)

- **Display (H1)**: 38px / 48px line-height (700 Bold).
- **Title (H2)**: 30px / 38px line-height (600 SemiBold).
- **Heading (H3)**: 24px / 32px line-height (600 SemiBold).
- **Body Large**: 18px / 28px line-height (400 Regular).
- **Body Normal**: 15px / 24px line-height (400 Regular).
- **Caption / Tiny**: 12px / 16px line-height (500 Medium).
`,
      },
    },
    {
      id: "sub-color-harmony-a11y",
      type: "subtopic",
      position: { x: 240, y: 730 },
      data: {
        label: "Color Systems: 60-30-10 Rule & WCAG Contrast",
        colorKey: "C",
        description: `### 🎨 The 60-30-10 Rule in UI Design

- **60% Dominant Background**: Neutral canvas (white, light gray, or dark slate).
- **30% Secondary Structure**: Surface cards, navigation bars, sidebars, borders.
- **10% Accent Accent Color**: Primary buttons, active tabs, notification badges.
- **WCAG AA Compliance**: 4.5:1 minimum contrast ratio for body text against backgrounds.
`,
      },
    },

    // 5. Design Systems & Tokens
    {
      id: "design-systems-tokens",
      type: "topic",
      position: { x: 550, y: 920 },
      data: {
        label: "Design Systems & Design Tokens",
        category: "Design Systems",
        description: `### 🧩 Atomic Design & Developer Handoff

Build scalable design systems that synchronize effortlessly with code.
`,
        difficulty: "advanced",
        colorKey: "B",
        estimatedHours: 18,
      },
    },
    {
      id: "sub-atomic-design",
      type: "subtopic",
      position: { x: 860, y: 880 },
      data: {
        label: "Atomic Design Methodology (Brad Frost)",
        colorKey: "C",
        description: `### ⚛️ Atomic Design Hierarchy

- **Atoms**: Icons, Buttons, Inputs, Avatars, Badges.
- **Molecules**: Search Input with Icon & Submit Button.
- **Organisms**: Complete Navigation Bar, Student Profile Card.
- **Templates**: Page layouts with wireframe slots.
- **Pages**: Final screens filled with real dynamic data.
`,
      },
    },
    {
      id: "sub-dev-handoff-tokens",
      type: "subtopic",
      position: { x: 860, y: 930 },
      data: {
        label: "W3C Design Tokens & Figma Dev Mode Handoff",
        colorKey: "C",
        description: `### 🤝 Developer Handoff

Export design tokens into JSON format matching Tailwind CSS config and CSS variables.
`,
      },
    },

    // 6. Usability Testing & Analytics
    {
      id: "usability-testing-analytics",
      type: "topic",
      position: { x: 550, y: 1120 },
      data: {
        label: "Usability Testing & Product Analytics",
        category: "Validation",
        description: `### 🔬 Moderated Testing, Heatmaps & User Analytics

Validate prototypes with real users and measure conversion funnels.
`,
        difficulty: "intermediate",
        colorKey: "B",
        estimatedHours: 14,
      },
    },
    {
      id: "sub-usability-testing-proto",
      type: "subtopic",
      position: { x: 240, y: 1080 },
      data: {
        label: "Moderated vs Unmoderated Usability Testing",
        colorKey: "C",
        description: `### 🧪 Think-Aloud Usability Testing Protocol

1. Provide user with a realistic goal ("Find the Web Development roadmap and start the first topic").
2. Ask user to vocalize thoughts aloud without giving prompts or guidance.
3. Record task completion rate, mis-clicks, and time-to-completion.
`,
      },
    },
    {
      id: "sub-heatmaps-funnels",
      type: "subtopic",
      position: { x: 240, y: 1130 },
      data: {
        label: "Heatmaps (Hotjar), Session Replays & Funnels",
        colorKey: "C",
        description: `### 📊 Heatmap Analytics

- **Click Heatmaps**: Detect dead clicks on unclickable text.
- **Scroll Heatmaps**: Identify where 50% of users drop off before seeing the call-to-action.
`,
      },
    },

    // 7. Milestone
    {
      id: "milestone-product-designer",
      type: "milestone",
      position: { x: 550, y: 1320 },
      data: {
        label: "Certified Product & UI/UX Designer",
        category: "Milestone",
        description: `### 🎓 Product Design & UI/UX Mastery Attained!

Congratulations! You have mastered the entire design lifecycle:
- User research methodologies, personas, and customer journey maps.
- Information architecture, sitemaps, and low-fidelity wireframing.
- Figma mastery: Auto-Layout 5.0, component sets, and interactive variables.
- Visual foundations: Typography modular scales, color harmonies, and WCAG accessibility.
- Design systems, design tokens, and developer handoff workflows.
- Usability testing and quantitative product behavior analytics.
`,
        difficulty: "advanced",
        color: "gold",
        status: "not-started",
      },
    },
  ],
  edges: [
    { id: "e-ui-1", source: "ux-research-thinking", target: "ia-wireframing", type: "interactive" },
    { id: "e-ui-2", source: "ia-wireframing", target: "figma-mastery", type: "interactive" },
    { id: "e-ui-3", source: "figma-mastery", target: "visual-design-foundations", type: "interactive" },
    { id: "e-ui-4", source: "visual-design-foundations", target: "design-systems-tokens", type: "interactive" },
    { id: "e-ui-5", source: "design-systems-tokens", target: "usability-testing-analytics", type: "interactive" },
    { id: "e-ui-6", source: "usability-testing-analytics", target: "milestone-product-designer", type: "interactive" },

    // Subtopics
    { id: "e-ui-sub-1", source: "ux-research-thinking", target: "sub-user-research-methods" },
    { id: "e-ui-sub-2", source: "ux-research-thinking", target: "sub-personas-journey-maps" },

    { id: "e-ui-sub-3", source: "ia-wireframing", target: "sub-user-flows-ia" },
    { id: "e-ui-sub-4", source: "ia-wireframing", target: "sub-lofi-wireframing" },

    { id: "e-ui-sub-5", source: "figma-mastery", target: "sub-auto-layout-variants" },
    { id: "e-ui-sub-6", source: "figma-mastery", target: "sub-figma-variables-proto" },

    { id: "e-ui-sub-7", source: "visual-design-foundations", target: "sub-typography-modular-scale" },
    { id: "e-ui-sub-8", source: "visual-design-foundations", target: "sub-color-harmony-a11y" },

    { id: "e-ui-sub-9", source: "design-systems-tokens", target: "sub-atomic-design" },
    { id: "e-ui-sub-10", source: "design-systems-tokens", target: "sub-dev-handoff-tokens" },

    { id: "e-ui-sub-11", source: "usability-testing-analytics", target: "sub-usability-testing-proto" },
    { id: "e-ui-sub-12", source: "usability-testing-analytics", target: "sub-heatmaps-funnels" },
  ],
};
