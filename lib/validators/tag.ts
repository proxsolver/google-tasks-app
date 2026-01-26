/**
 * 태그 관련 Zod 검증 스키마
 */

import { z } from 'zod'

/**
 * 태그 생성 스키마
 */
export const createTagSchema = z.object({
  name: z
    .string()
    .min(1, '태그 이름은 필수 항목입니다')
    .max(50, '태그 이름은 50자 이하여야 합니다')
    .trim()
    .regex(/^[가-힣a-zA-Z0-9\s_-]+$/, '특수문자는 _, -만 사용 가능합니다'),
  color: z
    .string()
    .regex(
      /^#[0-9A-Fa-f]{6}$/,
      '색상은 유효한 HEX 색상 코드여야 합니다 (예: #3B82F6)'
    )
    .default('#3B82F6'),
})

/**
 * 태그 수정 스키마
 */
export const updateTagSchema = z.object({
  name: z
    .string()
    .min(1, '태그 이름은 필수 항목입니다')
    .max(50, '태그 이름은 50자 이하여야 합니다')
    .trim()
    .regex(/^[가-힣a-zA-Z0-9\s_-]+$/, '특수문자는 _, -만 사용 가능합니다')
    .optional(),
  color: z
    .string()
    .regex(
      /^#[0-9A-Fa-f]{6}$/,
      '색상은 유효한 HEX 색상 코드여야 합니다 (예: #3B82F6)'
    )
    .optional(),
})

/**
 * 태그 ID 스키마
 */
export const tagIdSchema = z.object({
  id: z.string().min(1, '태그 ID는 필수 항목입니다'),
})

/**
 * 태그 할당 스키마
 */
export const assignTagSchema = z.object({
  taskId: z.string().min(1, '태스크 ID는 필수 항목입니다'),
  tagId: z.string().min(1, '태그 ID는 필수 항목입니다'),
})

/**
 * 태그 제거 스키마
 */
export const unassignTagSchema = z.object({
  taskId: z.string().min(1, '태스크 ID는 필수 항목입니다'),
  tagId: z.string().min(1, '태그 ID는 필수 항목입니다'),
})

/**
 * 타입 추출
 */
export type CreateTagInput = z.infer<typeof createTagSchema>
export type UpdateTagInput = z.infer<typeof updateTagSchema>
export type TagIdInput = z.infer<typeof tagIdSchema>
export type AssignTagInput = z.infer<typeof assignTagSchema>
export type UnassignTagInput = z.infer<typeof unassignTagSchema>
