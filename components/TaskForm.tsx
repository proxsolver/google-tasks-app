/**
 * 태스크 생성/수정 폼 컴포넌트
 *
 * Zod 검증 통합
 */

'use client'

import { useState, useEffect } from 'react'
import { X, Calendar, Flag } from 'lucide-react'

interface Task {
  id: string
  title: string
  notes?: string
  due?: string
  isUrgent?: boolean
  isImportant?: boolean
  tagIds?: string[]
}

interface Tag {
  id: string
  name: string
  color: string
}

interface TaskFormProps {
  task?: Task
  tags: Tag[]
  onSubmit: (data: {
    title: string
    notes?: string
    due?: string
    isUrgent: boolean
    isImportant: boolean
    tagIds?: string[]
  }) => Promise<boolean>
  onCancel: () => void
}

export function TaskForm({ task, tags, onSubmit, onCancel }: TaskFormProps) {
  const [title, setTitle] = useState(task?.title || '')
  const [notes, setNotes] = useState(task?.notes || '')
  const [due, setDue] = useState(task?.due || '')
  const [isUrgent, setIsUrgent] = useState(task?.isUrgent || false)
  const [isImportant, setIsImportant] = useState(task?.isImportant || false)
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(
    task?.tagIds || []
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const isEdit = !!task

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!title.trim()) {
      newErrors.title = '제목은 필수 항목입니다'
    } else if (title.length > 200) {
      newErrors.title = '제목은 200자 이하여야 합니다'
    }

    if (notes && notes.length > 5000) {
      newErrors.notes = '메모는 5000자 이하여야 합니다'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    setIsSubmitting(true)

    try {
      await onSubmit({
        title: title.trim(),
        notes: notes.trim() || undefined,
        due: due || undefined,
        isUrgent,
        isImportant,
        tagIds: selectedTagIds.length > 0 ? selectedTagIds : undefined,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleTag = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    )
  }

  // Min date for due date input (today)
  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEdit ? '태스크 수정' : '새 태스크'}
          </h2>
          <button
            onClick={onCancel}
            className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
            aria-label="닫기"
          >
            <X size={20} />
          </button>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* 제목 */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              제목 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="태스크 제목을 입력하세요"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.title ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.title && (
              <p className="text-sm text-red-600 mt-1">{errors.title}</p>
            )}
          </div>

          {/* 메모 */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              메모
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="추가 정보를 입력하세요 (선택)"
              rows={3}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.notes ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.notes && (
              <p className="text-sm text-red-600 mt-1">{errors.notes}</p>
            )}
          </div>

          {/* 마감일 */}
          <div>
            <label htmlFor="due" className="block text-sm font-medium text-gray-700 mb-1">
              <Calendar size={16} className="inline mr-1" />
              마감일
            </label>
            <input
              type="date"
              id="due"
              value={due}
              onChange={(e) => setDue(e.target.value)}
              min={today}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* 긴급/중요 체크박스 */}
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isUrgent}
                onChange={(e) => setIsUrgent(e.target.checked)}
                className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
              />
              <span className="text-sm text-gray-700">
                <Flag size={16} className="inline mr-1 text-red-600" />
                긴급
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isImportant}
                onChange={(e) => setIsImportant(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">
                ⭐ 중요
              </span>
            </label>
          </div>

          {/* 태그 선택 */}
          {tags.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                태그
              </label>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    className={`px-3 py-1.5 text-sm rounded-full border-2 transition-all ${
                      selectedTagIds.includes(tag.id)
                        ? 'border-current'
                        : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                    style={{
                      backgroundColor: selectedTagIds.includes(tag.id)
                        ? `${tag.color}20`
                        : 'transparent',
                      color: tag.color,
                    }}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 버튼 */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={isSubmitting}
            >
              취소
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? '저장 중...' : isEdit ? '수정' : '생성'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
