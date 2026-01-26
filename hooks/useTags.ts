/**
 * 태그 상태 관리 훅
 */

'use client'

import { useState, useCallback } from 'react'

interface Tag {
  id: string
  name: string
  color: string
  createdAt: string
  updatedAt: string
  _count?: {
    taskTags: number
  }
}

interface CreateTagInput {
  name: string
  color?: string
}

interface UpdateTagInput {
  name?: string
  color?: string
}

interface UseTagsResult {
  tags: Tag[]
  isLoading: boolean
  error: Error | null
  createTag: (data: CreateTagInput) => Promise<Tag | null>
  updateTag: (id: string, data: UpdateTagInput) => Promise<Tag | null>
  deleteTag: (id: string) => Promise<boolean>
  refreshTags: () => Promise<void>
}

export function useTags(): UseTagsResult {
  const [tags, setTags] = useState<Tag[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  /**
   * 태그 목록 조회
   */
  const fetchTags = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/tags')

      if (!response.ok) {
        throw new Error('태그 조회 실패')
      }

      const data = await response.json()
      setTags(data.tags || [])
    } catch (err) {
      setError(err instanceof Error ? err : new Error('알 수 없는 오류'))
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * 태그 생성
   */
  const createTag = useCallback(async (data: CreateTagInput) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '태그 생성 실패')
      }

      const result = await response.json()
      const newTag = result.tag as Tag

      setTags((prev) => [...prev, newTag])
      return newTag
    } catch (err) {
      setError(err instanceof Error ? err : new Error('알 수 없는 오류'))
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * 태그 수정
   */
  const updateTag = useCallback(async (id: string, data: UpdateTagInput) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/tags/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '태그 수정 실패')
      }

      const result = await response.json()
      const updatedTag = result.tag as Tag

      setTags((prev) =>
        prev.map((tag) => (tag.id === id ? updatedTag : tag))
      )

      return updatedTag
    } catch (err) {
      setError(err instanceof Error ? err : new Error('알 수 없는 오류'))
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * 태그 삭제
   */
  const deleteTag = useCallback(async (id: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/tags/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('태그 삭제 실패')
      }

      setTags((prev) => prev.filter((tag) => tag.id !== id))
      return true
    } catch (err) {
      setError(err instanceof Error ? err : new Error('알 수 없는 오류'))
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    tags,
    isLoading,
    error,
    createTag,
    updateTag,
    deleteTag,
    refreshTags: fetchTags,
  }
}
