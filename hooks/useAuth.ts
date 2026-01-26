/**
 * 인증 상태 관리 훅
 */

'use client'

import { useSession } from 'next-auth/react'

export function useAuth() {
  const { data: session, status, update } = useSession()

  return {
    user: session?.user ?? null,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
    error: status === 'unauthenticated' ? '인증되지 않았습니다' : null,
  }
}
