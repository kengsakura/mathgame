'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Clock, Trophy, User } from 'lucide-react'
import { Progress } from '@/components/ui/progress'

interface Quiz {
  id: string
  name: string
  time_per_question: number   // วินาทีต่อรอบ
  total_questions: number     // จำนวนรอบ
  passing_threshold: number
  question_type: string
}

interface Props {
  quiz: Quiz
  studentName: string
  id: string
}

type Phase = 'ready' | 'playing' | 'round_done' | 'game_over'

// ===== ลำดับตัวเลขแต่ละแบบ (36 ตัวเสมอ → grid 6x6) =====
function getSequence(questionType: string): number[] {
  switch (questionType) {
    case 'number_grid_even': // เลขคู่: 2, 4, 6, ..., 72
      return Array.from({ length: 36 }, (_, i) => (i + 1) * 2)
    case 'number_grid_odd': // เลขคี่: 1, 3, 5, ..., 71
      return Array.from({ length: 36 }, (_, i) => i * 2 + 1)
    case 'number_grid_x3': // พหุคูณ 3: 3, 6, 9, ..., 108
      return Array.from({ length: 36 }, (_, i) => (i + 1) * 3)
    case 'number_grid_x5': // พหุคูณ 5: 5, 10, 15, ..., 180
      return Array.from({ length: 36 }, (_, i) => (i + 1) * 5)
    default: // 1-36
      return Array.from({ length: 36 }, (_, i) => i + 1)
  }
}

function getSequenceName(questionType: string): string {
  switch (questionType) {
    case 'number_grid_even': return 'เลขคู่ (2, 4, 6, ...)'
    case 'number_grid_odd': return 'เลขคี่ (1, 3, 5, ...)'
    case 'number_grid_x3': return 'พหุคูณ 3 (3, 6, 9, ...)'
    case 'number_grid_x5': return 'พหุคูณ 5 (5, 10, 15, ...)'
    default: return 'ตัวเลข 1-36'
  }
}

function shuffleGrid(sequence: number[]): number[] {
  const nums = [...sequence]
  for (let i = nums.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [nums[i], nums[j]] = [nums[j], nums[i]]
  }
  return nums
}

