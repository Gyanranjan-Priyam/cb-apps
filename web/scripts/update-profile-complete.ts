import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const prisma = new PrismaClient({
  adapter: new PrismaPg(process.env.DATABASE_URL!),
});

async function updateProfileComplete() {
  try {
    console.log('Starting profile complete update...');

    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        mobileNumber: true,
        aadhaarNumber: true,
        state: true,
        district: true,
        role: true,
        profileComplete: true,
      },
    });

    console.log(`Found ${users.length} users to check`);

    let updatedCount = 0;

    for (const user of users) {
      // Check if profile should be complete
      const shouldBeComplete = !!(
        user.name &&
        user.email &&
        user.mobileNumber &&
        user.aadhaarNumber &&
        user.state &&
        user.district
      );

      // Update if the flag doesn't match or if user is admin
      if (user.profileComplete !== shouldBeComplete || user.role === 'admin') {
        await prisma.user.update({
          where: { id: user.id },
          data: { 
            profileComplete: user.role === 'admin' ? true : shouldBeComplete 
          },
        });

        updatedCount++;
        console.log(`Updated user ${user.email}: profileComplete = ${user.role === 'admin' ? true : shouldBeComplete}`);
      }
    }

    console.log(`\nUpdate complete! Updated ${updatedCount} user(s).`);
  } catch (error) {
    console.error('Error updating profile complete:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateProfileComplete();
