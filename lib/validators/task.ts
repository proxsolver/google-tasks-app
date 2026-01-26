/**
 * 태스크 관련 Zod 검증 스키마
 */

import { z } from 'zod'

/**
 * 태스크 생성 스키마
 */
export const createTaskSchema = z.object({
  title: z
    .string()
    .min(1, '제목은 필수 항목입니다')
    .max(200, '제목은 200자 이하여야 합니다')
    .trim(),
  notes: z.string().max(5000, '메모는 5000자 이하여야 합니다').optional(),
  due: z.string().datetime().optional(),
  parent: z.string().optional(),
  isUrgent: z.boolean().default(false),
  isImportant: z.boolean().default(false),
  tagIds: z.array(z.string()).optional(),
})

/**
 * 태스크 수정 스키마
 */
export const updateTaskSchema = z.object({
  title: z
    .string()
    .min(1, '제목은 필수 항목입니다')
    .max(200, '제목은 200자 이하여야 합니다')
    .trim()
    .optional(),
  notes: z.string().max(5000, '메모는 5000자 이하여야 합니다').optional(),
  due: z.string().datetime().nullable().optional(),
  status: z.enum(['needsAction', 'completed']).optional(),
  isUrgent: z.boolean().optional(),
  isImportant: z.boolean().optional(),
  tagIds: z.array(z.string()).optional(),
})

/**
 * 태스크 완료 토글 스키마
 */
export const toggleTaskCompletionSchema = z.object({
  taskId: z.string().min(1, '태스크 ID는 필수 항목입니다'),
  completed: z.boolean(),
})

/**
 * 태스크 이동 스키마
 */
export const moveTaskSchema = z.object({
  taskId: z.string().min(1, '태스크 ID는 필수 항목입니다'),
  quadrant: z.enum(['q1', 'q2', 'q3', 'q4']),
})

/**
 * 태스크 ID 스키마
 */
export const taskIdSchema = z.object({
  id: z.string().min(1, '태스크 ID는 필수 항목입니다'),
})

/**
 * 타입 추출
 */
export type CreateTaskInput = z.infer<typeof createTaskSchema>
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>
export type ToggleTaskCompletionInput = z.infer<typeof toggleTaskCompletionSchema>
export type MoveTaskInput = z.infer<typeof moveTaskSchema>
export type TaskIdInput = z.infer<typeof taskIdSchema>
