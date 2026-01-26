/**
 * 태스크 CRUD API 라우트
 *
 * GET: 태스크 목록 조회
 * POST: 새 태스크 생성
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/db/client'
import { createGoogleTasksClient } from '@/lib/google-tasks/client'
import { createTaskSchema } from '@/lib/validators/task'
import { addPriorityToNotes } from '@/lib/utils/priority'
import { z } from 'zod'

/**
 * GET /api/tasks - 태스크 목록 조회
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: '인증되지 않음' }, { status: 401 })
    }

    // 사용자 정보 조회
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { settings: true },
    })

    if (!user) {
      return NextResponse.json({ error: '사용자를 찾을 수 없음' }, { status: 404 })
    }

    // Google Tasks API로 태스크 조회
    const googleTasks = createGoogleTasksClient(user.accessToken)
    const taskListId = user.settings?.taskListId || '@default'

    const { tasks } = await googleTasks.getTasks(taskListId, {
      showCompleted: false,
      showHidden: false,
    })

    // 태그 정보 조인
    const taskIds = tasks.map((task) => task.id)
    const taskTags = await prisma.taskTag.findMany({
      where: { taskId: { in: taskIds } },
      include: { tag: true },
    })

    // 태그를 태스크에 매핑
    const tasksWithTags = tasks.map((task) => ({
      ...task,
      tags: taskTags
        .filter((tt: any) => tt.taskId === task.id)
        .map((tt: any) => ({
          id: tt.tag.id,
          name: tt.tag.name,
          color: tt.tag.color,
        })),
    }))

    return NextResponse.json({ tasks: tasksWithTags })
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json(
      { error: '태스크 조회 실패', message: error instanceof Error ? error.message : '알 수 없는 오류' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/tasks - 새 태스크 생성
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: '인증되지 않음' }, { status: 401 })
    }

    // 요청 본문 파싱 및 검증
    const body = await req.json()
    const validatedData = createTaskSchema.parse(body)

    // 사용자 정보 조회
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { settings: true },
    })

    if (!user) {
      return NextResponse.json({ error: '사용자를 찾을 수 없음' }, { status: 404 })
    }

    // Google Tasks에 태스크 생성
    const googleTasks = createGoogleTasksClient(user.accessToken)
    const taskListId = user.settings?.taskListId || '@default'

    // 우선순위를 notes에 JSON 메타데이터로 저장
    const notes = addPriorityToNotes(
      undefined,
      {
        isUrgent: validatedData.isUrgent,
        isImportant: validatedData.isImportant,
      },
      validatedData.notes || ''
    )

    const newTask = await googleTasks.createTask(taskListId, {
      title: validatedData.title,
      notes: notes || undefined,
      due: validatedData.due,
      parent: validatedData.parent,
    })

    // 태그 연결
    if (validatedData.tagIds && validatedData.tagIds.length > 0) {
      await prisma.taskTag.createMany({
        data: validatedData.tagIds.map((tagId) => ({
          taskId: newTask.id,
          tagId,
        })),
        skipDuplicates: true,
      })
    }

    // 생성된 태그 조회
    const taskTags = await prisma.taskTag.findMany({
      where: { taskId: newTask.id },
      include: { tag: true },
    })

    return NextResponse.json(
      {
        task: {
          ...newTask,
          tags: taskTags.map((tt: any) => ({
            id: tt.tag.id,
            name: tt.tag.name,
            color: tt.tag.color,
          })),
        },
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '입력값 검증 실패', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error creating task:', error)
    return NextResponse.json(
      { error: '태스크 생성 실패', message: error instanceof Error ? error.message : '알 수 없는 오류' },
      { status: 500 }
    )
  }
}
