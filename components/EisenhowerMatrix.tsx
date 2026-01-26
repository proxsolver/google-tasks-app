/**
 * 아이젠하워 매트릭스 컴포넌트
 *
 * 4분면 뷰 (긴급/중요)
 * 드래그 앤 드롭으로 분면 간 이동
 */

'use client'

import { useState, useMemo } from 'react'
import { TaskCard } from './TaskCard'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { extractPriority, getEisenhowerQuadrant } from '@/lib/utils/priority'

interface Task {
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
}

interface EisenhowerMatrixProps {
  tasks: Task[]
  onToggleComplete: (id: string, completed: boolean) => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onUpdateTask?: (id: string, data: { isUrgent?: boolean; isImportant?: boolean }) => void
}

type QuadrantKey = 'q1' | 'q2' | 'q3' | 'q4'

interface Quadrant {
  id: QuadrantKey
  title: string
  description: string
  color: string
  isUrgent: boolean
  isImportant: boolean
}

const quadrants: Quadrant[] = [
  {
    id: 'q1',
    title: 'Q1: 긴급 + 중요',
    description: '즉시 처리',
    color: 'bg-red-50 border-red-200',
    isUrgent: true,
    isImportant: true,
  },
  {
    id: 'q2',
    title: 'Q2: 비긴급 + 중요',
    description: '계획적으로 처리',
    color: 'bg-blue-50 border-blue-200',
    isUrgent: false,
    isImportant: true,
  },
  {
    id: 'q3',
    title: 'Q3: 긴급 + 비중요',
    description: '위임 가능',
    color: 'bg-yellow-50 border-yellow-200',
    isUrgent: true,
    isImportant: false,
  },
  {
    id: 'q4',
    title: 'Q4: 비긴급 + 비중요',
    description: '나중에 처리',
    color: 'bg-gray-50 border-gray-200',
    isUrgent: false,
    isImportant: false,
  },
]

/**
 * 태스크를 해당 분면에 할당
 */
function getTaskQuadrant(task: Task): QuadrantKey {
  const priority = extractPriority(task.notes)
  return getEisenhowerQuadrant(priority)
}

export function EisenhowerMatrix({
  tasks,
  onToggleComplete,
  onEdit,
  onDelete,
  onUpdateTask,
}: EisenhowerMatrixProps) {
  const [activeId, setActiveId] = useState<string | null>(null)

  // 태스크를 분면별로 그룹화
  const tasksByQuadrant = useMemo(() => {
    const grouped: Record<QuadrantKey, Task[]> = {
      q1: [],
      q2: [],
      q3: [],
      q4: [],
    }

    const incompleteTasks = tasks.filter((t) => t.status === 'needsAction')

    incompleteTasks.forEach((task) => {
      const quadrant = getTaskQuadrant(task)
      grouped[quadrant].push(task)
    })

    return grouped
  }, [tasks])

  // 드래그 센서 설정
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px 이동해야 드래그로 인식
      },
    })
  )

  // 드래그 종료 핸들러
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over || !onUpdateTask) return

    const taskId = active.id as string
    const targetQuadrant = over.id as QuadrantKey

    const targetQuadrantConfig = quadrants.find((q) => q.id === targetQuadrant)
    if (!targetQuadrantConfig) return

    onUpdateTask(taskId, {
      isUrgent: targetQuadrantConfig.isUrgent,
      isImportant: targetQuadrantConfig.isImportant,
    })
  }

  const activeTask = activeId
    ? tasks.find((t) => t.id === activeId)
    : null

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      onDragStart={(event) => setActiveId(event.active.id as string)}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {quadrants.map((quadrant) => (
          <div
            key={quadrant.id}
            id={quadrant.id}
            className={`${quadrant.color} border-2 rounded-lg p-4 min-h-[300px]`}
            data-quadrant={quadrant.id}
          >
            <div className="mb-3">
              <h3 className="font-semibold text-gray-900">{quadrant.title}</h3>
              <p className="text-sm text-gray-600">{quadrant.description}</p>
              <p className="text-xs text-gray-500 mt-1">
                {tasksByQuadrant[quadrant.id].length}개 태스크
              </p>
            </div>

            <div className="space-y-3">
              {tasksByQuadrant[quadrant.id].length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">
                  태스크가 없습니다
                </div>
              ) : (
                tasksByQuadrant[quadrant.id].map((task) => (
                  <div key={task.id}>
                    <TaskCard
                      {...task}
                      onToggleComplete={onToggleComplete}
                      onEdit={onEdit}
                      onDelete={onDelete}
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      <DragOverlay>
        {activeTask ? (
          <div className="rotate-3 opacity-80 scale-105">
            <TaskCard
              {...activeTask}
              onToggleComplete={() => {}}
              onEdit={() => {}}
              onDelete={() => {}}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
