/* eslint-disable @typescript-eslint/no-explicit-any */
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { DEFAULT_ROADMAPS } from "../lib/roadmaps/data/default-tracks";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const isProdFlag =
  process.argv.includes("--prod") ||
  process.argv.includes("--production") ||
  process.env.NODE_ENV === "production";

// Load appropriate env files
if (isProdFlag) {
  dotenv.config({ path: path.join(projectRoot, ".env.production") });
  dotenv.config({ path: path.join(projectRoot, ".env.production.local") });
}
dotenv.config({ path: path.join(projectRoot, ".env.local") });
dotenv.config({ path: path.join(projectRoot, ".env.production") });

const rawDbUrl = process.env.DATABASE_URL || "";
// Mask password in DB URL for safe logging
const maskedDbUrl = rawDbUrl.replace(/:\/\/(.*?):(.*?)@/, "://$1:******@");

const prisma = new PrismaClient({
  adapter: new PrismaPg(rawDbUrl),
});

async function seedRoadmaps() {
  console.log("========================================");
  console.log(`[seed-roadmaps] Target Env: ${isProdFlag ? "PRODUCTION" : "LOCAL / STAGING"}`);
  console.log(`[seed-roadmaps] Database URL: ${maskedDbUrl || "Not Set"}`);
  console.log(`[seed-roadmaps] Seeding ${DEFAULT_ROADMAPS.length} domain roadmaps...`);
  console.log("========================================");

  let successCount = 0;

  for (const r of DEFAULT_ROADMAPS) {
    try {
      const nodesJson = JSON.stringify(r.nodes);
      const edgesJson = JSON.stringify(r.edges);

      const record = await prisma.roadmap.upsert({
        where: { slug: r.slug },
        update: {
          title: r.title,
          description: r.description,
          category: r.category,
          badgeText: r.badgeText || "Core Track",
          iconName: r.iconName || "Compass",
          nodesJson,
          edgesJson,
          isPublished: true,
          version: { increment: 1 },
        },
        create: {
          id: r.id,
          slug: r.slug,
          title: r.title,
          description: r.description,
          category: r.category,
          badgeText: r.badgeText || "Core Track",
          iconName: r.iconName || "Compass",
          nodesJson,
          edgesJson,
          isPublished: true,
          version: 1,
        },
      });

      console.log(`[✓] Seeded: ${record.title} (${record.slug}) - ${r.nodes.length} nodes, ${r.edges.length} edges`);
      successCount++;
    } catch (err: any) {
      console.error(`[!] Failed to seed "${r.title}":`, err.message);
    }
  }

  console.log("========================================");
  console.log(`[seed-roadmaps] Completed: Successfully pushed ${successCount}/${DEFAULT_ROADMAPS.length} roadmaps to database.`);
  console.log("========================================");
}

seedRoadmaps()
  .catch((e) => {
    console.error("Fatal error during roadmap seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
