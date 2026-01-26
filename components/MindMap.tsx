/**
 * 마인드맵 컴포넌트
 *
 * React Flow 기반 계층형 트리 구조 시각화
 */

'use client'

import { useCallback, useMemo } from 'react'
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  NodeTypes,
  Position,
} from 'reactflow'
import 'reactflow/dist/style.css'

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

interface MindMapProps {
  tasks: Task[]
  onNodeClick?: (taskId: string) => void
}

/**
 * 커스텀 태스크 노드 컴포넌트
 */
function TaskNode({ data }: { data: any }) {
  return (
    <div
      className={`px-4 py-2 rounded-lg shadow-lg border-2 min-w-[200px] max-w-[300px] ${
        data.completed
          ? 'bg-gray-100 border-gray-300'
          : data.isUrgent && data.isImportant
          ? 'bg-red-50 border-red-400'
          : data.isImportant
          ? 'bg-blue-50 border-blue-400'
          : data.isUrgent
          ? 'bg-yellow-50 border-yellow-400'
          : 'bg-white border-gray-300'
      }`}
    >
      <div className="font-semibold text-gray-900 text-sm">{data.label}</div>

      {data.due && (
        <div className="text-xs text-gray-600 mt-1">📅 {new Date(data.due).toLocaleDateString('ko-KR')}</div>
      )}

      <div className="flex flex-wrap gap-1 mt-2">
        {data.isUrgent && (
          <span className="px-1.5 py-0.5 text-xs bg-red-100 text-red-700 rounded">
            🔥 긴급
          </span>
        )}
        {data.isImportant && (
          <span className="px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
            ⭐ 중요
          </span>
        )}
        {data.tags?.map((tag: any) => (
          <span
            key={tag.id}
            className="px-1.5 py-0.5 text-xs rounded"
            style={{
              backgroundColor: `${tag.color}30`,
              color: tag.color,
            }}
          >
            {tag.name}
          </span>
        ))}
      </div>
    </div>
  )
}

const nodeTypes: NodeTypes = {
  task: TaskNode,
}

/**
 * 태스크를 트리 구조로 변환
 */
function buildTaskTree(tasks: Task[]): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = []
  const edges: Edge[] = []

  // 루트 노드 생성
  nodes.push({
    id: 'root',
    type: 'task',
    position: { x: 0, y: 0 },
    data: {
      label: '모든 태스크',
      isUrgent: false,
      isImportant: false,
      tags: [],
    },
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
  })

  // 4분면별 그룹핑
  const quadrants = {
    q1: { label: 'Q1: 긴급+중요', tasks: [] as Task[], isUrgent: true, isImportant: true },
    q2: { label: 'Q2: 비긴급+중요', tasks: [] as Task[], isUrgent: false, isImportant: true },
    q3: { label: 'Q3: 긴급+비중요', tasks: [] as Task[], isUrgent: true, isImportant: false },
    q4: { label: 'Q4: 비긴급+비중요', tasks: [] as Task[], isUrgent: false, isImportant: false },
  }

  // 태스크 분류
  tasks.forEach((task) => {
    const notes = task.notes || ''
    const isUrgent = notes.includes('🔥 긴급')
    const isImportant = notes.includes('⭐ 중요')

    if (isUrgent && isImportant) quadrants.q1.tasks.push(task)
    else if (!isUrgent && isImportant) quadrants.q2.tasks.push(task)
    else if (isUrgent && !isImportant) quadrants.q3.tasks.push(task)
    else quadrants.q4.tasks.push(task)
  })

  // 2분면 노드 생성 (Y 위치 계산)
  const quadrantEntries = Object.entries(quadrants) as [string, typeof quadrants[keyof typeof quadrants]][]
  const spacingY = 400

  quadrantEntries.forEach(([key, quadrant], index) => {
    const quadrantId = `quadrant-${key}`
    const yPosition = (index - 1.5) * spacingY

    // 분면 노드
    nodes.push({
      id: quadrantId,
      type: 'task',
      position: { x: 400, y: yPosition },
      data: {
        label: quadrant.label,
        isUrgent: quadrant.isUrgent,
        isImportant: quadrant.isImportant,
        tags: [],
      },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    })

    // 루트와 연결
    edges.push({
      id: `root-${quadrantId}`,
      source: 'root',
      target: quadrantId,
      animated: true,
      style: { stroke: '#cbd5e1', strokeWidth: 2 },
    })

    // 태스크 노드 생성
    const taskSpacingY = 120
    quadrant.tasks.forEach((task, taskIndex) => {
      const taskYPosition = yPosition + (taskIndex - quadrant.tasks.length / 2) * taskSpacingY

      nodes.push({
        id: task.id,
        type: 'task',
        position: { x: 800, y: taskYPosition },
        data: {
          label: task.title,
          due: task.due,
          completed: task.status === 'completed',
          isUrgent: quadrant.isUrgent,
          isImportant: quadrant.isImportant,
          tags: task.tags,
        },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
      })

      // 분면과 연결
      edges.push({
        id: `${quadrantId}-${task.id}`,
        source: quadrantId,
        target: task.id,
        animated: false,
        style: { stroke: '#e2e8f0', strokeWidth: 1 },
      })
    })
  })

  return { nodes, edges }
}

export function MindMap({ tasks, onNodeClick }: MindMapProps) {
  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => buildTaskTree(tasks),
    [tasks]
  )

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  )

  const onNodeClickHandler = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      if (node.id.startsWith('task-') && onNodeClick) {
        onNodeClick(node.id)
      }
    },
    [onNodeClick]
  )

  return (
    <div className="w-full h-[800px] bg-gray-50 rounded-lg border">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClickHandler}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
      >
        <Background color="#cbd5e1" gap={16} />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            if (node.data.isUrgent && node.data.isImportant) return '#fecaca'
            if (node.data.isImportant) return '#dbeafe'
            if (node.data.isUrgent) return '#fef3c7'
            return '#ffffff'
          }}
          maskColor="rgba(0, 0, 0, 0.1)"
        />
      </ReactFlow>
    </div>
  )
}
