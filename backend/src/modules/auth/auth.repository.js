const prisma = require('../../db/prisma');

const findUserByEmail = async (email) => {
  return prisma.user.findUnique({ where: { email } });
};

const findUserById = async (id) => {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true, fullName: true, email: true,
      role: true, isVerified: true, isActive: true,
      createdAt: true,
    },
  });
};

const createUser = async (data) => {
  return prisma.user.create({
    data,
    select: {
      id: true, fullName: true, email: true, role: true,
    },
  });
};

const createUserWithProfile = async (userData) => {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        fullName: userData.fullName,
        email: userData.email,
        passwordHash: userData.passwordHash,
        role: userData.role,
      },
    });

    // Create settings
    await tx.userSettings.create({ data: { userId: user.id } });

    // Create profile based on role
    if (userData.role === 'MENTOR') {
      await tx.mentorProfile.create({
        data: {
          userId: user.id,
          collegeName: '',
          branch: '',
          graduationYear: new Date().getFullYear(),
        },
      });
    } else {
      await tx.studentProfile.create({ data: { userId: user.id } });
    }

    return user;
  });
};

const saveRefreshToken = async (userId, token, expiresAt) => {
  return prisma.refreshToken.create({
    data: { userId, token, expiresAt },
  });
};

const findRefreshToken = async (token) => {
  return prisma.refreshToken.findUnique({ where: { token } });
};

const revokeRefreshToken = async (token) => {
  return prisma.refreshToken.update({
    where: { token },
    data: { isRevoked: true },
  });
};

const revokeAllUserTokens = async (userId) => {
  return prisma.refreshToken.updateMany({
    where: { userId, isRevoked: false },
    data: { isRevoked: true },
  });
};

module.exports = {
  findUserByEmail,
  findUserById,
  createUser,
  createUserWithProfile,
  saveRefreshToken,
  findRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
};