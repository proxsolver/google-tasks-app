/**
 * 태스크 카드 컴포넌트
 *
 * 제목, 마감일, 태그 표시
 * 완료 토글, 수정, 삭제 버튼
 */

'use client'

import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Check, Edit2, Trash2, Calendar } from 'lucide-react'

interface TaskCardProps {
  id: string
  title: string
  notes?: string
  due?: string
  status: 'needsAction' | 'completed'
  tags: Array<{
    id: string
    name: string
    color: string
  }>
  isUrgent?: boolean
  isImportant?: boolean
  onToggleComplete: (id: string, completed: boolean) => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}

export function TaskCard({
  id,
  title,
  notes,
  due,
  status,
  tags,
  isUrgent,
  isImportant,
  onToggleComplete,
  onEdit,
  onDelete,
}: TaskCardProps) {
  const isCompleted = status === 'completed'

  const getDueDateDisplay = (dueStr?: string) => {
    if (!dueStr) return null

    const dueDate = new Date(dueStr)
    const now = new Date()
    const daysDiff = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    let colorClass = 'text-gray-600'
    if (daysDiff < 0) colorClass = 'text-red-600 font-semibold'
    else if (daysDiff === 0) colorClass = 'text-orange-600 font-semibold'
    else if (daysDiff <= 2) colorClass = 'text-yellow-600'
    else if (daysDiff <= 7) colorClass = 'text-blue-600'

    return (
      <div className={`flex items-center gap-1 text-xs ${colorClass}`}>
        <Calendar size={14} />
        <span>
          {daysDiff === 0
            ? '오늘'
            : daysDiff === 1
            ? '내일'
            : daysDiff === -1
            ? '어제'
            : format(dueDate, 'M월 d일 (E)', { locale: ko })}
          {daysDiff < 0 && ' 지연'}
        </span>
      </div>
    )
  }

  return (
    <div
      className={`bg-white rounded-lg shadow-sm border p-4 transition-all hover:shadow-md ${
        isCompleted ? 'opacity-60' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        {/* 완료 체크박스 */}
        <button
          onClick={() => onToggleComplete(id, !isCompleted)}
          className={`mt-1 flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
            isCompleted
              ? 'bg-green-500 border-green-500 text-white'
              : 'border-gray-300 hover:border-green-500'
          }`}
          aria-label={isCompleted ? '완료 취소' : '완료'}
        >
          {isCompleted && <Check size={14} />}
        </button>

        {/* 내용 */}
        <div className="flex-1 min-w-0">
          <h3
            className={`font-medium text-gray-900 ${
              isCompleted ? 'line-through text-gray-500' : ''
            }`}
          >
            {title}
          </h3>

          {notes && !isCompleted && (
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
              {notes.replace(/🔥 긴급|⭐ 중요/g, '').trim()}
            </p>
          )}

          {/* 마감일 */}
          {due && getDueDateDisplay(due)}

          {/* 긴급/중요 배지 */}
          <div className="flex flex-wrap gap-2 mt-2">
            {isUrgent && (
              <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded-full">
                🔥 긴급
              </span>
            )}
            {isImportant && (
              <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                ⭐ 중요
              </span>
            )}

            {/* 태그 */}
            {tags.map((tag) => (
              <span
                key={tag.id}
                className="px-2 py-0.5 text-xs font-medium rounded-full"
                style={{
                  backgroundColor: `${tag.color}20`,
                  color: tag.color,
                }}
              >
                {tag.name}
              </span>
            ))}
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => onEdit(id)}
            className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
            aria-label="수정"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={() => onDelete(id)}
            className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            aria-label="삭제"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
