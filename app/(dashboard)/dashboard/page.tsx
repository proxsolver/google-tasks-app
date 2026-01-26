/**
 * 메인 대시보드 페이지
 *
 * 태스크 관리, 아이젠하워 매트릭스, 마인드맵 뷰
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useTasks } from '@/hooks/useTasks'
import { useTags } from '@/hooks/useTags'
import { EisenhowerMatrix } from '@/components/EisenhowerMatrix'
import { MindMap } from '@/components/MindMap'
import { TaskForm } from '@/components/TaskForm'
import { TagManager } from '@/components/TagManager'
import { Plus, LayoutGrid, Network, LogOut, Tags, RefreshCw } from 'lucide-react'
import { signOut } from 'next-auth/react'

type ViewType = 'eisenhower' | 'mindmap'

export default function DashboardPage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const { tasks, isLoading: tasksLoading, refreshTasks, createTask, updateTask, deleteTask, toggleTaskCompletion } = useTasks()
  const { tags, refreshTags, createTag, updateTag, deleteTag } = useTags()

  const [view, setView] = useState<ViewType>('eisenhower')
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [showTagManager, setShowTagManager] = useState(false)

  // 초기 로딩
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  // 태스크/태그 데이터 로드
  useEffect(() => {
    if (user) {
      refreshTasks()
      refreshTags()
    }
  }, [user, refreshTasks, refreshTags])

  const handleCreateTask = async (data: any) => {
    const result = await createTask(data)
    if (result) {
      setShowTaskForm(false)
    }
    return result !== null
  }

  const handleUpdateTask = async (id: string) => {
    // 태스크 편집 로직 (TaskForm에 전달할 데이터)
    setEditingTaskId(id)
    setShowTaskForm(true)
  }

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' })
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-gray-900">
                Google Tasks 매트릭스
              </h1>
              <span className="text-sm text-gray-500">
                {tasks.length}개 태스크
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* 뷰 전환 */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setView('eisenhower')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    view === 'eisenhower'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <LayoutGrid size={16} />
                  매트릭스
                </button>
                <button
                  onClick={() => setView('mindmap')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    view === 'mindmap'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Network size={16} />
                  마인드맵
                </button>
              </div>

              {/* 새 태스크 버튼 */}
              <button
                onClick={() => setShowTaskForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus size={18} />
                새 태스크
              </button>

              {/* 태그 관리 버튼 */}
              <button
                onClick={() => setShowTagManager(!showTagManager)}
                className={`p-2 rounded-lg transition-colors ${
                  showTagManager
                    ? 'bg-purple-100 text-purple-600'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                aria-label="태그 관리"
              >
                <Tags size={20} />
              </button>

              {/* 새로고침 */}
              <button
                onClick={refreshTasks}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="새로고침"
              >
                <RefreshCw size={20} />
              </button>

              {/* 로그아웃 */}
              <button
                onClick={handleLogout}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="로그아웃"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 태그 관리 (사이드바) */}
          {showTagManager && (
            <div className="lg:col-span-1">
              <TagManager
                tags={tags}
                onCreateTag={createTag}
                onUpdateTag={updateTag}
                onDeleteTag={deleteTag}
              />
            </div>
          )}

          {/* 메인 뷰 */}
          <div className={showTagManager ? 'lg:col-span-3' : 'lg:col-span-4'}>
            {tasksLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
              </div>
            ) : view === 'eisenhower' ? (
              <EisenhowerMatrix
                tasks={tasks}
                onToggleComplete={toggleTaskCompletion}
                onEdit={handleUpdateTask}
                onDelete={deleteTask}
                onUpdateTask={updateTask}
              />
            ) : (
              <MindMap tasks={tasks} />
            )}
          </div>
        </div>
      </main>

      {/* 태스크 폼 모달 */}
      {showTaskForm && (
        <TaskForm
          tags={tags}
          onSubmit={handleCreateTask}
          onCancel={() => {
            setShowTaskForm(false)
            setEditingTaskId(null)
          }}
        />
      )}
    </div>
  )
}
