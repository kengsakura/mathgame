'use client'
import { useState, useEffect, useCallback, use } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { SigmaSpinner } from '@/components/ui/sigma-spinner'
import { supabase } from '@/lib/supabase'
import { MathQuestionGenerator } from '@/lib/polynomial-generator'
import type { Question } from '@/lib/polynomial-generator'
import { Clock, User, Trophy } from 'lucide-react'
import 'katex/dist/katex.min.css'
import { InlineMath, BlockMath } from 'react-katex'

interface Quiz {
  id: string
  name: string
  difficulty: 'easy' | 'medium' | 'hard'
  time_per_question: number
  total_questions: number
  question_type: 'polynomial' | 'equation' | 'integer' | 'fraction' | 'power' | 'root' | 'function' | 'arithmetic_sequence' | 'geometric_sequence' | 'arithmetic_series' | 'geometric_series'
}

interface GameState {
  currentQuestion: number
  questions: Question[]
  answers: string[]
  score: number
  timeLeft: number
  gameStarted: boolean
  gameEnded: boolean
  showResult: boolean
  lastAnswerCorrect: boolean
}

export default function QuizPlayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const searchParams = useSearchParams()
  const studentName = searchParams.get('name') || 'นักเรียน'
  
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [gameState, setGameState] = useState<GameState>({
    currentQuestion: 0,
    questions: [],
    answers: [],
    score: 0,
    timeLeft: 0,
    gameStarted: false,
    gameEnded: false,
    showResult: false,
    lastAnswerCorrect: false
  })

  const generator = new MathQuestionGenerator()

  const loadQuiz = useCallback(async () => {
    const { data } = await supabase
      .from('quizzes')
      .select('*')
      .eq('id', id)
      .single()

    if (data) {
      setQuiz(data)
    } else {
      alert('ไม่พบชุดข้อสอบที่ระบุ')
      router.push('/student')
    }
  }, [id, router])

  useEffect(() => {
    loadQuiz()
  }, [loadQuiz])

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (gameState.gameStarted && !gameState.gameEnded && gameState.timeLeft > 0) {
      timer = setTimeout(() => {
        setGameState(prev => ({
          ...prev,
          timeLeft: prev.timeLeft - 1
        }))
      }, 1000)
    } else if (gameState.gameStarted && !gameState.gameEnded && gameState.timeLeft === 0) {
      nextQuestion()
    }
    return () => clearTimeout(timer)
  }, [gameState.timeLeft, gameState.gameStarted, gameState.gameEnded])

  const startGame = () => {
    if (!quiz) return

    const questions = generator.generateQuestions(quiz.total_questions, {
      difficulty: quiz.difficulty,
      maxConstantTerm: quiz.difficulty === 'easy' ? 20 : quiz.difficulty === 'medium' ? 30 : 40,
      questionType: quiz.question_type
    })

    setGameState({
      currentQuestion: 0,
      questions,
      answers: new Array(quiz.total_questions).fill(''),
      score: 0,
      timeLeft: quiz.time_per_question,
      gameStarted: true,
      gameEnded: false,
      showResult: false,
      lastAnswerCorrect: false
    })
  }

  const selectAnswer = (answer: string) => {
    const newAnswers = [...gameState.answers]
    newAnswers[gameState.currentQuestion] = answer
    
    const currentQuestion = gameState.questions[gameState.currentQuestion]
    const isCorrect = currentQuestion.checkAnswer ? 
      currentQuestion.checkAnswer(answer) : 
      answer === currentQuestion.correctAnswer
    
    let newScore = gameState.score
    if (isCorrect) {
      newScore++
    }

    setGameState(prev => ({
      ...prev,
      answers: newAnswers,
      score: newScore,
      showResult: true,
      lastAnswerCorrect: isCorrect
    }))

    setTimeout(() => {
      setGameState(prev => ({
        ...prev,
        showResult: false
      }))
      nextQuestion()
    }, 1000)
  }

  const nextQuestion = useCallback(() => {
    if (!quiz) return

    if (gameState.currentQuestion < quiz.total_questions - 1) {
      setGameState(prev => ({
        ...prev,
        currentQuestion: prev.currentQuestion + 1,
        timeLeft: quiz.time_per_question
      }))
    } else {
      endGame()
    }
  }, [gameState.currentQuestion, quiz])

  const endGame = async () => {
    if (!quiz) return

    // คำนวณคะแนนจากคำตอบทั้งหมด เพื่อให้แน่ใจว่าได้คะแนนข้อสุดท้าย
    let finalScore = 0
    for (let i = 0; i < gameState.questions.length; i++) {
      const question = gameState.questions[i]
      const answer = gameState.answers[i]
      if (answer) {
        const isCorrect = question.checkAnswer ? 
          question.checkAnswer(answer) : 
          answer === question.correctAnswer
        if (isCorrect) {
          finalScore++
        }
      }
    }
    
    setGameState(prev => ({
      ...prev,
      gameEnded: true,
      timeLeft: 0
    }))

    // บันทึกผลคะแนน
    await supabase.from('quiz_attempts').insert({
      quiz_id: id,
      student_name: studentName,
      score: finalScore,
      total_questions: quiz.total_questions,
      time_taken: (quiz.total_questions * quiz.time_per_question) - 
                   ((quiz.total_questions - gameState.currentQuestion - 1) * quiz.time_per_question + gameState.timeLeft)
    })
  }

  const restartQuiz = () => {
    if (!quiz) return
    
    // รีเซ็ต game state และเริ่มเกมใหม่
    const newQuestions = Array.from({ length: quiz.total_questions }, () => 
      generator.generateQuestion({
        difficulty: quiz.difficulty,
        maxConstantTerm: 20,
        questionType: quiz.question_type as any
      })
    )
    
    setGameState({
      questions: newQuestions,
      currentQuestion: 0,
      score: 0,
      answers: new Array(quiz.total_questions).fill(''),
      gameStarted: false,
      gameEnded: false,
      timeLeft: quiz.time_per_question,
      showResult: false,
      lastAnswerCorrect: false
    })
  }

  const formatTime = (seconds: number) => {
    return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`
  }

  const getScoreColor = (score: number, total: number) => {
    const percentage = (score / total) * 100
    if (percentage >= 80) return 'text-orange-600'
    if (percentage >= 60) return 'text-gray-600'
    return 'text-gray-800'
  }

  const getScoreMessage = (percentage: number) => {
    if (percentage >= 90) return { emoji: '🏆', message: 'เจ้าแห่งคณิตศาสตร์! สมควรได้รับเกียรติยศ! 🎖️' }
    if (percentage >= 80) return { emoji: '🎉', message: 'เก่งมาก! คำนวณได้เฟี่ยงฟ้อง! ✨' }
    if (percentage >= 70) return { emoji: '👍', message: 'ดีแล้ว! อีกนิดเดียวจะเป็นเซียนแล้ว! 💪' }
    if (percentage >= 60) return { emoji: '😊', message: 'ผ่านเกณฑ์! แต่ยังไปได้อีกไกล! 🚀' }
    if (percentage >= 50) return { emoji: '🤔', message: 'ครึ่งหนึ่งแล้ว! อีกครึ่งนึงค่อยๆ ฝึกนะ! 📚' }
    if (percentage >= 30) return { emoji: '😅', message: 'อืม... ลองทบทวนสูตรใหม่มั้ย? เดี๋ยวได้แน่! 💡' }
    if (percentage >= 20) return { emoji: '😢', message: 'อ่อนหน่อยนะ... ลองใหม่มั้ย? ไฟท์ติ้ง! 💪' }
    return { emoji: '🥺', message: 'อย่าท้อใจ! ทุกคนต้องผ่านจุดนี้ ลองอีกครั้งนะ! 🌟' }
  }

  const getQuestionPrompt = (questionType: string) => {
    switch (questionType) {
      case 'polynomial': return 'แยกตัวประกอบของพหุนามต่อไปนี้'
      case 'equation': return 'แก้สมการต่อไปนี้'
      case 'integer': return 'คำนวณผลลัพธ์ต่อไปนี้'
      case 'fraction': return 'คำนวณเศษส่วนต่อไปนี้'
      case 'power': return 'คำนวณเลขยกกำลังต่อไปนี้'
      case 'root': return 'คำนวณรากที่ n ต่อไปนี้'
      case 'function': return 'หาค่าฟังก์ชันต่อไปนี้'
      case 'arithmetic_sequence': return 'ลำดับเลขคณิต'
      case 'geometric_sequence': return 'ลำดับเรขาคณิต'
      case 'arithmetic_series': return 'อนุกรมเลขคณิต'
      case 'geometric_series': return 'อนุกรมเรขาคณิต'
      default: return 'แก้โจทย์ต่อไปนี้'
    }
  }

  if (!quiz) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <SigmaSpinner size="xl" className="mx-auto mb-4" />
          <p className="text-gray-600">กำลังโหลดข้อสอบ...</p>
        </div>
      </div>
    )
  }

  if (!gameState.gameStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <Card className="border-0 bg-white/70 backdrop-blur-sm">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trophy className="h-8 w-8 text-blue-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">{quiz.name}</h1>
                <p className="text-gray-600">พร้อมทำข้อสอบหรือยัง?</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-4 text-gray-700">
                  <User className="h-5 w-5 text-blue-600" />
                  <span className="font-medium">{studentName}</span>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <h3 className="font-semibold text-gray-900">รายละเอียดข้อสอบ</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">จำนวนข้อ:</span>
                      <span className="ml-2 font-medium">{quiz.total_questions} ข้อ</span>
                    </div>
                    <div>
                      <span className="text-gray-600">เวลาต่อข้อ:</span>
                      <span className="ml-2 font-medium">{quiz.time_per_question} วินาที</span>
                    </div>
                    <div>
                      <span className="text-gray-600">เวลารวม:</span>
                      <span className="ml-2 font-medium">{formatTime(quiz.total_questions * quiz.time_per_question)}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">ระดับ:</span>
                      <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                        quiz.difficulty === 'easy' ? 'bg-gray-100 text-gray-800' :
                        quiz.difficulty === 'medium' ? 'bg-orange-100 text-orange-800' :
                        'bg-gray-800 text-white'
                      }`}>
                        {quiz.difficulty === 'easy' ? 'ง่าย' : 
                         quiz.difficulty === 'medium' ? 'ปานกลาง' : 'ยาก'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">คำแนะนำ</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• อ่านโจทย์และตัวเลือกให้ดี</li>
                    <li>• แต่ละข้อมีเวลาจำกัด หมดเวลาจะไปข้อต่อไปอัตโนมัติ</li>
                    <li>• เลือกคำตอบที่ถูกต้องที่สุด</li>
                    <li>• คะแนนจะปรากฏทันทีเมื่อจบข้อสอบ</li>
                  </ul>
                </div>

                <Button onClick={startGame} className="w-full" size="lg">
                  <Clock className="h-5 w-5 mr-2" />
                  เริ่มทำข้อสอบ
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (gameState.gameEnded) {
    const percentage = Math.round((gameState.score / quiz.total_questions) * 100)
    const scoreMessage = getScoreMessage(percentage)
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <Card className="border-0 bg-white/70 backdrop-blur-sm">
              <CardHeader className="text-center">
                <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trophy className="h-10 w-10 text-orange-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">จบข้อสอบแล้ว!</h1>
                <p className="text-gray-600">ผลคะแนนของคุณ</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center">
                  <div className="text-6xl mb-4">{scoreMessage.emoji}</div>
                  <div className={`text-6xl font-bold mb-2 ${getScoreColor(gameState.score, quiz.total_questions)}`}>
                    {gameState.score}/{quiz.total_questions}
                  </div>
                  <div className="text-2xl font-semibold text-gray-700 mb-4">
                    {percentage}%
                  </div>
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                    <p className="text-orange-800 font-medium text-lg">
                      {scoreMessage.message}
                    </p>
                  </div>
                  <Progress value={percentage} className="w-full h-3" />
                </div>

                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <h3 className="font-semibold text-gray-900">รายละเอียดผลคะแนน</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">ชื่อ:</span>
                      <span className="font-medium">{studentName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">ชุดข้อสอบ:</span>
                      <span className="font-medium">{quiz.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">ตอบถูก:</span>
                      <span className="font-medium text-orange-600">{gameState.score} ข้อ</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">ตอบผิด:</span>
                      <span className="font-medium text-gray-800">{quiz.total_questions - gameState.score} ข้อ</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">เปอร์เซ็นต์:</span>
                      <span className={`font-medium ${getScoreColor(gameState.score, quiz.total_questions)}`}>
                        {percentage}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Button onClick={restartQuiz} variant="outline" size="lg">
                    ทำข้อสอบใหม่
                  </Button>
                  <Button onClick={() => router.push(`/admin/quiz/${id}/results?from=student`)} variant="outline" size="lg">
                    ดู Leaderboard
                  </Button>
                  <Button onClick={() => router.push('/student')} size="lg">
                    กลับหน้าหลัก
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  const currentQ = gameState.questions[gameState.currentQuestion]
  const progress = ((gameState.currentQuestion) / quiz.total_questions) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-gray-900">{studentName}</h1>
            <div className="text-sm text-gray-600">
              คะแนน: <span className="font-semibold">{gameState.score}/{gameState.currentQuestion + (gameState.answers[gameState.currentQuestion] ? 1 : 0)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-lg font-mono">
            <Clock className="h-5 w-5 text-orange-600" />
            <span className={`font-bold ${gameState.timeLeft <= 5 ? 'text-orange-600' : 'text-gray-700'}`}>
              {formatTime(gameState.timeLeft)}
            </span>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>ข้อที่ {gameState.currentQuestion + 1} จาก {quiz.total_questions}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Question */}
        {currentQ ? (
        <div className="max-w-4xl mx-auto">
          <Card className={`border-0 bg-white/70 backdrop-blur-sm mb-6 transition-all duration-300 ${
            gameState.showResult && !gameState.lastAnswerCorrect 
              ? 'border-2 border-gray-300 bg-gray-50/20 shadow-lg shadow-gray-100/50' 
              : gameState.showResult && gameState.lastAnswerCorrect
              ? 'border-2 border-orange-200 bg-orange-50/20 shadow-lg shadow-orange-100/50'
              : ''
          }`}>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900">
                {getQuestionPrompt(quiz.question_type)}
              </h2>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-4xl font-mono font-bold text-gray-900 mb-8 p-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                  {currentQ?.expression && (currentQ.expression.includes('\\frac') || currentQ.expression.includes('^{') || currentQ.expression.includes('\\')) ? (
                    <InlineMath math={currentQ.expression} />
                  ) : (
                    currentQ?.expression || 'Loading...'
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentQ?.choices?.map((choice, index) => {
                    const isSelected = gameState.answers[gameState.currentQuestion] === choice
                    const isCorrect = choice === currentQ.correctAnswer
                    
                    let buttonClass = "h-16 text-lg font-mono p-4 transition-all duration-300"
                    
                    if (gameState.showResult && isSelected) {
                      if (gameState.lastAnswerCorrect) {
                        buttonClass += " bg-orange-500 text-white border-orange-600 shadow-lg"
                      } else {
                        buttonClass += " bg-gray-500 text-white border-gray-600 shadow-lg"
                      }
                    } else if (gameState.showResult && isCorrect && !gameState.lastAnswerCorrect) {
                      buttonClass += " bg-orange-100 text-orange-700 border-orange-300 shadow-md"
                    } else if (!gameState.showResult) {
                      buttonClass += " hover:scale-105"
                    }

                    return (
                      <Button
                        key={index}
                        onClick={() => !gameState.showResult && selectAnswer(choice)}
                        variant={isSelected && !gameState.showResult ? 'default' : 'outline'}
                        className={buttonClass}
                        size="lg"
                        disabled={gameState.showResult}
                      >
                        <div className="flex items-center justify-center">
                          <span className={`text-sm font-bold mr-2 w-6 h-6 rounded-full flex items-center justify-center ${
                            gameState.showResult && isSelected && gameState.lastAnswerCorrect
                              ? 'bg-white/20 text-white'
                              : gameState.showResult && isSelected && !gameState.lastAnswerCorrect
                              ? 'bg-white/20 text-white'
                              : gameState.showResult && isCorrect && !gameState.lastAnswerCorrect
                              ? 'bg-orange-200 text-orange-800'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {String.fromCharCode(65 + index)}
                          </span>
                          {choice.includes('\\frac') || choice.includes('^{') || choice.includes('\\') ? (
                            <InlineMath math={choice} />
                          ) : (
                            choice
                          )}
                        </div>
                      </Button>
                    )
                  })}
                </div>
                {gameState.showResult && (
                  <div className={`mt-6 p-4 rounded-lg ${
                    gameState.lastAnswerCorrect 
                      ? 'bg-orange-100 text-orange-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    <p className="font-medium">
                      {gameState.lastAnswerCorrect 
                        ? '🎉 ถูกต้อง!' 
                        : `❌ ผิด! คำตอบที่ถูกคือ ${currentQ?.correctAnswer || 'N/A'}`}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            <Card className="border-0 bg-white/70 backdrop-blur-sm mb-6">
              <CardContent className="p-8 text-center">
                <SigmaSpinner size="xl" className="mx-auto mb-4" />
                <p className="text-gray-600">กำลังโหลดคำถาม...</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}