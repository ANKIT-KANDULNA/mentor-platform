const prisma = require('../../db/prisma');

const getUserById = async (id) => {
  return prisma.user.findUnique({
    where: { id },
    include: {
      settings: true,
      studentProfile: true,
      mentorProfile: true,
    },
  });
};

const updateUser = async (id, data) => {
  return prisma.user.update({
    where: { id },
    data,
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });
};

const updateStudentProfile = async (userId, data) => {
  return prisma.studentProfile.update({
    where: { userId },
    data,
  });
};

const updateUserSettings = async (userId, data) => {
  return prisma.userSettings.update({
    where: { userId },
    data,
  });
};

const softDeleteUser = async (id) => {
  return prisma.user.update({
    where: { id },
    data: {
      isActive: false,
      deletedAt: new Date(),
    },
  });
};

module.exports = {
  getUserById,
  updateUser,
  updateStudentProfile,
  updateUserSettings,
  softDeleteUser,
};
