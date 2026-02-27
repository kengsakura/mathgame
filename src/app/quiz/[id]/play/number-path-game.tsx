'use client'
import { useState, useRef, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Trophy, User, Target, RotateCcw } from 'lucide-react'
import { Progress } from '@/components/ui/progress'

// ====== Config ======
// ใช้ quiz fields แทน: time_per_question = targetSum, total_questions = minPaths
// difficulty: easy=2 ตัว, medium=3 ตัว, hard=4 ตัว

const COLS = 5
const ROWS = 10
const TOTAL = COLS * ROWS // 50

interface Quiz {
  id: string
  name: string
  time_per_question: number  // ↔ target sum
  total_questions: number    // ↔ min paths to pass
  passing_threshold: number
  difficulty: 'easy' | 'medium' | 'hard'
}

interface Props { quiz: Quiz; studentName: string; id: string }

type CellState = 'unused' | 'used' | 'path' | 'ok' | 'err'
interface Cell { value: number; state: CellState }

type Phase = 'ready' | 'playing' | 'won' | 'over'

function getPathLength(d: string) { return d === 'easy' ? 2 : d === 'hard' ? 4 : 3 }

function initCells(): Cell[] {
  return Array.from({ length: TOTAL }, () => ({ value: Math.floor(Math.random() * 8), state: 'unused' }))
}

function isAdjacent(a: number, b: number) {
  const ra = Math.floor(a / COLS), ca = a % COLS
  const rb = Math.floor(b / COLS), cb = b % COLS
  return Math.abs(ra - rb) <= 1 && Math.abs(ca - cb) <= 1 && a !== b
}

// DFS: มีทางที่ยังหาได้อยู่ไหม
function hasValidPath(cells: Cell[], pathLen: number, target: number): boolean {
  function dfs(idx: number, visited: Set<number>, sum: number, depth: number): boolean {
    if (depth === pathLen) return sum === target
    const row = Math.floor(idx / COLS), col = idx % COLS
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (!dr && !dc) continue
        const nr = row + dr, nc = col + dc
        if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) continue
        const ni = nr * COLS + nc
        if (visited.has(ni) || cells[ni].state === 'used') continue
        visited.add(ni)
        if (dfs(ni, visited, sum + cells[ni].value, depth + 1)) return true
        visited.delete(ni)
      }
    }
    return false
  }
  for (let i = 0; i < TOTAL; i++) {
    if (cells[i].state === 'used') continue
    const v = new Set<number>([i])
    if (dfs(i, v, cells[i].value, 1)) return true
  }
  return false
}

