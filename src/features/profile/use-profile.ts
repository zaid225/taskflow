import { useAuth } from '@clerk/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { profileSchema, updateProfileSchema, type Profile } from '../../../shared/schemas/profile'

const profileKey = ['profile'] as const

async function requestProfile(getToken: () => Promise<string | null>, options: RequestInit): Promise<Profile> {
  const token = await getToken()
  if (!token) throw new Error('Your session has ended. Sign in to access your profile.')
  const headers = new Headers(options.headers)
  headers.set('Authorization', `Bearer ${token}`)
  const response = await fetch('/api/v1/profile', { ...options, headers })
  if (response.status === 401) throw new Error('Your session has ended. Sign in to access your profile.')
  if (response.status === 503) throw new Error('Profile storage is temporarily unavailable.')
  if (!response.ok) throw new Error('TaskFlow could not access your profile. Try again.')
  const payload = await response.json()
  return profileSchema.parse(payload?.data)
}

export function useProfile() {
  const { getToken } = useAuth()
  return useQuery({
    queryKey: profileKey,
    queryFn: ({ signal }) => requestProfile(getToken, { method: 'POST', signal }),
    staleTime: Infinity,
  })
}

export function ProfileBootstrap() {
  useProfile()
  return null
}

export function useSaveProfile() {
  const { getToken } = useAuth()
  const client = useQueryClient()
  return useMutation({
    mutationFn: (profile: Profile) => requestProfile(getToken, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateProfileSchema.parse(profile)),
    }),
    onSuccess: (profile) => { client.setQueryData(profileKey, profile) },
  })
}
