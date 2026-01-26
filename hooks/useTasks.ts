/**
 * 태스크 상태 관리 훅
 *
 * Optimistic Updates + 에러 롤백 패턴 구현
 */

'use client'

import { useState, useCallback } from 'react'
import { useSWRConfig } from 'swr'
import type { GoogleTask } from '@/lib/google-tasks/types'

interface CreateTaskInput {
  title: string
  notes?: string
  due?: string
  parent?: string
  isUrgent: boolean
  isImportant: boolean
  tagIds?: string[]
}

interface UpdateTaskInput {
  title?: string
  notes?: string
  due?: string | null
  status?: 'needsAction' | 'completed'
  isUrgent?: boolean
  isImportant?: boolean
  tagIds?: string[]
}

interface TaskWithTags extends GoogleTask {
  tags: Array<{
    id: string
    name: string
    color: string
  }>
}

interface UseTasksResult {
  tasks: TaskWithTags[]
  isLoading: boolean
  error: Error | null
  createTask: (data: CreateTaskInput) => Promise<TaskWithTags | null>
  updateTask: (id: string, data: UpdateTaskInput) => Promise<TaskWithTags | null>
  deleteTask: (id: string) => Promise<boolean>
  toggleTaskCompletion: (id: string, completed: boolean) => Promise<TaskWithTags | null>
  refreshTasks: () => Promise<void>
}

export function useTasks(): UseTasksResult {
  const { mutate, cache } = useSWRConfig()
  const [tasks, setTasks] = useState<TaskWithTags[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  /**
   * 태스크 목록 조회
   */
  const fetchTasks = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/tasks')

      if (!response.ok) {
        throw new Error('태스크 조회 실패')
      }

      const data = await response.json()
      setTasks(data.tasks || [])
    } catch (err) {
      setError(err instanceof Error ? err : new Error('알 수 없는 오류'))
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * 태스크 생성 (Optimistic Update)
   */
  const createTask = useCallback(async (data: CreateTaskInput) => {
    const optimisticId = `optimistic-${Date.now()}`
    const optimisticTask: TaskWithTags = {
      id: optimisticId,
      kind: 'tasks#task',
      title: data.title,
      notes: data.notes,
      due: data.due,
      status: 'needsAction',
      updated: new Date().toISOString(),
      tags: [],
    }

    // Optimistic Update
    setTasks((prev) => [...prev, optimisticTask])

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error('태스크 생성 실패')
      }

      const result = await response.json()
      const newTask = result.task as TaskWithTags

      // 실제 태스크로 교체
      setTasks((prev) =>
        prev.map((t) => (t.id === optimisticId ? newTask : t))
      )

      return newTask
    } catch (err) {
      // Rollback
      setTasks((prev) => prev.filter((t) => t.id !== optimisticId))
      setError(err instanceof Error ? err : new Error('알 수 없는 오류'))
      return null
    }
  }, [])

  /**
   * 태스크 수정 (Optimistic Update)
   */
  const updateTask = useCallback(async (id: string, data: UpdateTaskInput) => {
    // 함수형 업데이트로 의존성 제거
    let previousTasks: TaskWithTags[] = []

    // Optimistic Update
    setTasks((prev) => {
      previousTasks = [...prev]
      return prev.map((task) =>
        task.id === id
          ? {
              ...task,
              due: task.due || undefined,
              ...(data.title && { title: data.title }),
              ...(data.notes !== undefined && { notes: data.notes }),
              ...(data.due !== undefined && { due: data.due || undefined }),
              ...(data.status && { status: data.status }),
            }
          : task
      )
    })

    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error('태스크 수정 실패')
      }

      const result = await response.json()
      const updatedTask = result.task as TaskWithTags

      // 실제 데이터로 업데이트
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? updatedTask : t))
      )

      return updatedTask
    } catch (err) {
      // Rollback
      setTasks(previousTasks)
      setError(err instanceof Error ? err : new Error('알 수 없는 오류'))
      return null
    }
  }, []) // 의존성 제거

  /**
   * 태스크 삭제 (Optimistic Update)
   */
  const deleteTask = useCallback(async (id: string) => {
    let previousTasks: TaskWithTags[] = []

    // Optimistic Update
    setTasks((prev) => {
      previousTasks = [...prev]
      return prev.filter((t) => t.id !== id)
    })

    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('태스크 삭제 실패')
      }

      return true
    } catch (err) {
      // Rollback
      setTasks(previousTasks)
      setError(err instanceof Error ? err : new Error('알 수 없는 오류'))
      return false
    }
  }, []) // 의존성 제거

  /**
   * 태스크 완료 상태 토글 (Optimistic Update)
   */
  const toggleTaskCompletion = useCallback(async (id: string, completed: boolean) => {
    let previousTasks: TaskWithTags[] = []

    // Optimistic Update
    setTasks((prev) => {
      previousTasks = [...prev]
      return prev.map((task) =>
        task.id === id
          ? {
              ...task,
              due: task.due || undefined,
              status: completed ? 'completed' : 'needsAction',
              completed: completed ? new Date().toISOString() : undefined,
            }
          : task
      )
    })

    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: id, completed }),
      })

      if (!response.ok) {
        throw new Error('태스크 상태 변경 실패')
      }

      const result = await response.json()
      const updatedTask = result.task as TaskWithTags

      // 실제 데이터로 업데이트
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? updatedTask : t))
      )

      return updatedTask
    } catch (err) {
      // Rollback
      setTasks(previousTasks)
      setError(err instanceof Error ? err : new Error('알 수 없는 오류'))
      return null
    }
  }, []) // 의존성 제거

  return {
    tasks,
    isLoading,
    error,
    createTask,
    updateTask,
    deleteTask,
    toggleTaskCompletion,
    refreshTasks: fetchTasks,
  }
}
