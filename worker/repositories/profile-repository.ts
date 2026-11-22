import { eq } from 'drizzle-orm'
import type { Profile } from '../../shared/schemas/profile'
import type { TaskTransaction } from '../db/authenticated-transaction'
import { userProfiles } from '../db/schema'

export function createProfileRepository(tx: TaskTransaction, userId: string) {
  const fields = { displayName: userProfiles.displayName }
  return {
    async initialize(): Promise<Profile> {
      await tx.insert(userProfiles).values({ userId }).onConflictDoNothing()
      const [profile] = await tx.select(fields).from(userProfiles).where(eq(userProfiles.userId, userId))
      if (!profile) throw new Error('Profile initialization failed')
      return profile
    },
    async save(profile: Profile): Promise<Profile> {
      const [saved] = await tx.insert(userProfiles).values({ userId, displayName: profile.displayName })
        .onConflictDoUpdate({ target: userProfiles.userId, set: { displayName: profile.displayName } })
        .returning(fields)
      return saved
    },
  }
}
