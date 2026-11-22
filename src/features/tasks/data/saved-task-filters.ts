import { z } from 'zod'
import { taskQuerySchema } from '../../../../shared/schemas/tasks'

const savedFilter = z.object({ name: z.string().trim().min(1).max(40), query: taskQuerySchema })
export type SavedTaskFilter = z.infer<typeof savedFilter>
export const savedFilterLimit = 20

export function parseSavedTaskFilters(raw: string | null) {
  try {
    const result: unknown = JSON.parse(raw ?? '[]')
    if (!Array.isArray(result)) return []
    return result.slice(0, savedFilterLimit).flatMap(item => {
      const parsed = savedFilter.safeParse(item)
      return parsed.success ? [parsed.data] : []
    })
  } catch {
    return []
  }
}
