import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg(process.env.DATABASE_URL!),
});

async function generateCbUserId(): Promise<string> {
  for (let attempt = 0; attempt < 50; attempt++) {
    const randomDigits = Math.floor(100000 + Math.random() * 900000).toString();
    const candidateId = `GCEK-CB-${randomDigits}`;
    const existing = await prisma.user.findUnique({
      where: { cbUserId: candidateId },
      select: { id: true },
    });
    if (!existing) {
      return candidateId;
    }
  }
  throw new Error("Failed to generate unique CB User ID");
}

async function main() {
  console.log("Starting auto-generation of CB User IDs (format: GCEK-CB-XXXXXX)...");

  const usersToUpdate = await prisma.user.findMany({
    where: {
      OR: [
        { cbUserId: null },
        { cbUserId: { not: { startsWith: "GCEK-CB-" } } },
      ],
    },
    select: {
      id: true,
      name: true,
      email: true,
      cbUserId: true,
    },
  });

  console.log(`Found ${usersToUpdate.length} users requiring CB User ID update/generation.`);

  for (const user of usersToUpdate) {
    const newCbUserId = await generateCbUserId();
    await prisma.user.update({
      where: { id: user.id },
      data: { cbUserId: newCbUserId },
    });
    console.log(`Updated user: ${user.name} (${user.email}) -> Old ID: ${user.cbUserId || 'None'} | New ID: ${newCbUserId}`);
  }

  console.log("Finished updating all users!");
}

main()
  .catch((e) => {
    console.error("Error generating CB User IDs:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
