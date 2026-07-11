const { z } = require('zod');

const createSessionSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100),
  description: z.string().max(500).optional().nullable(),
  type: z.enum(['ONE_TO_ONE', 'ONE_TO_MANY']),
  scheduledAt: z.string().datetime({ message: 'Invalid ISO scheduled date format' }),
  maxParticipants: z.number().int().min(1).max(100).optional().default(1),
  mentorProfileId: z.string().uuid('Invalid mentor profile ID'),
});

const updateSessionSchema = createSessionSchema.partial().extend({
  status: z.enum(['SCHEDULED', 'LIVE', 'COMPLETED', 'CANCELLED']).optional(),
});

module.exports = {
  createSessionSchema,
  updateSessionSchema,
};
