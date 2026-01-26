/**
 * 로그인 페이지
 *
 * Google OAuth 2.0 로그인
 */

'use client'

import { Suspense } from 'react'
import { useEffect } from 'react'
import { signIn } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { LogOut } from 'lucide-react'

function LoginPageContent() {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'
  const error = searchParams.get('error')

  useEffect(() => {
    // 자동으로 Google 로그인 페이지로 리디렉션
    signIn('google', { callbackUrl })
  }, [callbackUrl])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* 로고 및 헤더 */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
              <LogOut size={32} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Google Tasks 매트릭스</h1>
            <p className="text-gray-600 mt-2">
              아이젠하워 매트릭스로 효율적으로 태스크를 관리하세요
            </p>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">
                {error === 'AccessDenied'
                  ? '로그인이 거부되었습니다. 다시 시도해주세요.'
                  : error === 'Configuration'
                  ? 'OAuth 설정 오류가 발생했습니다.'
                  : '로그인 중 오류가 발생했습니다.'}
              </p>
            </div>
          )}

          {/* 로딩 상태 */}
          <div className="text-center">
            <div className="inline-flex items-center gap-3 text-gray-600">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
              <span>Google 로그인 페이지로 이동 중...</span>
            </div>
          </div>

          {/* 수동 로그인 버튼 (자동 리디렉션 실패 시) */}
          <div className="mt-6">
            <button
              onClick={() => signIn('google', { callbackUrl })}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google로 로그인
            </button>
          </div>

          {/* 설명 */}
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>Google 계정으로 로그인하면</p>
            <p>Google Tasks와 동기화됩니다</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">로딩 중...</div>}>
      <LoginPageContent />
    </Suspense>
  )
}
