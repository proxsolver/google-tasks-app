/**
 * 태스크 검증기 단위 테스트
 */

import { describe, it, expect } from '@jest/globals'
import {
  createTaskSchema,
  updateTaskSchema,
  toggleTaskCompletionSchema,
  moveTaskSchema,
  taskIdSchema,
} from '@/lib/validators/task'
import { ZodError } from 'zod'

describe('Task Validator', () => {
  describe('createTaskSchema', () => {
    it('유효한 태스크 데이터를 검증해야 한다', () => {
      const validData = {
        title: '테스트 태스크',
        notes: '메모 내용',
        due: new Date(Date.now() + 86400000).toISOString(),
        isUrgent: true,
        isImportant: false,
        tagIds: ['tag1', 'tag2'],
      }

      const result = createTaskSchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.title).toBe('테스트 태스크')
      }
    })

    it('빈 제목은 거부해야 한다', () => {
      const invalidData = {
        title: '',
        isUrgent: false,
        isImportant: false,
      }

      const result = createTaskSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('제목은 필수 항목입니다')
      }
    })

    it('제목이 200자를 초과하면 거부해야 한다', () => {
      const invalidData = {
        title: 'a'.repeat(201),
        isUrgent: false,
        isImportant: false,
      }

      const result = createTaskSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('메모가 5000자를 초과하면 거부해야 한다', () => {
      const invalidData = {
        title: '테스트',
        notes: 'a'.repeat(5001),
        isUrgent: false,
        isImportant: false,
      }

      const result = createTaskSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('잘못된 날짜 형식은 거부해야 한다', () => {
      const invalidData = {
        title: '테스트',
        due: 'invalid-date',
        isUrgent: false,
        isImportant: false,
      }

      const result = createTaskSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('updateTaskSchema', () => {
    it('모든 필드가 선택사항이어야 한다', () => {
      const result = updateTaskSchema.safeParse({})
      expect(result.success).toBe(true)
    })

    it('제목만 수정할 수 있어야 한다', () => {
      const result = updateTaskSchema.safeParse({
        title: '수정된 제목',
      })
      expect(result.success).toBe(true)
    })

    it('상태를 수정할 수 있어야 한다', () => {
      const result = updateTaskSchema.safeParse({
        status: 'completed',
      })
      expect(result.success).toBe(true)
    })

    it('잘못된 상태 값은 거부해야 한다', () => {
      const result = updateTaskSchema.safeParse({
        status: 'invalid',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('toggleTaskCompletionSchema', () => {
    it('유효한 데이터를 검증해야 한다', () => {
      const result = toggleTaskCompletionSchema.safeParse({
        taskId: 'task-123',
        completed: true,
      })
      expect(result.success).toBe(true)
    })

    it('taskId가 없으면 거부해야 한다', () => {
      const result = toggleTaskCompletionSchema.safeParse({
        completed: true,
      })
      expect(result.success).toBe(false)
    })

    it('빈 taskId는 거부해야 한다', () => {
      const result = toggleTaskCompletionSchema.safeParse({
        taskId: '',
        completed: true,
      })
      expect(result.success).toBe(false)
    })
  })

  describe('moveTaskSchema', () => {
    it('유효한 데이터를 검증해야 한다', () => {
      const result = moveTaskSchema.safeParse({
        taskId: 'task-123',
        quadrant: 'q1',
      })
      expect(result.success).toBe(true)
    })

    it('모든 4분면 값이 허용되어야 한다', () => {
      const quadrants = ['q1', 'q2', 'q3', 'q4'] as const

      quadrants.forEach((quadrant) => {
        const result = moveTaskSchema.safeParse({
          taskId: 'task-123',
          quadrant,
        })
        expect(result.success).toBe(true)
      })
    })

    it('잘못된 분면 값은 거부해야 한다', () => {
      const result = moveTaskSchema.safeParse({
        taskId: 'task-123',
        quadrant: 'q5',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('taskIdSchema', () => {
    it('유효한 ID를 검증해야 한다', () => {
      const result = taskIdSchema.safeParse({
        id: 'task-123',
      })
      expect(result.success).toBe(true)
    })

    it('빈 ID는 거부해야 한다', () => {
      const result = taskIdSchema.safeParse({
        id: '',
      })
      expect(result.success).toBe(false)
    })
  })
})
