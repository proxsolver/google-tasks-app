/**
 * NextAuth.js v5 설정
 *
 * Google OAuth 2.0을 통한 인증 처리
 */

import NextAuth, { type Session } from 'next-auth'
import Google from 'next-auth/providers/google'
import { prisma } from '@/lib/db/client'
import { NextRequest } from 'next/server'

/**
 * 세션 타입 확장
 */
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      image?: string | null
    }
  }
}

/**
 * NextAuth 설정
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope:
            'openid email profile https://www.googleapis.com/auth/tasks',
        },
      },
    }),
  ],
  callbacks: {
    /**
     * JWT 콜백 - 액세스 토큰 저장
     */
    async jwt({ token, account, user, trigger }) {
      // 초기 로그인 시 계정 정보 저장
      if (account && user) {
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          expiresAt: account.expires_at,
          userId: user.id,
        }
      }

      // 토큰 만료 확인 및 갱신 로직은 여기에 추가 가능
      return token
    },

    /**
     * 세션 콜백 - 사용자 정보 반환
     */
    async session({ session, token }) {
      if (token.userId && session.user) {
        session.user.id = token.userId as string
      }
      return session
    },

    /**
     * 로그인 콜백 - 사용자 DB 생성/갱신
     */
    async signIn({ user, account, profile }) {
      if (!account || !user.email) return false

      try {
        // 사용자 생성 또는 갱신
        const dbUser = await prisma.user.upsert({
          where: { googleId: account.providerAccountId },
          create: {
            googleId: account.providerAccountId,
            email: user.email,
            name: user.name,
            avatar: user.image,
            accessToken: account.access_token || '',
            refreshToken: account.refresh_token,
            expiresAt: account.expires_at
              ? new Date(account.expires_at * 1000)
              : null,
          },
          update: {
            accessToken: account.access_token || '',
            refreshToken: account.refresh_token,
            expiresAt: account.expires_at
              ? new Date(account.expires_at * 1000)
              : null,
            name: user.name,
            avatar: user.image,
          },
          include: { settings: true },
        })

        // 사용자 설정이 없으면 생성
        if (!dbUser.settings) {
          await prisma.userSettings.create({
            data: {
              userId: dbUser.id,
            },
          })
        }

        return true
      } catch (error) {
        console.error('Error during sign in:', error)
        return false
      }
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30일
  },
  secret: process.env.NEXTAUTH_SECRET,
})

/**
 * GET /api/auth/[...nextauth]
 */
export async function GET(req: NextRequest) {
  return handlers.GET(req)
}

/**
 * POST /api/auth/[...nextauth]
 */
export async function POST(req: NextRequest) {
  return handlers.POST(req)
}
