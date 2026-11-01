import { prisma } from '../lib/db';

async function initializeRegistrationSetting() {
  try {
    // Check if the setting already exists
    const existingSetting = await prisma.systemSettings.findUnique({
      where: { key: 'registration_enabled' }
    });

    if (existingSetting) {
      console.log('Registration setting already exists:', existingSetting);
      return;
    }

    // Create the default registration setting
    const setting = await prisma.systemSettings.create({
      data: {
        key: 'registration_enabled',
        value: 'true',
        description: 'Controls whether user registration is enabled or disabled'
      }
    });

    console.log('Registration setting created:', setting);
  } catch (error) {
    console.error('Error initializing registration setting:', error);
  } finally {
    await prisma.$disconnect();
  }
}

initializeRegistrationSetting();