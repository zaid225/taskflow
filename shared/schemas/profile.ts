import { z } from 'zod'

export const updateProfileSchema = z.strictObject({
  displayName: z.string().trim().min(2, 'Enter at least 2 characters, or leave it blank.').max(80).nullable(),
})

// Profiles saved before the two-character minimum are still readable.
export const profileSchema = z.strictObject({ displayName: z.string().max(80).nullable() })

export type Profile = z.infer<typeof profileSchema>
