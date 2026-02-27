'use client'
import { useState, useRef, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { User, Target, RotateCcw } from 'lucide-react'
import { Progress } from '@/components/ui/progress'

// ====== Config ======
// time_per_question = targetSum, passing_threshold = % ของคำตอบที่เป็นไปได้
// difficulty: easy=2 ตัว, medium=3 ตัว, hard=4 ตัว
// total_questions = จำนวนกระดาน

const COLS = 9
const ROWS = 13
const TOTAL = COLS * ROWS // 117

interface Quiz {
  id: string
  name: string
  time_per_question: number  // ↔ target sum
  total_questions: number    // ↔ number of boards
  passing_threshold: number  // % of achievable paths needed to pass
  difficulty: 'easy' | 'medium' | 'hard'
}

interface Props { quiz: Quiz; studentName: string; id: string }

type CellState = 'unused' | 'used' | 'path' | 'ok' | 'err'
interface Cell { value: number; state: CellState }

type Phase = 'ready' | 'playing' | 'next_board' | 'won' | 'over'

function getPathLength(d: string) { return d === 'easy' ? 2 : d === 'hard' ? 4 : 3 }

function initCells(): Cell[] {
  return Array.from({ length: TOTAL }, () => ({ value: Math.floor(Math.random() * 8), state: 'unused' }))
}

function isAdjacent(a: number, b: number) {
  const ra = Math.floor(a / COLS), ca = a % COLS
  const rb = Math.floor(b / COLS), cb = b % COLS
  return Math.abs(ra - rb) <= 1 && Math.abs(ca - cb) <= 1 && a !== b
}

// นับจำนวนเส้นทางที่ถูกต้องทั้งหมดในกริด (ordered paths)
function countValidPaths(cells: Cell[], pathLen: number, target: number): number {
  let count = 0
  function dfs(idx: number, visited: Set<number>, sum: number, depth: number) {
    if (depth === pathLen) { if (sum === target) count++; return }
    const row = Math.floor(idx / COLS), col = idx % COLS
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (!dr && !dc) continue
        const nr = row + dr, nc = col + dc
        if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) continue
        const ni = nr * COLS + nc
        if (visited.has(ni) || cells[ni].state === 'used') continue
        visited.add(ni)
        dfs(ni, visited, sum + cells[ni].value, depth + 1)
        visited.delete(ni)
      }
    }
  }
  for (let i = 0; i < TOTAL; i++) {
    if (cells[i].state === 'used') continue
    const v = new Set<number>([i])
    dfs(i, v, cells[i].value, 1)
  }
  return count
}

