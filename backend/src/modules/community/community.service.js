const communityRepo = require('./community.repository');
const AppError = require('../../utils/AppError');

/**
 * Slugify a string: lowercase, replace spaces with hyphens, strip non-alphanumeric.
 */
const slugify = (str) =>
  str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

const getAllCommunities = async (userId) => {
  return communityRepo.getAllCommunities(userId);
};

const getCommunityById = async (communityId) => {
  const community = await communityRepo.getCommunityById(communityId);
  if (!community) throw new AppError('Community not found', 404);
  return community;
};

const createCommunity = async ({ name, description, creatorId, customSlug }) => {
  const slug = customSlug ? slugify(customSlug) : slugify(name);

  // Ensure slug is unique
  const existing = await communityRepo.getCommunityBySlug(slug);
  if (existing) throw new AppError('A community with this name already exists', 409);

  return communityRepo.createCommunity({ name, slug, description, creatorId });
};

const joinCommunity = async (userId, communityId) => {
  const community = await communityRepo.getCommunityById(communityId);
  if (!community) throw new AppError('Community not found', 404);

  const existing = await communityRepo.getMembership(userId, communityId);
  if (existing) throw new AppError('Already a member', 409);

  return communityRepo.joinCommunity(userId, communityId);
};

const leaveCommunity = async (userId, communityId) => {
  const membership = await communityRepo.getMembership(userId, communityId);
  if (!membership) throw new AppError('You are not a member', 404);
  if (membership.role === 'OWNER') throw new AppError('Owner cannot leave. Delete the community instead.', 400);

  return communityRepo.leaveCommunity(userId, communityId);
};

const getCommunityMessages = async (communityId, userId, limit = 50) => {
  // Verify user is a member
  const membership = await communityRepo.getMembership(userId, communityId);
  if (!membership) throw new AppError('You must join this community to view messages', 403);

  return communityRepo.getCommunityMessages(communityId, limit);
};

module.exports = {
  getAllCommunities,
  getCommunityById,
  createCommunity,
  joinCommunity,
  leaveCommunity,
  getCommunityMessages,
};
