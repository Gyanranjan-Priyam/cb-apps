import type { RoadmapData } from "../../types";

export const gameDevelopmentRoadmap: RoadmapData = {
  id: "game-development",
  slug: "game-development",
  title: "Game Development",
  description: "Complete, all-in-one guide to Game Engineering & 3D Graphics. Master Game Math (Vectors, Quaternions), Physics Simulation (SAT, Rigidbody), Game Engines (Unity C# DOTS, Unreal Engine 5 C++ Nanite/Lumen), Custom Shaders (HLSL/GLSL), Game AI (Behavior Trees, NavMesh), Authoritative Multiplayer Netcode, and Audio without needing external materials.",
  category: "gaming",
  badgeText: "Immersive Track",
  iconName: "Gamepad2",
  version: 2,
  isPublished: true,
  nodes: [
    {
      id: "title-node",
      type: "title",
      position: { x: 550, y: 30 },
      data: { label: "Game Development Roadmap" },
    },
    // 1. Math & Physics for Games
    {
      id: "game-math-physics",
      type: "topic",
      position: { x: 550, y: 120 },
      data: {
        label: "Game Mathematics & Physics Simulation",
        category: "Mathematics",
        description: `### 📐 Vectors, Quaternions & Collision Physics

The computational geometry and kinematic formulas behind 2D and 3D game engines.
`,
        difficulty: "beginner",
        colorKey: "B",
        estimatedHours: 20,
      },
    },
    {
      id: "sub-vectors-quaternions",
      type: "subtopic",
      position: { x: 860, y: 100 },
      data: {
        label: "Vectors, Dot/Cross Products & Quaternions",
        colorKey: "C",
        description: `### 🔄 Quaternions & Gimbal Lock Prevention

- **Euler Angles ($x, y, z$)**: Suffer from **Gimbal Lock** when two rotation axes align, causing loss of a rotational degree of freedom.
- **Quaternions ($q = w + xi + yj + zk$)**: Represent smooth 3D rotations on a 4D unit sphere with seamless spherical linear interpolation (SLERP).
`,
      },
    },
    {
      id: "sub-rigidbody-sat-physics",
      type: "subtopic",
      position: { x: 860, y: 150 },
      data: {
        label: "Rigidbody Dynamics & Separating Axis Theorem (SAT)",
        colorKey: "C",
        description: `### 💥 Separating Axis Theorem (SAT) for Convex Collisions

Two convex shapes do not intersect if and only if there exists a 1D projection axis along which their shadow projections are completely separated!
`,
      },
    },

    // 2. Game Engines: Unity & Unreal Engine
    {
      id: "game-engines-track",
      type: "topic",
      position: { x: 550, y: 320 },
      data: {
        label: "Game Engines: Unity (C#) & Unreal Engine 5 (C++)",
        category: "Engines",
        description: `### 🎮 ECS Architecture, Unreal C++, Nanite & Lumen

Architect high-performance games using industry standard engines.
`,
        difficulty: "intermediate",
        colorKey: "B",
        estimatedHours: 35,
      },
    },
    {
      id: "sub-unity-csharp-dots",
      type: "subtopic",
      position: { x: 240, y: 280 },
      data: {
        label: "Unity: C#, ECS & Data-Oriented Technology Stack (DOTS)",
        colorKey: "C",
        description: `### ⚡ Unity DOTS: Entities, Components & Jobs

\`\`\`csharp
using Unity.Entities;
using Unity.Mathematics;
using Unity.Transforms;

public partial struct MoveSystem : ISystem
{
    public void OnUpdate(ref SystemState state)
    {
        float dt = SystemAPI.Time.DeltaTime;

        // Process 100,000 entities in parallel using SIMD Burst Compiler!
        foreach (var (transform, speed) in SystemAPI.Query<RefRW<LocalTransform>, RefRO<MovementSpeed>>())
        {
            transform.ValueRW.Position += new float3(0, 0, speed.ValueRO.Value * dt);
        }
    }
}
\`\`\`
`,
      },
    },
    {
      id: "sub-unreal5-cpp-nanite",
      type: "subtopic",
      position: { x: 240, y: 330 },
      data: {
        label: "Unreal Engine 5: C++, Nanite & Lumen Lighting",
        colorKey: "C",
        description: `### 🏰 Unreal Engine 5 Next-Gen Technologies

- **Nanite Virtualized Geometry**: Render billions of polygons with automated Level-of-Detail (LOD) streaming per pixel.
- **Lumen**: Fully dynamic real-time global illumination and indirect diffuse reflections.
`,
      },
    },

    // 3. Shaders & Computer Graphics
    {
      id: "shaders-graphics-pipeline",
      type: "topic",
      position: { x: 550, y: 520 },
      data: {
        label: "Shaders, Materials & Graphics Pipelines",
        category: "Graphics",
        description: `### 🎨 HLSL/GLSL Shaders, PBR Materials & Post-Processing

Write GPU vertex and fragment shaders for custom visual effects.
`,
        difficulty: "advanced",
        colorKey: "B",
        estimatedHours: 25,
      },
    },
    {
      id: "sub-hlsl-glsl-pbr",
      type: "subtopic",
      position: { x: 860, y: 480 },
      data: {
        label: "HLSL/GLSL & Physically Based Rendering (PBR)",
        colorKey: "C",
        description: `### 🌈 Custom Fragment Shader Example in GLSL

\`\`\`glsl
#version 330 core
out vec4 FragColor;
in vec2 TexCoords;

uniform sampler2D mainTexture;
uniform vec3 tintColor;

void main() {
    vec4 texColor = texture(mainTexture, TexCoords);
    // Apply grayscale luminance conversion with custom tint
    float gray = dot(texColor.rgb, vec3(0.299, 0.587, 0.114));
    FragColor = vec4(vec3(gray) * tintColor, texColor.a);
}
\`\`\`
`,
      },
    },
    {
      id: "sub-post-processing-vfx",
      type: "subtopic",
      position: { x: 860, y: 530 },
      data: {
        label: "Post-Processing (Bloom, SSAO, SSR) & Niagara VFX",
        colorKey: "C",
        description: `### ✨ Visual Post-Processing Stack

- **Screen Space Ambient Occlusion (SSAO)**: Approximates realistic crevice contact shadows in real time.
- **Bloom & Tonemapping (ACES)**: Converts high dynamic range (HDR) light values to displayable monitor color gamuts.
`,
      },
    },

    // 4. Game AI & Gameplay Systems
    {
      id: "game-ai-systems",
      type: "topic",
      position: { x: 550, y: 720 },
      data: {
        label: "Game AI & Gameplay Programming",
        category: "Gameplay & AI",
        description: `### 🤖 Behavior Trees, NavMesh Pathfinding & State Machines

Program intelligent enemy AI behaviors and boss fight state routines.
`,
        difficulty: "intermediate",
        colorKey: "B",
        estimatedHours: 20,
      },
    },
    {
      id: "sub-behavior-trees-navmesh",
      type: "subtopic",
      position: { x: 240, y: 680 },
      data: {
        label: "Behavior Trees & A* NavMesh Pathfinding",
        colorKey: "C",
        description: `### 🌲 Behavior Tree Execution Nodes

- **Composite Nodes**:
  - **Selector ($?$)**: Returns SUCCESS as soon as one child succeeds (fallback logic).
  - **Sequence ($\\rightarrow$)**: Executes all children in order until one fails.
- **Decorators**: Loop counters, distance checks, cooldown limits.
- **Leaf Tasks**: MoveToTarget, PlayAttackAnimation, FireProjectile.
`,
      },
    },
    {
      id: "sub-gameplay-ability-gas",
      type: "subtopic",
      position: { x: 240, y: 730 },
      data: {
        label: "Gameplay Ability System (GAS) & Inventory",
        colorKey: "C",
        description: `### ⚔️ Modular Gameplay Abilities

Decouple player attributes (Health, Mana, Stamina) from ability activation tags and cooldown timers.
`,
      },
    },

    // 5. Multiplayer Netcode & Networking
    {
      id: "multiplayer-netcode",
      type: "topic",
      position: { x: 550, y: 920 },
      data: {
        label: "Multiplayer Netcode & Client Prediction",
        category: "Multiplayer",
        description: `### 🌐 Authoritative Dedicated Servers & Lag Compensation

Build cheat-proof multiplayer experiences with client prediction and rollback.
`,
        difficulty: "advanced",
        colorKey: "B",
        estimatedHours: 25,
      },
    },
    {
      id: "sub-client-prediction-recon",
      type: "subtopic",
      position: { x: 860, y: 880 },
      data: {
        label: "Client-Side Prediction & Server Reconciliation",
        colorKey: "C",
        description: `### 🏃 Client-Side Prediction Architecture

1. Client presses \`W\` $\\rightarrow$ simulates movement immediately on local screen.
2. Sends \`Input(Tick 104, MoveForward)\` to server.
3. Server simulates authoritative state at Tick 104 and returns \`AuthoritativePosition\`.
4. If local position diverged (e.g. pushed by enemy), client replays inputs from Tick 104 to present (**Reconciliation**).
`,
      },
    },
    {
      id: "sub-lag-compensation-rollback",
      type: "subtopic",
      position: { x: 860, y: 930 },
      data: {
        label: "Lag Compensation & Rollback Netcode (GGPO)",
        colorKey: "C",
        description: `### 🎯 Server Lag Compensation (Hitscan Rewind)

When a player fires a sniper rifle with 80ms ping, the server rewinds hitboxes 80ms into past history to verify if the shot lined up on the shooter's screen!
`,
      },
    },

    // 6. Game Audio & Optimization
    {
      id: "audio-game-optimization",
      type: "topic",
      position: { x: 550, y: 1120 },
      data: {
        label: "Interactive Audio (FMOD) & Profiling",
        category: "Audio & Optimization",
        description: `### 🔊 Spatial Audio, Draw Call Batching & Memory Profiling

Optimize rendering budgets to maintain locked 60/120 FPS.
`,
        difficulty: "advanced",
        colorKey: "B",
        estimatedHours: 18,
      },
    },
    {
      id: "sub-fmod-wwise-audio",
      type: "subtopic",
      position: { x: 240, y: 1080 },
      data: {
        label: "Interactive Audio: FMOD, Wwise & Spatial 3D Audio",
        colorKey: "C",
        description: `### 🎧 Dynamic Audio Parameter Curves

Modulate music tempo and low-pass filter frequencies dynamically based on player health and combat intensity.
`,
      },
    },
    {
      id: "sub-drawcalls-profiling",
      type: "subtopic",
      position: { x: 240, y: 1130 },
      data: {
        label: "Draw Call Batching, Occlusion Culling & Profiling",
        colorKey: "C",
        description: `### ⚡ Frame Budget Optimization

- **Draw Call Reduction**: Combine static meshes into Texture Atlases and use GPU Instancing.
- **Occlusion Culling**: Disable rendering of geometry hidden behind large walls.
`,
      },
    },

    // 7. Milestone
    {
      id: "milestone-game-lead",
      type: "milestone",
      position: { x: 550, y: 1320 },
      data: {
        label: "Certified Game Developer & 3D Engineer",
        category: "Milestone",
        description: `### 🎓 Game Development Mastery Attained!

Congratulations! You have mastered game engineering:
- Game math (Vectors, Quaternions) and SAT collision physics.
- Unity (C# DOTS) and Unreal Engine 5 (C++, Nanite, Lumen).
- GPU shader development (HLSL/GLSL) and PBR materials.
- Game AI (Behavior Trees, A* NavMesh pathfinding).
- Authoritative multiplayer netcode with client prediction and lag compensation.
- FMOD audio design and frame profiling for locked 60+ FPS.
`,
        difficulty: "advanced",
        color: "gold",
        status: "not-started",
      },
    },
  ],
  edges: [
    { id: "e-gd-1", source: "game-math-physics", target: "game-engines-track", type: "interactive" },
    { id: "e-gd-2", source: "game-engines-track", target: "shaders-graphics-pipeline", type: "interactive" },
    { id: "e-gd-3", source: "shaders-graphics-pipeline", target: "game-ai-systems", type: "interactive" },
    { id: "e-gd-4", source: "game-ai-systems", target: "multiplayer-netcode", type: "interactive" },
    { id: "e-gd-5", source: "multiplayer-netcode", target: "audio-game-optimization", type: "interactive" },
    { id: "e-gd-6", source: "audio-game-optimization", target: "milestone-game-lead", type: "interactive" },

    // Subtopics
    { id: "e-gd-sub-1", source: "game-math-physics", target: "sub-vectors-quaternions" },
    { id: "e-gd-sub-2", source: "game-math-physics", target: "sub-rigidbody-sat-physics" },

    { id: "e-gd-sub-3", source: "game-engines-track", target: "sub-unity-csharp-dots" },
    { id: "e-gd-sub-4", source: "game-engines-track", target: "sub-unreal5-cpp-nanite" },

    { id: "e-gd-sub-5", source: "shaders-graphics-pipeline", target: "sub-hlsl-glsl-pbr" },
    { id: "e-gd-sub-6", source: "shaders-graphics-pipeline", target: "sub-post-processing-vfx" },

    { id: "e-gd-sub-7", source: "game-ai-systems", target: "sub-behavior-trees-navmesh" },
    { id: "e-gd-sub-8", source: "game-ai-systems", target: "sub-gameplay-ability-gas" },

    { id: "e-gd-sub-9", source: "multiplayer-netcode", target: "sub-client-prediction-recon" },
    { id: "e-gd-sub-10", source: "multiplayer-netcode", target: "sub-lag-compensation-rollback" },

    { id: "e-gd-sub-11", source: "audio-game-optimization", target: "sub-fmod-wwise-audio" },
    { id: "e-gd-sub-12", source: "audio-game-optimization", target: "sub-drawcalls-profiling" },
  ],
};
