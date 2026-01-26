/**
 * Google Tasks API 타입 정의
 * @see https://developers.google.com/tasks/reference/rest/v1/tasks
 */

export interface GoogleTask {
  kind?: string
  id: string
  etag?: string
  title: string
  updated?: string
  selfLink?: string
  parent?: string
  position?: string
  notes?: string
  status: 'needsAction' | 'completed'
  due?: string
  completed?: string
  deleted?: boolean
  hidden?: boolean
  links?: {
    description?: string
    link?: string
    type?: string
  }[]
}

export interface GoogleTaskList {
  kind: string
  id: string
  etag: string
  title: string
  selfLink: string
  updated: string
}

export interface GoogleTasksResponse {
  kind: string
  etag: string
  items?: GoogleTask[]
  nextPageToken?: string
}

export interface GoogleTaskListsResponse {
  kind: string
  etag: string
  items?: GoogleTaskList[]
  nextPageToken?: string
}

/**
 * Google Tasks API 요청 타입
 */
export interface CreateTaskRequest {
  title: string
  notes?: string
  due?: string
  parent?: string
  position?: string
  previous?: string
}

export interface UpdateTaskRequest extends Partial<CreateTaskRequest> {
  status?: 'needsAction' | 'completed'
  completed?: string
}

/**
 * 태스크와 관련 태그를 포함한 응답 타입
 */
export interface TaskWithTags extends GoogleTask {
  tags: Array<{
    id: string
    name: string
    color: string
  }>
}

/**
 * 아이젠하워 매트릭스 4분면 타입
 */
export type EisenhowerQuadrant = 'q1' | 'q2' | 'q3' | 'q4'

/**
 * 긴급도 및 중요도 타입
 */
export interface TaskPriority {
  isUrgent: boolean
  isImportant: boolean
}
