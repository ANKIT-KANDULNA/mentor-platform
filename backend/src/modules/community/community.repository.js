const prisma = require('../../db/prisma');

/**
 * List all public communities with member count + isMember flag for a given user.
 */
const getAllCommunities = async (userId) => {
  const communities = await prisma.community.findMany({
    where: { isPublic: true },
    orderBy: { createdAt: 'asc' },
    include: {
      creator: { select: { id: true, fullName: true, role: true } },
      _count: { select: { members: true, messages: true } },
      members: {
        where: { userId },
        select: { userId: true, role: true },
      },
    },
  });

  // Flatten: attach isMember and memberRole, remove the members array
  return communities.map((c) => ({
    ...c,
    isMember: c.members.length > 0,
    memberRole: c.members[0]?.role || null,
    members: undefined,
  }));
};

/**
 * Get a single community by id, including members list.
 */
const getCommunityById = async (communityId) => {
  return prisma.community.findUnique({
    where: { id: communityId },
    include: {
      creator: { select: { id: true, fullName: true, role: true } },
      members: {
        include: {
          user: { select: { id: true, fullName: true, role: true } },
        },
        orderBy: { joinedAt: 'asc' },
      },
      _count: { select: { members: true, messages: true } },
    },
  });
};

/**
 * Get community by slug.
 */
const getCommunityBySlug = async (slug) => {
  return prisma.community.findUnique({ where: { slug } });
};

/**
 * Create a new community and auto-add creator as OWNER member.
 */
const createCommunity = async ({ name, slug, description, creatorId }) => {
  return prisma.$transaction(async (tx) => {
    const community = await tx.community.create({
      data: { name, slug, description, creatorId },
    });

    await tx.communityMember.create({
      data: {
        communityId: community.id,
        userId: creatorId,
        role: 'OWNER',
      },
    });

    return tx.community.findUnique({
      where: { id: community.id },
      include: {
        creator: { select: { id: true, fullName: true, role: true } },
        _count: { select: { members: true, messages: true } },
      },
    });
  });
};

/**
 * Check if a user is already a member of a community.
 */
const getMembership = async (userId, communityId) => {
  return prisma.communityMember.findUnique({
    where: { userId_communityId: { userId, communityId } },
  });
};

/**
 * Add a user as a MEMBER to a community.
 */
const joinCommunity = async (userId, communityId) => {
  return prisma.communityMember.create({
    data: { userId, communityId, role: 'MEMBER' },
  });
};

/**
 * Remove a user from a community.
 */
const leaveCommunity = async (userId, communityId) => {
  return prisma.communityMember.delete({
    where: { userId_communityId: { userId, communityId } },
  });
};

/**
 * Get paginated messages for a community.
 */
const getCommunityMessages = async (communityId, limit = 50) => {
  const messages = await prisma.communityMessage.findMany({
    where: { communityId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      sender: { select: { id: true, fullName: true, role: true } },
    },
  });
  return messages.reverse();
};

/**
 * Save a new community message.
 */
const createCommunityMessage = async ({ communityId, senderId, content }) => {
  return prisma.communityMessage.create({
    data: { communityId, senderId, content },
    include: {
      sender: { select: { id: true, fullName: true, role: true } },
    },
  });
};

module.exports = {
  getAllCommunities,
  getCommunityById,
  getCommunityBySlug,
  createCommunity,
  getMembership,
  joinCommunity,
  leaveCommunity,
  getCommunityMessages,
  createCommunityMessage,
};
