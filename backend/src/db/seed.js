const prisma = require('./prisma');

const seedDefaultCommunity = async () => {
  try {
    const slug = 'general';
    const existing = await prisma.community.findUnique({
      where: { slug },
    });

    if (existing) {
      return;
    }

    // Find the first user in the database to use as creator
    const firstUser = await prisma.user.findFirst({
      orderBy: { createdAt: 'asc' },
    });

    if (!firstUser) {
      console.log('ℹ️ No users found in database. Seeding of "General" community will occur on next startup once a user exists.');
      return;
    }

    await prisma.$transaction(async (tx) => {
      const community = await tx.community.create({
        data: {
          name: 'General',
          slug,
          description: 'General community for all mentors and students',
          creatorId: firstUser.id,
          isPublic: true,
        },
      });

      await tx.communityMember.create({
        data: {
          communityId: community.id,
          userId: firstUser.id,
          role: 'OWNER',
        },
      });
      console.log(`✅ Default "General" community seeded successfully (Creator: ${firstUser.fullName})`);
    });
  } catch (error) {
    console.error('❌ Error seeding default community:', error);
  }
};

module.exports = { seedDefaultCommunity };
