import { z } from 'zod'

export const updateProfileSchema = z.strictObject({
  displayName: z.string().trim().min(1).max(80).nullable(),
})

export type Profile = z.infer<typeof updateProfileSchema>
