const communityService = require('./community.service');
const asyncHandler = require('../../utils/asyncHandler');
const { sendSuccess } = require('../../utils/response');

const getAllCommunities = asyncHandler(async (req, res) => {
  const communities = await communityService.getAllCommunities(req.user.id);
  sendSuccess(res, communities, 200);
});

const getCommunityById = asyncHandler(async (req, res) => {
  const community = await communityService.getCommunityById(req.params.communityId);
  sendSuccess(res, community, 200);
});

const createCommunity = asyncHandler(async (req, res) => {
  const { name, description, slug: customSlug } = req.body;
  const community = await communityService.createCommunity({
    name,
    description,
    customSlug,
    creatorId: req.user.id,
  });
  sendSuccess(res, community, 201, 'Community created');
});

const joinCommunity = asyncHandler(async (req, res) => {
  const result = await communityService.joinCommunity(req.user.id, req.params.communityId);
  sendSuccess(res, result, 200, 'Joined community');
});

const leaveCommunity = asyncHandler(async (req, res) => {
  await communityService.leaveCommunity(req.user.id, req.params.communityId);
  sendSuccess(res, null, 200, 'Left community');
});

const getCommunityMessages = asyncHandler(async (req, res) => {
  const { limit = 50 } = req.query;
  const messages = await communityService.getCommunityMessages(
    req.params.communityId,
    req.user.id,
    +limit
  );
  sendSuccess(res, messages, 200);
});

module.exports = {
  getAllCommunities,
  getCommunityById,
  createCommunity,
  joinCommunity,
  leaveCommunity,
  getCommunityMessages,
};
