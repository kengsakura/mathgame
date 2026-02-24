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
  difficulty: 'easy' | 'medium' | 'hard'
  time_per_question: number   // วินาทีต่อรอบ
  total_questions: number     // จำนวนรอบ
  passing_threshold: number
}

interface Props {
  quiz: Quiz
  studentName: string
  id: string
}

type Phase = 'ready' | 'playing' | 'round_done' | 'game_over'

function shuffleGrid(): number[] {
  const nums = Array.from({ length: 36 }, (_, i) => i + 1)
  for (let i = 35; i > 0; i--) {
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
  const [phase, setPhase] = useState<Phase>('ready')
  const [round, setRound] = useState(0)
  const [score, setScore] = useState(0)
  const [grid, setGrid] = useState<number[]>([])
  const [nextTarget, setNextTarget] = useState(1)
  const [found, setFound] = useState<Set<number>>(new Set())
  const [wrongIdx, setWrongIdx] = useState<number | null>(null)
  const [timeLeft, setTimeLeft] = useState(quiz.time_per_question)
  const [lastRoundOk, setLastRoundOk] = useState(false)
  const [totalTimeTaken, setTotalTimeTaken] = useState(0)

  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const scoreRef = useRef(0)
  const roundRef = useRef(0)
  const startTimeRef = useRef(0)
  const phaseRef = useRef<Phase>('ready')

  // sync phaseRef
  useEffect(() => { phaseRef.current = phase }, [phase])

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
    setGrid(shuffleGrid())
    setNextTarget(1)
    setFound(new Set())
    setWrongIdx(null)
    setTimeLeft(quiz.time_per_question)
    setPhase('playing')
  }, [quiz.time_per_question])

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

  const handleCellClick = useCallback((num: number, idx: number) => {
    if (phaseRef.current !== 'playing') return
    if (num === nextTarget) {
      setFound(prev => {
        const next = new Set(prev)
        next.add(num)
        return next
      })
      if (num === 36) {
        // round complete!
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
        scoreRef.current += 1
        setScore(scoreRef.current)
        setLastRoundOk(true)
        setPhase('round_done')
      } else {
        setNextTarget(num + 1)
      }
    } else {
      setWrongIdx(idx)
      setTimeout(() => setWrongIdx(null), 350)
    }
  }, [nextTarget])

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
            <p className="text-gray-500 text-sm">กดตัวเลข 1 → 36 ตามลำดับให้เร็วที่สุด!</p>
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
            </div>
            <div className="bg-blue-50 rounded-lg p-3 text-xs text-gray-600 space-y-1">
              <p>• ตัวเลข 1-36 กระจายในตารางสุ่มทุกรอบ</p>
              <p>• กด 1 ก่อน จากนั้นกด 2, 3, 4... ไปเรื่อยๆ</p>
              <p>• กดผิดไม่เป็นไร แต่เสียเวลา</p>
              <p>• ต้องกดครบ 36 ก่อนเวลาหมดจึงผ่าน</p>
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
            <h1 className="text-2xl font-bold text-gray-900">จบแล้ว!</h1>
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
            <h2 className="text-2xl font-bold text-gray-900">
              {lastRoundOk ? `ผ่าน! 🎉` : 'หมดเวลา!'}
            </h2>
            <div className="text-sm text-gray-500 space-y-1">
              <p>รอบที่ {roundRef.current + 1} / {quiz.total_questions}</p>
              {!lastRoundOk && <p>กดได้ถึง: <span className="font-bold text-gray-700">{nextTarget - 1}</span> / 36</p>}
              <p>ผ่านแล้ว: <span className="font-bold text-blue-600">{scoreRef.current}</span> รอบ</p>
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
  const progressPct = ((nextTarget - 1) / 36) * 100

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
          <span className="text-gray-400 text-xs ml-2">({nextTarget - 1}/36)</span>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-6 gap-1">
          {grid.map((num, idx) => {
            const isFound = found.has(num)
            const isWrong = wrongIdx === idx
            return (
              <button
                key={idx}
                onClick={() => handleCellClick(num, idx)}
                className={`
                  aspect-square rounded-lg font-bold text-sm transition-all duration-100 select-none
                  ${isFound
                    ? 'bg-green-400 text-white shadow-inner cursor-default opacity-70'
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
        </div>

      </div>
    </div>
  )
}
