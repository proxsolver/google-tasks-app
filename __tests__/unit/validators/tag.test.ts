/**
 * 태그 검증기 단위 테스트
 */

import { describe, it, expect } from '@jest/globals'
import {
  createTagSchema,
  updateTagSchema,
  tagIdSchema,
  assignTagSchema,
  unassignTagSchema,
} from '@/lib/validators/tag'

describe('Tag Validator', () => {
  describe('createTagSchema', () => {
    it('유효한 태그 데이터를 검증해야 한다', () => {
      const validData = {
        name: '업무',
        color: '#3B82F6',
      }

      const result = createTagSchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.name).toBe('업무')
        expect(result.data.color).toBe('#3B82F6')
      }
    })

    it('기본 색상이 제공되어야 한다', () => {
      const result = createTagSchema.safeParse({
        name: '개인',
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.color).toBe('#3B82F6')
      }
    })

    it('빈 이름은 거부해야 한다', () => {
      const result = createTagSchema.safeParse({
        name: '',
      })

      expect(result.success).toBe(false)
    })

    it('이름이 50자를 초과하면 거부해야 한다', () => {
      const result = createTagSchema.safeParse({
        name: 'a'.repeat(51),
      })

      expect(result.success).toBe(false)
    })

    it('잘못된 색상 형식은 거부해야 한다', () => {
      const result = createTagSchema.safeParse({
        name: '테스트',
        color: 'red',
      })

      expect(result.success).toBe(false)
    })

    it('허용되지 않는 특수문자는 거부해야 한다', () => {
      const result = createTagSchema.safeParse({
        name: '태그@#$',
      })

      expect(result.success).toBe(false)
    })

    it('한글, 영문, 숫자, 공백, _, -는 허용되어야 한다', () => {
      const validNames = ['업무', 'Work', 'work123', 'work_task', 'work-task']

      validNames.forEach((name) => {
        const result = createTagSchema.safeParse({ name })
        expect(result.success).toBe(true)
      })
    })
  })

  describe('updateTagSchema', () => {
    it('모든 필드가 선택사항이어야 한다', () => {
      const result = updateTagSchema.safeParse({})
      expect(result.success).toBe(true)
    })

    it('이름만 수정할 수 있어야 한다', () => {
      const result = updateTagSchema.safeParse({
        name: '수정된 이름',
      })
      expect(result.success).toBe(true)
    })

    it('색상만 수정할 수 있어야 한다', () => {
      const result = updateTagSchema.safeParse({
        color: '#EF4444',
      })
      expect(result.success).toBe(true)
    })

    it('잘못된 HEX 색상은 거부해야 한다', () => {
      const result = updateTagSchema.safeParse({
        color: '#GGG',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('tagIdSchema', () => {
    it('유효한 ID를 검증해야 한다', () => {
      const result = tagIdSchema.safeParse({
        id: 'tag-123',
      })
      expect(result.success).toBe(true)
    })

    it('빈 ID는 거부해야 한다', () => {
      const result = tagIdSchema.safeParse({
        id: '',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('assignTagSchema', () => {
    it('유효한 데이터를 검증해야 한다', () => {
      const result = assignTagSchema.safeParse({
        taskId: 'task-123',
        tagId: 'tag-456',
      })
      expect(result.success).toBe(true)
    })

    it('taskId가 없으면 거부해야 한다', () => {
      const result = assignTagSchema.safeParse({
        tagId: 'tag-456',
      })
      expect(result.success).toBe(false)
    })

    it('tagId가 없으면 거부해야 한다', () => {
      const result = assignTagSchema.safeParse({
        taskId: 'task-123',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('unassignTagSchema', () => {
    it('유효한 데이터를 검증해야 한다', () => {
      const result = unassignTagSchema.safeParse({
        taskId: 'task-123',
        tagId: 'tag-456',
      })
      expect(result.success).toBe(true)
    })

    it('taskId가 없으면 거부해야 한다', () => {
      const result = unassignTagSchema.safeParse({
        tagId: 'tag-456',
      })
      expect(result.success).toBe(false)
    })

    it('tagId가 없으면 거부해야 한다', () => {
      const result = unassignTagSchema.safeParse({
        taskId: 'task-123',
      })
      expect(result.success).toBe(false)
    })
  })
})
