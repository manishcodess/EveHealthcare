import { z } from 'zod';

export const getTestsQuerySchema = z.object({
  search: z.string().trim().optional(),
  centreId: z.string().trim().optional(),
});
