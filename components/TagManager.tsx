/**
 * 태그 관리 컴포넌트
 *
 * 태그 생성, 수정, 삭제
 */

'use client'

import { useState } from 'react'
import { Plus, Edit2, Trash2, X } from 'lucide-react'

interface Tag {
  id: string
  name: string
  color: string
  _count?: {
    taskTags: number
  }
}

interface TagManagerProps {
  tags: Tag[]
  onCreateTag: (data: { name: string; color: string }) => Promise<Tag | null>
  onUpdateTag: (id: string, data: { name?: string; color?: string }) => Promise<Tag | null>
  onDeleteTag: (id: string) => Promise<boolean>
}

const PRESET_COLORS = [
  '#3B82F6', // Blue
  '#EF4444', // Red
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#6366F1', // Indigo
  '#14B8A6', // Teal
]

export function TagManager({
  tags,
  onCreateTag,
  onUpdateTag,
  onDeleteTag,
}: TagManagerProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    color: PRESET_COLORS[0],
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const result = editingId
        ? await onUpdateTag(editingId, formData)
        : await onCreateTag(formData)

      if (result) {
        setFormData({ name: '', color: PRESET_COLORS[0] })
        setIsCreating(false)
        setEditingId(null)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (tag: Tag) => {
    setEditingId(tag.id)
    setFormData({ name: tag.name, color: tag.color })
  }

  const handleCancel = () => {
    setIsCreating(false)
    setEditingId(null)
    setFormData({ name: '', color: PRESET_COLORS[0] })
    setError(null)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return

    const success = await onDeleteTag(id)
    if (!success) {
      setError('태그 삭제에 실패했습니다')
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">태그 관리</h2>
        {!isCreating && !editingId && (
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={16} />
            새 태그
          </button>
        )}
      </div>

      {/* 생성/수정 폼 */}
      {(isCreating || editingId) && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="space-y-4">
            <div>
              <label htmlFor="tag-name" className="block text-sm font-medium text-gray-700 mb-1">
                태그 이름
              </label>
              <input
                type="text"
                id="tag-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="태그 이름 입력"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                색상
              </label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({ ...formData, color })}
                    className={`w-10 h-10 rounded-lg border-2 transition-all ${
                      formData.color === color
                        ? 'border-gray-900 scale-110'
                        : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                    aria-label={`색상 ${color}`}
                  />
                ))}
              </div>
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                {error}
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isSubmitting || !formData.name.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? '저장 중...' : editingId ? '수정' : '생성'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
            </div>
          </div>
        </form>
      )}

      {/* 태그 목록 */}
      {tags.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          생성된 태그가 없습니다
        </div>
      ) : (
        <div className="space-y-2">
          {tags.map((tag) => (
            <div
              key={tag.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg group"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-full"
                  style={{ backgroundColor: tag.color }}
                />
                <div>
                  <div className="font-medium text-gray-900">{tag.name}</div>
                  <div className="text-xs text-gray-500">
                    {tag._count?.taskTags || 0}개 태스크
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleEdit(tag)}
                  className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  aria-label="수정"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => handleDelete(tag.id)}
                  className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                  aria-label="삭제"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
