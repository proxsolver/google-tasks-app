/**
 * 개별 태스크 API 라우트
 *
 * GET: 태스크 조회
 * PUT: 태스크 수정
 * DELETE: 태스크 삭제
 * PATCH: 태스크 완료 상태 토글
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/db/client'
import { createGoogleTasksClient } from '@/lib/google-tasks/client'
import { updateTaskSchema, toggleTaskCompletionSchema } from '@/lib/validators/task'
import { extractPriority, addPriorityToNotes, getDisplayNotes } from '@/lib/utils/priority'
import { z } from 'zod'

/**
 * GET /api/tasks/[id] - 태스크 조회
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
      include: { settings: true },
    })

    if (!user) {
      return NextResponse.json({ error: '사용자를 찾을 수 없음' }, { status: 404 })
    }

    const googleTasks = createGoogleTasksClient(user.accessToken)
    const taskListId = user.settings?.taskListId || '@default'

    const task = await googleTasks.getTask(taskListId, id)

    // 태그 조회
    const taskTags = await prisma.taskTag.findMany({
      where: { taskId: id },
      include: { tag: true },
    })

    return NextResponse.json({
      task: {
        ...task,
        tags: taskTags.map((tt: any) => ({
          id: tt.tag.id,
          name: tt.tag.name,
          color: tt.tag.color,
        })),
      },
    })
  } catch (error) {
    console.error('Error fetching task:', error)
    return NextResponse.json(
      { error: '태스크 조회 실패', message: error instanceof Error ? error.message : '알 수 없는 오류' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/tasks/[id] - 태스크 수정
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
    const validatedData = updateTaskSchema.parse(body)

    const { id } = await params
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { settings: true },
    })

    if (!user) {
      return NextResponse.json({ error: '사용자를 찾을 수 없음' }, { status: 404 })
    }

    const googleTasks = createGoogleTasksClient(user.accessToken)
    const taskListId = user.settings?.taskListId || '@default'

    // 현재 태스크 조회
    const currentTask = await googleTasks.getTask(taskListId, id)

    // 기존 우선순위 추출
    const existingPriority = extractPriority(currentTask.notes)
    const isUrgent = validatedData.isUrgent ?? existingPriority.isUrgent
    const isImportant = validatedData.isImportant ?? existingPriority.isImportant

    // 기존 메모에서 사용자 입력 내용 추출
    const existingContent = getDisplayNotes(currentTask.notes)

    // 새로운 notes 생성 (우선순위 메타데이터 포함)
    const notes = addPriorityToNotes(
      currentTask.notes,
      { isUrgent, isImportant },
      validatedData.notes !== undefined ? validatedData.notes : existingContent
    )

    // Google Tasks 업데이트
    const updatedTask = await googleTasks.updateTask(taskListId, id, {
      title: validatedData.title,
      notes: notes || undefined,
      due: validatedData.due || undefined,
      status: validatedData.status,
    })

    // 태그 업데이트
    if (validatedData.tagIds) {
      // 기존 태그 삭제
      await prisma.taskTag.deleteMany({
        where: { taskId: id },
      })

      // 새 태그 추가
      if (validatedData.tagIds.length > 0) {
        await prisma.taskTag.createMany({
          data: validatedData.tagIds.map((tagId) => ({
            taskId: id,
            tagId,
          })),
          skipDuplicates: true,
        })
      }
    }

    // 업데이트된 태그 조회
    const taskTags = await prisma.taskTag.findMany({
      where: { taskId: id },
      include: { tag: true },
    })

    return NextResponse.json({
      task: {
        ...updatedTask,
        tags: taskTags.map((tt: any) => ({
          id: tt.tag.id,
          name: tt.tag.name,
          color: tt.tag.color,
        })),
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '입력값 검증 실패', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error updating task:', error)
    return NextResponse.json(
      { error: '태스크 수정 실패', message: error instanceof Error ? error.message : '알 수 없는 오류' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/tasks/[id] - 태스크 삭제
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
      include: { settings: true },
    })

    if (!user) {
      return NextResponse.json({ error: '사용자를 찾을 수 없음' }, { status: 404 })
    }

    const googleTasks = createGoogleTasksClient(user.accessToken)
    const taskListId = user.settings?.taskListId || '@default'

    // Google Tasks에서 삭제
    await googleTasks.deleteTask(taskListId, id)

    // 연결된 태그 삭제
    await prisma.taskTag.deleteMany({
      where: { taskId: id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting task:', error)
    return NextResponse.json(
      { error: '태스크 삭제 실패', message: error instanceof Error ? error.message : '알 수 없는 오류' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/tasks/[id] - 태스크 완료 상태 토글
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: '인증되지 않음' }, { status: 401 })
    }

    const body = await req.json()
    const validatedData = toggleTaskCompletionSchema.parse(body)

    const { id } = await params
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { settings: true },
    })

    if (!user) {
      return NextResponse.json({ error: '사용자를 찾을 수 없음' }, { status: 404 })
    }

    const googleTasks = createGoogleTasksClient(user.accessToken)
    const taskListId = user.settings?.taskListId || '@default'

    const updatedTask = await googleTasks.toggleTaskCompletion(
      taskListId,
      id,
      validatedData.completed
    )

    // 태그 조회
    const taskTags = await prisma.taskTag.findMany({
      where: { taskId: id },
      include: { tag: true },
    })

    return NextResponse.json({
      task: {
        ...updatedTask,
        tags: taskTags.map((tt: any) => ({
          id: tt.tag.id,
          name: tt.tag.name,
          color: tt.tag.color,
        })),
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '입력값 검증 실패', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error toggling task completion:', error)
    return NextResponse.json(
      { error: '태스크 상태 변경 실패', message: error instanceof Error ? error.message : '알 수 없는 오류' },
      { status: 500 }
    )
  }
}
