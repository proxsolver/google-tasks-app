/**
 * 태스크 우선순위 관리 유틸리티
 *
 * Google Tasks API에는 우선순위 필드가 없으므로
 * notes에 JSON 형식으로 메타데이터를 저장합니다.
 */

const PRIORITY_PREFIX = '__PRIORITY__'
const PRIORITY_PATTERN = /__PRIORITY__\s*([\s\S]*?)\s*__PRIORITY__/

export interface TaskPriority {
  isUrgent: boolean
  isImportant: boolean
}

/**
 * notes에서 우선순위 정보를 추출
 */
export function extractPriority(notes?: string): TaskPriority {
  if (!notes) {
    return { isUrgent: false, isImportant: false }
  }

  // JSON 메타데이터 파싱 시도
  const match = notes.match(PRIORITY_PATTERN)
  if (match) {
    try {
      const parsed = JSON.parse(match[1])
      return {
        isUrgent: Boolean(parsed.isUrgent),
        isImportant: Boolean(parsed.isImportant),
      }
    } catch {
      // 파싱 실패 시 레거시 이모지 방식으로 대체
    }
  }

  // 레거시 이모지 방식 (하위 호환성)
  return {
    isUrgent: notes.includes('🔥 긴급'),
    isImportant: notes.includes('⭐ 중요'),
  }
}

/**
 * notes에 우선순위 정보를 추가
 * @param notes 원본 notes
 * @param priority 우선순위
 * @param originalContent 사용자가 입력한 원본 내용
 */
export function addPriorityToNotes(
  notes: string | undefined,
  priority: TaskPriority,
  originalContent = ''
): string {
  // 기존 우선순위 메타데이터 제거
  const cleanedNotes = notes?.replace(PRIORITY_PATTERN, '').trim() || ''

  // 사용자 입력 내용과 기존 notes 병합
  const baseContent = originalContent || cleanedNotes

  // 우선순위 정보가 없는 경우
  if (!priority.isUrgent && !priority.isImportant) {
    return baseContent
  }

  // JSON 메타데이터로 우선순위 저장
  const metadata = JSON.stringify(priority)
  const priorityBlock = `${PRIORITY_PREFIX} ${metadata} ${PRIORITY_PREFIX}`

  if (baseContent) {
    return `${priorityBlock}\n\n${baseContent}`
  }
  return priorityBlock
}

/**
 * 사용자에게 표시할 notes 내용 (메타데이터 제거)
 */
export function getDisplayNotes(notes?: string): string {
  if (!notes) return ''
  return notes.replace(PRIORITY_PATTERN, '').trim()
}

/**
 * 우선순위에 따라 아이젠하워 매트릭스 분면 반환
 */
export function getEisenhowerQuadrant(priority: TaskPriority): 'q1' | 'q2' | 'q3' | 'q4' {
  if (priority.isUrgent && priority.isImportant) return 'q1'
  if (!priority.isUrgent && priority.isImportant) return 'q2'
  if (priority.isUrgent && !priority.isImportant) return 'q3'
  return 'q4'
}

/**
 * 분면에 해당하는 우선순위 반환
 */
export function getPriorityForQuadrant(
  quadrant: 'q1' | 'q2' | 'q3' | 'q4'
): TaskPriority {
  const quadrants: Record<string, TaskPriority> = {
    q1: { isUrgent: true, isImportant: true },
    q2: { isUrgent: false, isImportant: true },
    q3: { isUrgent: true, isImportant: false },
    q4: { isUrgent: false, isImportant: false },
  }
  return quadrants[quadrant]
}
