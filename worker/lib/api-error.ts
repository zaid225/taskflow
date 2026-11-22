import type { ZodError } from 'zod'
import type { ApiError } from '../../shared/schemas/tasks'

export class RequestError extends Error {
  constructor(
    public readonly status: 400 | 401 | 404 | 409 | 413 | 415 | 503,
    public readonly code: string,
    message: string,
    public readonly issues?: NonNullable<ApiError['error']['issues']>,
  ) {
    super(message)
  }

  toJSON(): ApiError {
    return { error: { code: this.code, message: this.message, issues: this.issues } }
  }
}

export function invalidInput(error: ZodError) {
  return new RequestError(400, 'INVALID_INPUT', 'Check the supplied fields.', error.issues.map((issue) => ({
    field: issue.path.map(String).join('.'),
    message: issue.message,
  })))
}

export function taskNotFound() {
  return new RequestError(404, 'TASK_NOT_FOUND', 'Task not found.')
}

export function unauthenticated() {
  return new RequestError(401, 'UNAUTHENTICATED', 'Sign in to access your tasks.')
}
