/**
 * 개별 태그 API 라우트
 *
 * GET: 태그 조회
 * PUT: 태그 수정
 * DELETE: 태그 삭제
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/db/client'
import { updateTagSchema } from '@/lib/validators/tag'
import { z } from 'zod'

/**
 * GET /api/tags/[id] - 태그 조회
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: '인증되지 않음' }, { status: 401 })
    }

    const { id } = await params
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: '사용자를 찾을 수 없음' }, { status: 404 })
    }

    const tag = await prisma.tag.findFirst({
      where: {
        id,
        userId: user.id,
      },
      include: {
        taskTags: {
          include: {
            tag: true,
          },
        },
      },
    })

    if (!tag) {
      return NextResponse.json({ error: '태그를 찾을 수 없음' }, { status: 404 })
    }

    return NextResponse.json({ tag })
  } catch (error) {
    console.error('Error fetching tag:', error)
    return NextResponse.json(
      { error: '태그 조회 실패', message: error instanceof Error ? error.message : '알 수 없는 오류' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/tags/[id] - 태그 수정
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: '인증되지 않음' }, { status: 401 })
    }

    const body = await req.json()
    const validatedData = updateTagSchema.parse(body)

    const { id } = await params
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: '사용자를 찾을 수 없음' }, { status: 404 })
    }

    // 태그 존재 확인
    const existingTag = await prisma.tag.findFirst({
      where: {
        id,
        userId: user.id,
      },
    })

    if (!existingTag) {
      return NextResponse.json({ error: '태그를 찾을 수 없음' }, { status: 404 })
    }

    // 이름 변경 시 중복 확인
    if (validatedData.name && validatedData.name !== existingTag.name) {
      const duplicateTag = await prisma.tag.findUnique({
        where: {
          userId_name: {
            userId: user.id,
            name: validatedData.name,
          },
        },
      })

      if (duplicateTag) {
        return NextResponse.json(
          { error: '이미 존재하는 태그 이름입니다' },
          { status: 409 }
        )
      }
    }

    // 태그 업데이트
    const updatedTag = await prisma.tag.update({
      where: { id },
      data: {
        name: validatedData.name,
        color: validatedData.color,
      },
    })

    return NextResponse.json({ tag: updatedTag })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '입력값 검증 실패', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error updating tag:', error)
    return NextResponse.json(
      { error: '태그 수정 실패', message: error instanceof Error ? error.message : '알 수 없는 오류' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/tags/[id] - 태그 삭제
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: '인증되지 않음' }, { status: 401 })
    }

    const { id } = await params
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: '사용자를 찾을 수 없음' }, { status: 404 })
    }

    // 태그 존재 확인
    const existingTag = await prisma.tag.findFirst({
      where: {
        id,
        userId: user.id,
      },
    })

    if (!existingTag) {
      return NextResponse.json({ error: '태그를 찾을 수 없음' }, { status: 404 })
    }

    // 태그 삭제 (연결된 TaskTag도 CASCADE로 삭제됨)
    await prisma.tag.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting tag:', error)
    return NextResponse.json(
      { error: '태그 삭제 실패', message: error instanceof Error ? error.message : '알 수 없는 오류' },
      { status: 500 }
    )
  }
}
