import { prisma } from '../lib/db';

async function createAdminUser() {
  try {
    // Check if admin user already exists
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'admin' }
    });

    if (existingAdmin) {
      console.log('Admin user already exists:', existingAdmin.email);
      return;
    }

    // Create a test admin user
    const adminUser = await prisma.user.create({
      data: {
        id: 'admin-test-user',
        name: 'Test Admin',
        email: 'admin@test.com',
        emailVerified: true,
        role: 'admin',
        profileComplete: true, // Admins don't need to complete onboarding
      }
    });

    console.log('Created admin user:', adminUser);
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();