function formatTime(s: number) {
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`
}

export function NumberGridGame({ quiz, studentName, id }: Props) {
  const router = useRouter()
  const sequence = getSequence(quiz.question_type) // stable, computed once

  const [phase, setPhase] = useState<Phase>('ready')
  const [round, setRound] = useState(0)
  const [score, setScore] = useState(0)
  const [grid, setGrid] = useState<number[]>([])
  const [nextIdx, setNextIdx] = useState(0)      // index ใน sequence
  const [found, setFound] = useState<Set<number>>(new Set())
  const [wrongIdx, setWrongIdx] = useState<number | null>(null)  // cell index
  const [timeLeft, setTimeLeft] = useState(quiz.time_per_question)
  const [lastRoundOk, setLastRoundOk] = useState(false)
  const [totalTimeTaken, setTotalTimeTaken] = useState(0)

  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const scoreRef = useRef(0)
  const roundRef = useRef(0)
  const startTimeRef = useRef(0)
  const phaseRef = useRef<Phase>('ready')
  const nextIdxRef = useRef(0)

  useEffect(() => { phaseRef.current = phase }, [phase])
  useEffect(() => { nextIdxRef.current = nextIdx }, [nextIdx])

  const endGame = useCallback(async (finalScore: number) => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    const timeTaken = Math.round((Date.now() - startTimeRef.current) / 1000)
    setTotalTimeTaken(timeTaken)
    setPhase('game_over')
    await supabase.from('quiz_attempts').insert({
      quiz_id: id,
      student_name: studentName,
      score: finalScore,
      total_questions: quiz.total_questions,
      time_taken: timeTaken,
    })
  }, [id, quiz.total_questions, studentName])

  const startRound = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    setGrid(shuffleGrid(sequence))
    setNextIdx(0)
    nextIdxRef.current = 0
    setFound(new Set())
    setWrongIdx(null)
    setTimeLeft(quiz.time_per_question)
    setPhase('playing')
  }, [quiz.time_per_question, sequence])

  const startGame = useCallback(() => {
    scoreRef.current = 0
    roundRef.current = 0
    startTimeRef.current = Date.now()
    setScore(0)
    setRound(0)
    startRound()
  }, [startRound])

  const goNextRound = useCallback(() => {
    const next = roundRef.current + 1
    roundRef.current = next
    setRound(next)
    if (next >= quiz.total_questions) {
      endGame(scoreRef.current)
    } else {
      startRound()
    }
  }, [quiz.total_questions, endGame, startRound])

  // timer
  useEffect(() => {
    if (phase !== 'playing') return
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!)
          timerRef.current = null
          setLastRoundOk(false)
          setPhase('round_done')
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null } }
  }, [phase])

  const handleCellClick = useCallback((num: number, cellIdx: number) => {
    if (phaseRef.current !== 'playing') return
    const target = sequence[nextIdxRef.current]
    if (num === target) {
      setFound(prev => { const s = new Set(prev); s.add(num); return s })
      if (nextIdxRef.current === sequence.length - 1) {
        // ครบแล้ว!
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
        scoreRef.current += 1
        setScore(scoreRef.current)
        setLastRoundOk(true)
        setPhase('round_done')
      } else {
        setNextIdx(nextIdxRef.current + 1)
      }
    } else {
      setWrongIdx(cellIdx)
      setTimeout(() => setWrongIdx(null), 350)
    }
  }, [sequence])

  const nextTarget = sequence[nextIdx]

  // === READY ===
  if (phase === 'ready') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <Card className="max-w-sm w-full border-0 bg-white/70 backdrop-blur-sm">
          <CardHeader className="text-center pb-2">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Trophy className="h-8 w-8 text-blue-600" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">{quiz.name}</h1>
            <p className="text-sm text-blue-600 font-medium">{getSequenceName(quiz.question_type)}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 text-gray-700">
              <User className="h-4 w-4 text-blue-500" />
              <span className="font-medium text-sm">{studentName}</span>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-500">จำนวนรอบ</span>
                <span className="font-semibold">{quiz.total_questions} รอบ</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">เวลาต่อรอบ</span>
                <span className="font-semibold">{quiz.time_per_question} วินาที</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">ลำดับ</span>
                <span className="font-semibold text-blue-600">{getSequenceName(quiz.question_type)}</span>
              </div>
            </div>
            <div className="bg-blue-50 rounded-lg p-3 text-xs text-gray-600 space-y-1">
              <p>• กด <strong>{sequence[0]}</strong> ก่อน จากนั้น <strong>{sequence[1]}</strong>, <strong>{sequence[2]}</strong>... ไปเรื่อยๆ</p>
              <p>• กดผิดไม่เป็นไร แต่เสียเวลา</p>
              <p>• ต้องกดครบก่อนเวลาหมดจึงผ่าน</p>
            </div>
            <Button onClick={startGame} className="w-full" size="lg">
              <Clock className="h-4 w-4 mr-2" />
              เริ่มเลย!
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // === GAME OVER ===
  if (phase === 'game_over') {
    const percentage = Math.round((score / quiz.total_questions) * 100)
    const passed = percentage >= quiz.passing_threshold
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <Card className="max-w-sm w-full border-0 bg-white/70 backdrop-blur-sm">
          <CardHeader className="text-center pb-2">
            <div className="text-5xl mb-2">{passed ? '🏆' : '💪'}</div>
            <h1 className="text-2xl font-bold">จบแล้ว!</h1>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="text-5xl font-bold text-blue-600">{score}/{quiz.total_questions}</div>
              <div className="text-gray-500 text-sm mt-1">รอบที่ผ่าน</div>
              <div className={`mt-2 inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {passed ? '✅ ผ่านเกณฑ์' : '❌ ไม่ผ่านเกณฑ์'}
              </div>
            </div>
            <Progress value={percentage} className="h-2" />
            <div className="text-center text-sm text-gray-400">
              เวลารวม: {formatTime(totalTimeTaken)}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" onClick={() => {
                scoreRef.current = 0; roundRef.current = 0
                setScore(0); setRound(0); setPhase('ready')
              }}>
                เล่นใหม่
              </Button>
              <Button onClick={() => router.push('/student')}>
                กลับหน้าหลัก
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // === ROUND DONE ===
  if (phase === 'round_done') {
    const isLastRound = roundRef.current + 1 >= quiz.total_questions
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <Card className="max-w-sm w-full border-0 bg-white/70 backdrop-blur-sm text-center">
          <CardContent className="py-10 space-y-4">
            <div className="text-6xl">{lastRoundOk ? '✅' : '⏰'}</div>
            <h2 className="text-2xl font-bold">{lastRoundOk ? 'ผ่าน! 🎉' : 'หมดเวลา!'}</h2>
            <div className="text-sm text-gray-500 space-y-1">
              <p>รอบที่ {roundRef.current + 1} / {quiz.total_questions}</p>
              {!lastRoundOk && (
                <p>กดได้ถึง: <strong className="text-gray-700">{sequence[nextIdx - 1] ?? sequence[0]}</strong> / {sequence[sequence.length - 1]}</p>
              )}
              <p>ผ่านแล้ว: <strong className="text-blue-600">{scoreRef.current}</strong> รอบ</p>
            </div>
            <Button className="w-full" size="lg" onClick={goNextRound}>
              {isLastRound ? 'ดูผลคะแนน' : `รอบถัดไป (${roundRef.current + 2}/${quiz.total_questions}) →`}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // === PLAYING ===
  const progressPct = (nextIdx / sequence.length) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-sm mx-auto px-2 py-3">

        {/* Header */}
        <div className="flex justify-between items-center mb-2">
          <div className="text-xs text-gray-500 font-medium">
            รอบ {round + 1}/{quiz.total_questions} &nbsp;·&nbsp; ผ่าน {score} รอบ
          </div>
          <div className={`flex items-center gap-1 font-mono font-bold text-lg ${timeLeft <= 10 ? 'text-red-600' : 'text-gray-700'}`}>
            <Clock className={`h-4 w-4 ${timeLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-orange-400'}`} />
            {formatTime(timeLeft)}
          </div>
        </div>

        {/* Next target */}
        <div className="text-center mb-2 bg-white/80 rounded-xl py-2 shadow-sm">
          <span className="text-gray-500 text-sm">กดถัดไป: </span>
          <span className="text-3xl font-black text-blue-600">{nextTarget}</span>
          <span className="text-gray-400 text-xs ml-2">({nextIdx}/{sequence.length})</span>
        </div>

        {/* Grid 6x6 */}
        <div className="grid grid-cols-6 gap-1">
          {grid.map((num, idx) => {
            const isFound = found.has(num)
            const isWrong = wrongIdx === idx
            const isLarge = num >= 100 // 3 หลัก ต้องลดขนาดตัวอักษร
            return (
              <button
                key={idx}
                onClick={() => handleCellClick(num, idx)}
                className={`
                  aspect-square rounded-lg font-bold transition-all duration-100 select-none
                  ${isLarge ? 'text-xs' : 'text-sm'}
                  ${isFound
                    ? 'bg-green-400 text-white cursor-default opacity-60'
                    : isWrong
                    ? 'bg-red-400 text-white scale-90'
                    : 'bg-white text-gray-800 border border-gray-200 hover:bg-blue-50 hover:border-blue-300 hover:scale-105 active:scale-95 shadow-sm'
                  }
                `}
              >
                {isFound ? '✓' : num}
              </button>
            )
          })}
        </div>

        {/* Progress */}
        <div className="mt-2">
          <Progress value={progressPct} className="h-1.5" />
          <div className="text-xs text-center text-gray-400 mt-1">{nextIdx}/{sequence.length}</div>
        </div>

      </div>
    </div>
  )
}
