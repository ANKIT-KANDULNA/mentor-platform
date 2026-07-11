const prisma = require('../db/prisma');
const AppError = require('../utils/AppError');

/**
 * Middleware to verify that the logged-in user owns the requested database resource.
 * @param {string} modelName - Prisma model name (camelCase)
 * @param {string} userField - Field in the model storing the owner user ID
 */
const checkOwnership = (modelName, userField = 'userId') => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params.id || req.params.conversationId || req.params.sessionId || req.params.messageId;
      const userId = req.user?.id;

      if (!userId) {
        return next(new AppError('Authentication required', 401));
      }

      if (!resourceId) {
        return next(new AppError('Resource ID parameter is missing', 400));
      }

      const resource = await prisma[modelName].findUnique({
        where: { id: resourceId },
      });

      if (!resource) {
        return next(new AppError('Resource not found', 404));
      }

      // Allow access if user owns it OR if they are an ADMIN
      const isOwner = resource[userField] === userId;
      const isAdmin = req.user?.role === 'ADMIN';

      if (!isOwner && !isAdmin) {
        return next(new AppError('Access denied: You do not own this resource', 403));
      }

      req.resource = resource;
      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = checkOwnership;
