/**
 * Google Tasks API 클라이언트
 *
 * Google Tasks API와의 모든 상호작용을 처리합니다.
 * @see https://developers.google.com/tasks/reference/rest/v1
 */

import {
  GoogleTask,
  GoogleTaskList,
  GoogleTasksResponse,
  GoogleTaskListsResponse,
  CreateTaskRequest,
  UpdateTaskRequest,
} from './types'

const BASE_URL = 'https://www.googleapis.com/tasks/v1'

export class GoogleTasksError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public code?: string
  ) {
    super(message)
    this.name = 'GoogleTasksError'
  }
}

/**
 * Google Tasks API 클라이언트 클래스
 */
export class GoogleTasksClient {
  constructor(private accessToken: string) {}

  /**
   * API 요청을 보내는 공통 메서드
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${BASE_URL}${endpoint}`

    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new GoogleTasksError(
        error.error?.message || 'Google Tasks API 요청 실패',
        response.status,
        error.error?.code
      )
    }

    return response.json()
  }

  /**
   * 모든 태스크 목록 조회
   */
  async getTaskLists(): Promise<GoogleTaskList[]> {
    const response: GoogleTaskListsResponse = await this.request(
      '/users/@me/lists'
    )
    return response.items || []
  }

  /**
   * 특정 태스크 목록 조회
   */
  async getTaskList(taskListId: string): Promise<GoogleTaskList> {
    return this.request<GoogleTaskList>(`/users/@me/lists/${taskListId}`)
  }

  /**
   * 태스크 목록의 모든 태스크 조회
   */
  async getTasks(
    taskListId: string = '@default',
    options: {
      completedMin?: string
      completedMax?: string
      dueMin?: string
      dueMax?: string
      showCompleted?: boolean
      showHidden?: boolean
      pageToken?: string
    } = {}
  ): Promise<{ tasks: GoogleTask[]; nextPageToken?: string }> {
    const params = new URLSearchParams()

    if (options.completedMin) params.append('completedMin', options.completedMin)
    if (options.completedMax) params.append('completedMax', options.completedMax)
    if (options.dueMin) params.append('dueMin', options.dueMin)
    if (options.dueMax) params.append('dueMax', options.dueMax)
    if (options.showCompleted !== undefined)
      params.append('showCompleted', String(options.showCompleted))
    if (options.showHidden !== undefined)
      params.append('showHidden', String(options.showHidden))
    if (options.pageToken) params.append('pageToken', options.pageToken)

    const queryString = params.toString()
    const endpoint = `/lists/${taskListId}/tasks${queryString ? `?${queryString}` : ''}`

    const response: GoogleTasksResponse = await this.request(endpoint)

    return {
      tasks: response.items || [],
      nextPageToken: response.nextPageToken,
    }
  }

  /**
   * 특정 태스크 조회
   */
  async getTask(taskListId: string, taskId: string): Promise<GoogleTask> {
    return this.request<GoogleTask>(`/lists/${taskListId}/tasks/${taskId}`)
  }

  /**
   * 새 태스크 생성
   */
  async createTask(
    taskListId: string,
    data: CreateTaskRequest
  ): Promise<GoogleTask> {
    return this.request<GoogleTask>(`/lists/${taskListId}/tasks`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  /**
   * 태스크 수정
   */
  async updateTask(
    taskListId: string,
    taskId: string,
    data: UpdateTaskRequest
  ): Promise<GoogleTask> {
    // 먼저 현재 태스크를 가져옴
    const current = await this.getTask(taskListId, taskId)

    // 병합: 변경된 필드만 업데이트
    const updated = {
      ...current,
      ...data,
    }

    return this.request<GoogleTask>(`/lists/${taskListId}/tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify(updated),
    })
  }

  /**
   * 태스크 삭제
   */
  async deleteTask(taskListId: string, taskId: string): Promise<void> {
    await this.request(`/lists/${taskListId}/tasks/${taskId}`, {
      method: 'DELETE',
    })
  }

  /**
   * 태스크 완료 상태 토글
   */
  async toggleTaskCompletion(
    taskListId: string,
    taskId: string,
    completed: boolean
  ): Promise<GoogleTask> {
    return this.updateTask(taskListId, taskId, {
      status: completed ? 'completed' : 'needsAction',
      completed: completed ? new Date().toISOString() : undefined,
    })
  }

  /**
   * 태스크 이동 (위치 변경)
   */
  async moveTask(
    taskListId: string,
    taskId: string,
    options: {
      parent?: string
      previous?: string
    } = {}
  ): Promise<GoogleTask> {
    const params = new URLSearchParams()
    if (options.parent) params.append('parent', options.parent)
    if (options.previous) params.append('previous', options.previous)

    const queryString = params.toString()
    const endpoint = `/lists/${taskListId}/tasks/${taskId}/move${
      queryString ? `?${queryString}` : ''
    }`

    return this.request<GoogleTask>(endpoint, {
      method: 'POST',
    })
  }

  /**
   * 모든 태스크를 완료되지 않은 태스크만 필터링하여 조회
   */
  async getActiveTasks(taskListId: string = '@default'): Promise<GoogleTask[]> {
    const result = await this.getTasks(taskListId, {
      showCompleted: false,
      showHidden: false,
    })
    return result.tasks
  }

  /**
   * 마감일이 임박한 태스크 조회 (7일 이내)
   */
  async getUpcomingTasks(taskListId: string = '@default'): Promise<GoogleTask[]> {
    const now = new Date()
    const weekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    const result = await this.getTasks(taskListId, {
      dueMin: now.toISOString(),
      dueMax: weekLater.toISOString(),
      showCompleted: false,
    })

    return result.tasks
  }
}

/**
 * 액세스 토큰으로 Google Tasks 클라이언트 생성
 */
export function createGoogleTasksClient(accessToken: string): GoogleTasksClient {
  return new GoogleTasksClient(accessToken)
}
