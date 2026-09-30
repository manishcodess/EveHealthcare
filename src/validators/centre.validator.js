import { z } from 'zod';

export const getCentresQuerySchema = z.object({
  search: z.string().trim().optional(),
  location: z.string().trim().optional(),
  testId: z.string().trim().optional(),
});