// Simulate greedy: นับว่าจริงๆ แล้วหาได้สูงสุดกี่เส้นทาง (lower bound ที่ทำได้จริง)
function simulateAchievable(initialCells: Cell[], pathLen: number, target: number): number {
  const cells = initialCells.map(c => ({ ...c }))
  let found = 0

  function dfsFind(idx: number, visited: Set<number>, sum: number, depth: number): number[] | null {
    if (depth === pathLen) return sum === target ? Array.from(visited) : null
    const row = Math.floor(idx / COLS), col = idx % COLS
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (!dr && !dc) continue
        const nr = row + dr, nc = col + dc
        if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) continue
        const ni = nr * COLS + nc
        if (visited.has(ni) || cells[ni].state === 'used') continue
        visited.add(ni)
        const res = dfsFind(ni, visited, sum + cells[ni].value, depth + 1)
        if (res) return res
        visited.delete(ni)
      }
    }
    return null
  }

  const starts = Array.from({ length: TOTAL }, (_, i) => i).sort(() => Math.random() - 0.5)
  for (const start of starts) {
    if (cells[start].state === 'used') continue
    const path = dfsFind(start, new Set([start]), cells[start].value, 1)
    if (path) {
      path.forEach(i => { cells[i] = { ...cells[i], state: 'used' } })
      found++
    }
  }
  return found
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
  const totalBoards = Math.max(1, quiz.total_questions)

  const [phase, setPhase] = useState<Phase>('ready')
  const [cells, setCells] = useState<Cell[]>([])
  const [path, setPath] = useState<number[]>([])
  const [score, setScore] = useState(0)          // คะแนนกระดานปัจจุบัน
  const [minPaths, setMinPaths] = useState(0)     // เป้ากระดานปัจจุบัน
  const [board, setBoard] = useState(1)           // กระดานปัจจุบัน (1-indexed)
  const [totalScore, setTotalScore] = useState(0) // คะแนนสะสมทุกกระดาน
  const [totalMinPaths, setTotalMinPaths] = useState(0) // เป้าสะสมทุกกระดาน
  const [timeTaken, setTimeTaken] = useState(0)

  const cellsRef = useRef<Cell[]>([])
  const pathRef = useRef<number[]>([])
  const flashRef = useRef(false)
  const isDragging = useRef(false)
  const scoreRef = useRef(0)          // คะแนนกระดานปัจจุบัน
  const minPathsRef = useRef(0)       // เป้ากระดานปัจจุบัน
  const totalScoreRef = useRef(0)     // คะแนนสะสม
  const totalMinRef = useRef(0)       // เป้าสะสม
  const boardRef = useRef(1)          // กระดานปัจจุบัน
  const startTimeRef = useRef(0)

  const syncCells = (c: Cell[]) => { cellsRef.current = c; setCells([...c]) }
  const syncPath = (p: number[]) => { pathRef.current = p; setPath([...p]) }

  // สร้างกระดานใหม่ (ไม่ reset คะแนนสะสม)
  const startBoard = useCallback(() => {
    let c: Cell[]
    let achievable: number
    let attempts = 0
    do {
      c = initCells()
      const total = countValidPaths(c, pathLen, targetSum)
      achievable = total > 0 ? simulateAchievable(c, pathLen, targetSum) : 0
      attempts++
    } while (achievable < 3 && attempts < 100)

    const minP = Math.max(1, Math.ceil(achievable * quiz.passing_threshold / 100))
    totalMinRef.current += minP
    minPathsRef.current = minP
    scoreRef.current = 0
    setMinPaths(minP)
    setTotalMinPaths(totalMinRef.current)
    setScore(0)
    cellsRef.current = c
    pathRef.current = []
    flashRef.current = false
    setCells([...c])
    setPath([])
    setPhase('playing')
  }, [pathLen, targetSum, quiz.passing_threshold])

  // เริ่มเกมใหม่ตั้งแต่ต้น
  const startGame = useCallback(() => {
    totalScoreRef.current = 0
    totalMinRef.current = 0
    boardRef.current = 1
    startTimeRef.current = Date.now()
    setTotalScore(0)
    setTotalMinPaths(0)
    setBoard(1)
    setTimeTaken(0)
    startBoard()
  }, [startBoard])

  // ไปกระดานถัดไป
  const goNextBoard = useCallback(() => {
    boardRef.current += 1
    setBoard(boardRef.current)
    startBoard()
  }, [startBoard])

  // ถอยหลังไปถึง idx (inclusive)
  const backtrackTo = useCallback((idx: number) => {
    const p = pathRef.current
    const pos = p.indexOf(idx)
    if (pos === -1) return
    const removed = p.slice(pos + 1)
    const newPath = p.slice(0, pos + 1)
    const c = cellsRef.current.map((cell, i) =>
      removed.includes(i) ? { ...cell, state: 'unused' as const } : cell
    )
    syncCells(c)
    syncPath(newPath)
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

        // ถ้าหาไม่ได้แล้ว → จบกระดาน
        if (!hasValidPath(newCells, pathLen, targetSum)) {
          const newTotal = totalScoreRef.current + newScore
          totalScoreRef.current = newTotal
          setTotalScore(newTotal)

          if (boardRef.current < totalBoards) {
            // ไปกระดานถัดไป
            setPhase('next_board')
          } else {
            // จบเกมทั้งหมด
            setTimeTaken(Math.round((Date.now() - startTimeRef.current) / 1000))
            setPhase(newTotal >= totalMinRef.current ? 'won' : 'over')
          }
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
  }, [pathLen, targetSum, totalBoards])

  // ===== Cell interaction =====
  const handleCellInteract = useCallback((idx: number) => {
    if (flashRef.current || phase !== 'playing') return
    const cell = cellsRef.current[idx]
    if (!cell || cell.state === 'used') return

    const p = pathRef.current

    if (p.includes(idx)) {
      backtrackTo(idx)
      return
    }
    if (p.length > 0 && !isAdjacent(p[p.length - 1], idx)) return

    const newPath = [...p, idx]
    const c = cellsRef.current.map((cell, i) =>
      i === idx ? { ...cell, state: 'path' as const } : cell
    )
    syncCells(c)
    syncPath(newPath)

    if (newPath.length === pathLen) {
      submitPath(newPath)
    }
  }, [phase, pathLen, submitPath, backtrackTo])

  // ===== Pointer events =====
  const onCellPointerDown = useCallback((e: React.PointerEvent, idx: number) => {
    e.preventDefault()
    isDragging.current = true
    handleCellInteract(idx)
  }, [handleCellInteract])

  const onCellPointerEnter = useCallback((idx: number) => {
    if (!isDragging.current || flashRef.current) return
    const p = pathRef.current
    if (p.includes(idx)) {
      backtrackTo(idx)
      return
    }
    handleCellInteract(idx)
  }, [handleCellInteract, backtrackTo])

  const onPointerUp = useCallback(() => { isDragging.current = false }, [])

  useEffect(() => {
    const up = () => { isDragging.current = false }
    window.addEventListener('pointerup', up)
    return () => window.removeEventListener('pointerup', up)
  }, [])

  // บันทึกคะแนนเมื่อจบเกม
  useEffect(() => {
    if (phase !== 'won' && phase !== 'over') return
    supabase.from('quiz_attempts').insert({
      quiz_id: id,
      student_name: studentName,
      score: totalScoreRef.current,
      total_questions: totalMinRef.current,
      time_taken: Math.round((Date.now() - startTimeRef.current) / 1000),
    }).then(({ error }) => {
      if (error) console.error('Error saving result:', error)
    })
  }, [phase, id, studentName])

  // ===== Cell color =====
  function cellClass(cell: Cell) {
    const base = 'aspect-square rounded-md flex items-center justify-center font-bold select-none transition-all duration-100 cursor-pointer text-sm'
    if (cell.state === 'used') return `${base} bg-gray-200 text-gray-400 cursor-default opacity-40`
    if (cell.state === 'ok') return `${base} bg-green-400 text-white scale-110 shadow-lg`
    if (cell.state === 'err') return `${base} bg-red-400 text-white scale-95`
    if (cell.state === 'path') return `${base} bg-blue-500 text-white shadow-md scale-105 ring-2 ring-blue-300`
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
              <p className="text-sm text-gray-500">
                จำนวน <strong>{totalBoards}</strong> กระดาน
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 space-y-1">
              <p>• ลากหรือกดตัวเลขที่ <strong>ติดกัน</strong> (8 ทิศทาง) ทีละ {pathLen} ตัว</p>
              <p>• กดตัวใน path เพื่อถอยกลับไปถึงตัวนั้น</p>
              <p>• ผลรวม = {targetSum} → ✅  |  ≠ {targetSum} → ❌ เริ่มใหม่</p>
              <p>• เล่นจนหาไม่ได้แล้วจึงข้ามกระดาน</p>
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

  // ===== NEXT BOARD =====
  if (phase === 'next_board') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <Card className="max-w-sm w-full border-0 bg-white/70 backdrop-blur-sm">
          <CardHeader className="text-center pb-2">
            <div className="text-5xl mb-2">✅</div>
            <h1 className="text-xl font-bold">กระดาน {board} เสร็จแล้ว!</h1>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center space-y-2">
              <div className="bg-blue-50 rounded-xl p-3 space-y-1">
                <p className="text-sm text-gray-500">หาได้ในกระดานนี้</p>
                <p className="text-4xl font-black text-blue-600">{score}</p>
                <p className="text-xs text-gray-400">เป้ากระดานนี้: {minPaths}</p>
              </div>
              <div className="bg-purple-50 rounded-xl p-3 space-y-1">
                <p className="text-sm text-gray-500">คะแนนสะสมทั้งหมด</p>
                <p className="text-3xl font-black text-purple-600">{totalScore}</p>
              </div>
            </div>
            <div className="text-center text-xs text-gray-400">
              กระดานที่ {board + 1} จาก {totalBoards} รอคุณอยู่!
            </div>
            <Button onClick={goNextBoard} className="w-full bg-purple-600 hover:bg-purple-700" size="lg">
              กระดาน {board + 1}/{totalBoards} →
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
            <div className="text-5xl mb-2">{passed ? '🏆' : '🔍'}</div>
            <h1 className="text-2xl font-bold">{passed ? 'ผ่านแล้ว!' : 'หาไม่ได้แล้ว'}</h1>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center space-y-2">
              <div className="text-5xl font-black text-purple-600">{totalScore}</div>
              <div className="text-gray-500 text-sm">คำตอบทั้งหมด ({totalBoards} กระดาน)</div>
              <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {passed ? '✅ ผ่านเกณฑ์' : `❌ ไม่ผ่าน (ต้องการ ${totalMinPaths})`}
              </div>
            </div>
            <Progress value={Math.min(100, Math.round(totalScore / Math.max(1, totalMinPaths) * 100))} className="h-2" />
            <p className="text-center text-xs text-gray-400">
              เวลา: {Math.floor(timeTaken / 60)}:{(timeTaken % 60).toString().padStart(2, '0')}
            </p>
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
      <div className="max-w-md mx-auto px-2 py-3">

        {/* Header */}
        <div className="flex justify-between items-center mb-2">
          <div>
            <div className="text-xs text-gray-400 mb-0.5">กระดาน {board}/{totalBoards}</div>
            <div className="text-sm font-bold text-purple-700">
              หาได้ <span className="text-2xl">{score}</span>
              <span className="text-gray-400 text-xs font-normal"> / เป้า {minPaths}</span>
            </div>
            {totalBoards > 1 && (
              <div className="text-xs text-gray-400">สะสม: {totalScore} คะแนน</div>
            )}
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500">เป้าหมาย</div>
            <div className="text-xl font-black text-orange-500">{targetSum}</div>
          </div>
        </div>

        {/* Progress */}
        <Progress value={minPaths > 0 ? Math.min(100, score / minPaths * 100) : 0} className="h-1.5 mb-2" />

        {/* Path status */}
        <div className="flex items-center justify-between mb-2 bg-white/70 rounded-lg px-3 py-1.5 text-sm">
          <div>
            เลือก: <strong className="text-blue-600">{path.length}</strong> / {pathLen} ตัว
          </div>
          <div>
            รวม: <strong className={`${
              currentSum > targetSum ? 'text-red-500' :
              currentSum === targetSum && path.length === pathLen ? 'text-green-600' :
              'text-gray-800'
            }`}>
              {path.length > 0 ? currentSum : '-'}
            </strong>
            {' / '}{targetSum}
          </div>
          {path.length > 0 && (
            <button className="text-xs text-gray-400 hover:text-gray-600 underline" onClick={clearPath}>
              ล้าง
            </button>
          )}
        </div>

        {/* Grid */}
        <div
          className="grid gap-1"
          style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}
          onPointerUp={onPointerUp}
        >
          {cells.map((cell, idx) => (
            <div
              key={idx}
              className={cellClass(cell)}
              style={{ touchAction: 'none' }}
              onPointerDown={(e) => onCellPointerDown(e, idx)}
              onPointerEnter={() => onCellPointerEnter(idx)}
            >
              {cell.state !== 'used' ? cell.value : ''}
            </div>
          ))}
        </div>

        {/* Path sequence */}
        {path.length > 0 && (
          <div className="mt-2 text-center text-xs text-gray-400">
            {path.map(i => cellsRef.current[i]?.value ?? '?').join(' + ')} = {currentSum}
          </div>
        )}

      </div>
    </div>
  )
}
