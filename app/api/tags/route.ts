/**
 * 태그 CRUD API 라우트
 *
 * GET: 태그 목록 조회
 * POST: 새 태그 생성
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/db/client'
import { createTagSchema } from '@/lib/validators/tag'
import { z } from 'zod'

/**
 * GET /api/tags - 태그 목록 조회
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: '인증되지 않음' }, { status: 401 })
    }

    // 사용자 조회
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: '사용자를 찾을 수 없음' }, { status: 404 })
    }

    // 태그 조회
    const tags = await prisma.tag.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { taskTags: true },
        },
      },
    })

    return NextResponse.json({ tags })
  } catch (error) {
    console.error('Error fetching tags:', error)
    return NextResponse.json(
      { error: '태그 조회 실패', message: error instanceof Error ? error.message : '알 수 없는 오류' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/tags - 새 태그 생성
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: '인증되지 않음' }, { status: 401 })
    }

    // 요청 본문 파싱 및 검증
    const body = await req.json()
    const validatedData = createTagSchema.parse(body)

    // 사용자 조회
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: '사용자를 찾을 수 없음' }, { status: 404 })
    }

    // 동일한 이름의 태그 확인
    const existingTag = await prisma.tag.findUnique({
      where: {
        userId_name: {
          userId: user.id,
          name: validatedData.name,
        },
      },
    })

    if (existingTag) {
      return NextResponse.json(
        { error: '이미 존재하는 태그 이름입니다' },
        { status: 409 }
      )
    }

    // 태그 생성
    const tag = await prisma.tag.create({
      data: {
        name: validatedData.name,
        color: validatedData.color,
        userId: user.id,
      },
    })

    return NextResponse.json({ tag }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '입력값 검증 실패', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error creating tag:', error)
    return NextResponse.json(
      { error: '태그 생성 실패', message: error instanceof Error ? error.message : '알 수 없는 오류' },
      { status: 500 }
    )
  }
}
