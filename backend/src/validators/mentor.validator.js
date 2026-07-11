const { z } = require('zod');

const updateMentorProfileSchema = z.object({
  collegeName: z.string().min(2, 'College name must be at least 2 characters').optional(),
  branch: z.string().min(2, 'Branch must be at least 2 characters').optional(),
  graduationYear: z.coerce.number().int().min(1900).max(new Date().getFullYear() + 10).optional(),
  bio: z.string().max(1000, 'Bio must be under 1000 characters').nullable().optional(),
  headline: z.string().max(150, 'Headline must be under 150 characters').nullable().optional(),
  expertiseTags: z.array(z.string()).optional(),
  linkedinUrl: z.string().url('Invalid LinkedIn URL').nullable().optional().or(z.literal('')),
  hourlyRate: z.coerce.number().int().nonnegative('Hourly rate must be a non-negative number').nullable().optional(),
  isAvailable: z.boolean().optional(),
});

module.exports = {
  updateMentorProfileSchema,
};