export function NumberPathGame({ quiz, studentName, id }: Props) {
  const router = useRouter()
  const pathLen = getPathLength(quiz.difficulty)
  const targetSum = quiz.time_per_question
  const minPaths = quiz.total_questions

  const [phase, setPhase] = useState<Phase>('ready')
  const [cells, setCells] = useState<Cell[]>([])
  const [path, setPath] = useState<number[]>([])
  const [score, setScore] = useState(0)
  const [startTime, setStartTime] = useState(0)
  const [timeTaken, setTimeTaken] = useState(0)
  const [noPathLeft, setNoPathLeft] = useState(false)

  const cellsRef = useRef<Cell[]>([])
  const pathRef = useRef<number[]>([])
  const flashRef = useRef(false)
  const isDragging = useRef(false)
  const scoreRef = useRef(0)

  const syncCells = (c: Cell[]) => { cellsRef.current = c; setCells([...c]) }
  const syncPath = (p: number[]) => { pathRef.current = p; setPath([...p]) }

  const startGame = useCallback(() => {
    const c = initCells()
    scoreRef.current = 0
    cellsRef.current = c
    pathRef.current = []
    flashRef.current = false
    setScore(0)
    setCells([...c])
    setPath([])
    setNoPathLeft(false)
    setStartTime(Date.now())
    setPhase('playing')
  }, [])

  const clearPath = useCallback(() => {
    const c = cellsRef.current.map(cell =>
      cell.state === 'path' ? { ...cell, state: 'unused' as const } : cell
    )
    syncCells(c)
    syncPath([])
  }, [])

  // ===== Submit path =====
  const submitPath = useCallback((p: number[]) => {
    if (p.length !== pathLen) return
    const sum = p.reduce((s, i) => s + cellsRef.current[i].value, 0)
    const ok = sum === targetSum

    flashRef.current = true
    const c = cellsRef.current.map((cell, i) =>
      p.includes(i) ? { ...cell, state: (ok ? 'ok' : 'err') as CellState } : cell
    )
    syncCells(c)

    setTimeout(() => {
      if (ok) {
        const newCells = cellsRef.current.map((cell, i) =>
          p.includes(i) ? { ...cell, state: 'used' as const } : cell
        )
        syncCells(newCells)
        syncPath([])
        flashRef.current = false

        const newScore = scoreRef.current + 1
        scoreRef.current = newScore
        setScore(newScore)

        if (newScore >= minPaths) {
          setTimeTaken(Math.round((Date.now() - startTime) / 1000))
          setTimeout(() => setPhase('won'), 200)
          return
        }
        // Check if no paths remain
        if (!hasValidPath(newCells, pathLen, targetSum)) {
          setNoPathLeft(true)
          setTimeTaken(Math.round((Date.now() - startTime) / 1000))
          setTimeout(() => setPhase('over'), 300)
        }
      } else {
        const resetCells = cellsRef.current.map((cell, i) =>
          p.includes(i) ? { ...cell, state: 'unused' as const } : cell
        )
        syncCells(resetCells)
        syncPath([])
        flashRef.current = false
      }
    }, ok ? 500 : 400)
  }, [pathLen, targetSum, minPaths, startTime])

  // ===== Cell interaction =====
  const handleCellInteract = useCallback((idx: number) => {
    if (flashRef.current || phase !== 'playing') return
    const cell = cellsRef.current[idx]
    if (!cell || cell.state === 'used') return

    const p = pathRef.current

    // Tap last cell → backtrack
    if (p.length > 0 && p[p.length - 1] === idx) {
      const newPath = p.slice(0, -1)
      const c = cellsRef.current.map((cell, i) =>
        i === idx ? { ...cell, state: 'unused' as const } : cell
      )
      syncCells(c)
      syncPath(newPath)
      return
    }
    // Already in path (not last) → ignore
    if (p.includes(idx)) return
    // Must be adjacent to last
    if (p.length > 0 && !isAdjacent(p[p.length - 1], idx)) return

    // Add to path
    const newPath = [...p, idx]
    const c = cellsRef.current.map((cell, i) =>
      i === idx ? { ...cell, state: 'path' as const } : cell
    )
    syncCells(c)
    syncPath(newPath)

    if (newPath.length === pathLen) {
      submitPath(newPath)
    }
  }, [phase, pathLen, submitPath])

  // ===== Pointer events for drag =====
  const onCellPointerDown = useCallback((e: React.PointerEvent, idx: number) => {
    e.preventDefault()
    isDragging.current = true
    handleCellInteract(idx)
  }, [handleCellInteract])

  const onCellPointerEnter = useCallback((idx: number) => {
    if (!isDragging.current) return
    handleCellInteract(idx)
  }, [handleCellInteract])

  const onPointerUp = useCallback(() => { isDragging.current = false }, [])

  // Reset drag on pointer leave grid
  useEffect(() => {
    const up = () => { isDragging.current = false }
    window.addEventListener('pointerup', up)
    return () => window.removeEventListener('pointerup', up)
  }, [])

  // ===== Cell color =====
  function cellClass(cell: Cell, idx: number) {
    const inPath = cell.state === 'path'
    const pathPos = path.indexOf(idx)
    const base = 'aspect-square rounded-md flex items-center justify-center font-bold select-none transition-all duration-100 cursor-pointer text-base'
    if (cell.state === 'used') return `${base} bg-gray-200 text-gray-400 cursor-default opacity-50`
    if (cell.state === 'ok') return `${base} bg-green-400 text-white scale-110 shadow-lg`
    if (cell.state === 'err') return `${base} bg-red-400 text-white scale-95`
    if (inPath) return `${base} bg-blue-500 text-white shadow-md scale-105 ring-2 ring-blue-300`
    return `${base} bg-white text-gray-800 border border-gray-200 hover:bg-blue-50 active:scale-95`
  }

  const currentSum = path.reduce((s, i) => s + (cellsRef.current[i]?.value ?? 0), 0)

  // ===== READY =====
  if (phase === 'ready') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <Card className="max-w-sm w-full border-0 bg-white/70 backdrop-blur-sm">
          <CardHeader className="text-center pb-2">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Target className="h-8 w-8 text-purple-600" />
            </div>
            <h1 className="text-xl font-bold">{quiz.name}</h1>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 text-gray-700">
              <User className="h-4 w-4 text-purple-500" />
              <span className="font-medium text-sm">{studentName}</span>
            </div>
            <div className="bg-purple-50 rounded-xl p-4 text-center space-y-1">
              <p className="text-2xl font-black text-purple-700">
                หา {pathLen} ตัวที่ติดกัน รวมได้ <span className="text-orange-500">{targetSum}</span>
              </p>
              <p className="text-sm text-gray-500">ต้องหาให้ได้ <strong>{minPaths}</strong> คำตอบเพื่อผ่าน</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 space-y-1">
              <p>• ลากหรือกดตัวเลขที่ <strong>ติดกัน</strong> (8 ทิศทาง) ทีละ {pathLen} ตัว</p>
              <p>• ถ้าผลรวม = {targetSum} → ✅ เซลล์นั้นหายออกไป</p>
              <p>• ถ้าผลรวม ≠ {targetSum} → ❌ เริ่มใหม่</p>
              <p>• กดตัวสุดท้ายอีกครั้งเพื่อถอยหลัง</p>
              <p>• ไม่มีกำหนดเวลา!</p>
            </div>
            <Button onClick={startGame} className="w-full bg-purple-600 hover:bg-purple-700" size="lg">
              เริ่มเลย!
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ===== WON / OVER =====
  if (phase === 'won' || phase === 'over') {
    const passed = phase === 'won'
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <Card className="max-w-sm w-full border-0 bg-white/70 backdrop-blur-sm">
          <CardHeader className="text-center pb-2">
            <div className="text-5xl mb-2">{passed ? '🏆' : noPathLeft ? '🔍' : '💪'}</div>
            <h1 className="text-2xl font-bold">{passed ? 'ผ่านแล้ว!' : 'หาไม่ได้แล้ว'}</h1>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center space-y-2">
              <div className="text-5xl font-black text-purple-600">{score}</div>
              <div className="text-gray-500 text-sm">คำตอบที่หาได้ (เป้าหมาย {minPaths})</div>
              {noPathLeft && !passed && (
                <p className="text-sm text-orange-600 bg-orange-50 rounded-lg p-2">
                  ไม่มีทางที่เหลือแล้ว หาได้ {score}/{minPaths}
                </p>
              )}
              <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {passed ? '✅ ผ่านเกณฑ์' : '❌ ไม่ผ่านเกณฑ์'}
              </div>
            </div>
            <Progress value={Math.min(100, Math.round(score / minPaths * 100))} className="h-2" />
            <p className="text-center text-xs text-gray-400">เวลา: {Math.floor(timeTaken / 60)}:{(timeTaken % 60).toString().padStart(2, '0')}</p>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" onClick={startGame}>
                <RotateCcw className="h-4 w-4 mr-1" /> เล่นใหม่
              </Button>
              <Button onClick={() => router.push('/student')}>กลับหน้าหลัก</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ===== PLAYING =====
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-sm mx-auto px-2 py-3">

        {/* Header */}
        <div className="flex justify-between items-center mb-2">
          <div className="text-sm font-bold text-purple-700">
            หาได้ <span className="text-2xl">{score}</span>
            <span className="text-gray-400 text-xs font-normal"> / เป้า {minPaths}</span>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500">เป้าหมาย</div>
            <div className="text-xl font-black text-orange-500">{targetSum}</div>
          </div>
        </div>

        {/* Progress */}
        <Progress value={Math.min(100, score / minPaths * 100)} className="h-1.5 mb-2" />

        {/* Path status */}
        <div className="flex items-center justify-between mb-2 bg-white/70 rounded-lg px-3 py-1.5 text-sm">
          <div>
            เลือก: <strong className="text-blue-600">{path.length}</strong> / {pathLen} ตัว
          </div>
          <div>
            รวม: <strong className={`${currentSum > targetSum ? 'text-red-500' : currentSum === targetSum && path.length === pathLen ? 'text-green-600' : 'text-gray-800'}`}>
              {path.length > 0 ? currentSum : '-'}
            </strong>
            {' / '}{targetSum}
          </div>
          {path.length > 0 && (
            <button
              className="text-xs text-gray-400 hover:text-gray-600 underline"
              onClick={clearPath}
            >
              ล้าง
            </button>
          )}
        </div>

        {/* Grid 5×10 */}
        <div
          className="grid gap-1"
          style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}
          onPointerUp={onPointerUp}
        >
          {cells.map((cell, idx) => (
            <div
              key={idx}
              className={cellClass(cell, idx)}
              style={{ touchAction: 'none' }}
              onPointerDown={(e) => onCellPointerDown(e, idx)}
              onPointerEnter={() => onCellPointerEnter(idx)}
            >
              {cell.state !== 'used' ? cell.value : ''}
            </div>
          ))}
        </div>

        {/* Path sequence display */}
        {path.length > 0 && (
          <div className="mt-2 text-center text-xs text-gray-400">
            {path.map(i => cellsRef.current[i]?.value ?? '?').join(' + ')} = {currentSum}
          </div>
        )}

      </div>
    </div>
  )
}
