'use client'
import { useState, useEffect, useCallback, use } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Trophy, Clock, User, Medal, Download } from 'lucide-react'
import Link from 'next/link'

interface Quiz {
  id: string
  name: string
  difficulty: 'easy' | 'medium' | 'hard'
  time_per_question: number
  total_questions: number
}

interface QuizAttempt {
  id: string
  student_name: string
  score: number
  total_questions: number
  time_taken: number
  completed_at: string
}

export default function ResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const searchParams = useSearchParams()
  const fromStudent = searchParams.get('from') === 'student' // เช็คว่ามาจากนักเรียนหรือไม่
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [attempts, setAttempts] = useState<QuizAttempt[]>([])

  const loadQuizAndResults = useCallback(async () => {
    // Load quiz info
    const { data: quizData } = await supabase
      .from('quizzes')
      .select('*')
      .eq('id', id)
      .single()

    if (quizData) {
      setQuiz(quizData)
    }

    // Load attempts
    const { data: attemptsData } = await supabase
      .from('quiz_attempts')
      .select('*')
      .eq('quiz_id', id)
      .order('completed_at', { ascending: false })

    if (attemptsData) {
      setAttempts(attemptsData)
    }
  }, [id])

  useEffect(() => {
    loadQuizAndResults()
    
    // Subscribe to real-time updates
    const subscription = supabase
      .channel('quiz_attempts')
      .on('postgres_changes', { 
        event: 'INSERT', 
        table: 'quiz_attempts',
        filter: `quiz_id=eq.${id}`
      } as any, (payload: { new: QuizAttempt }) => {
        setAttempts(prev => [payload.new, ...prev])
      })
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  }, [loadQuizAndResults])

  const getScoreColor = (score: number, total: number) => {
    const percentage = (score / total) * 100
    if (percentage >= 80) return 'text-orange-600'
    if (percentage >= 60) return 'text-gray-600'
    return 'text-gray-800'
  }

  const getScoreBadgeColor = (score: number, total: number) => {
    const percentage = (score / total) * 100
    if (percentage >= 80) return 'bg-orange-100 text-orange-800'
    if (percentage >= 60) return 'bg-gray-100 text-gray-800'
    return 'bg-gray-200 text-gray-900'
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const getStats = () => {
    if (attempts.length === 0) {
      return {
        totalAttempts: 0,
        averageScore: 0,
        highestScore: 0,
        averageTime: 0
      }
    }

    const totalAttempts = attempts.length
    const averageScore = attempts.reduce((sum, attempt) => sum + attempt.score, 0) / totalAttempts
    const highestScore = Math.max(...attempts.map(a => a.score))
    const averageTime = attempts.reduce((sum, attempt) => sum + attempt.time_taken, 0) / totalAttempts

    return {
      totalAttempts,
      averageScore: Math.round((averageScore / (quiz?.total_questions || 1)) * 100),
      highestScore,
      averageTime: Math.round(averageTime)
    }
  }

  const exportResults = () => {
    if (!quiz || attempts.length === 0) return

    const csvContent = [
      ['ชื่อ', 'คะแนน', 'เต็ม', 'เปอร์เซ็นต์', 'เวลา (วินาที)', 'วันที่ทำ'].join(','),
      ...attempts.map(attempt => [
        attempt.student_name,
        attempt.score,
        attempt.total_questions,
        Math.round((attempt.score / attempt.total_questions) * 100) + '%',
        attempt.time_taken,
        new Date(attempt.completed_at).toLocaleString('th-TH')
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `ผลคะแนน-${quiz.name}.csv`
    link.click()
  }

  const stats = getStats()

  if (!quiz) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลด...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Button variant="outline" asChild>
                <Link href={fromStudent ? "/student" : "/admin"}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {fromStudent ? "กลับหน้านักเรียน" : "กลับหน้าครู"}
                </Link>
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">ผลคะแนน</h1>
                <p className="text-gray-600">{quiz.name}</p>
              </div>
            </div>
            {attempts.length > 0 && (
              <Button onClick={exportResults} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="border-0 bg-white/70 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <User className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{stats.totalAttempts}</div>
                <div className="text-sm text-gray-600">คนทำข้อสอบ</div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-white/70 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <Trophy className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{stats.averageScore}%</div>
                <div className="text-sm text-gray-600">คะแนนเฉลี่ย</div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-white/70 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <Medal className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">
                  {stats.highestScore}/{quiz.total_questions}
                </div>
                <div className="text-sm text-gray-600">คะแนนสูงสุด</div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-white/70 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <Clock className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{formatTime(stats.averageTime)}</div>
                <div className="text-sm text-gray-600">เวลาเฉลี่ย</div>
              </CardContent>
            </Card>
          </div>

          {/* Results Table */}
          <Card className="border-0 bg-white/70 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>รายชื่อและคะแนน</span>
                {attempts.length > 0 && (
                  <span className="text-sm font-normal text-gray-600">
                    {attempts.length} รายการ
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {attempts.length === 0 ? (
                <div className="text-center py-12">
                  <Trophy className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">
                    ยังไม่มีใครทำข้อสอบ
                  </h3>
                  <p className="text-gray-500 mb-4">
                    แชร์ QR Code ให้นักเรียนสแกนเพื่อเริ่มทำข้อสอบ
                  </p>
                  <Button asChild>
                    <Link href={`/quiz/${quiz.id}/qr`}>
                      ดู QR Code
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {attempts.map((attempt, index) => (
                    <div
                      key={attempt.id}
                      className="flex items-center justify-between p-4 bg-gray-50/50 rounded-lg hover:bg-gray-100/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">
                            {attempt.student_name}
                          </div>
                          <div className="text-sm text-gray-600">
                            {new Date(attempt.completed_at).toLocaleString('th-TH')}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 text-right">
                        <div>
                          <div className={`text-lg font-bold ${getScoreColor(attempt.score, attempt.total_questions)}`}>
                            {attempt.score}/{attempt.total_questions}
                          </div>
                          <div className="text-sm text-gray-600">
                            {formatTime(attempt.time_taken)}
                          </div>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreBadgeColor(attempt.score, attempt.total_questions)}`}>
                          {Math.round((attempt.score / attempt.total_questions) * 100)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {attempts.length > 0 && (
            <div className="mt-8 text-center">
              <div className="inline-flex items-center gap-4 bg-white/50 backdrop-blur-sm rounded-full px-6 py-3 border border-gray-200">
                <span className="text-gray-600">
                  ข้อมูลจะอัปเดตอัตโนมัติเมื่อมีนักเรียนทำข้อสอบเสร็จ
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}