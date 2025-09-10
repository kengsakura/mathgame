'use client'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'
import { Plus, QrCode, Trash2, Users } from 'lucide-react'
import { SigmaSpinner } from '@/components/ui/sigma-spinner'
import Link from 'next/link'

interface Quiz {
  id: string
  name: string
  difficulty: 'easy' | 'medium' | 'hard'
  time_per_question: number
  total_questions: number
  question_type: 'polynomial' | 'equation' | 'integer' | 'fraction' | 'power' | 'root' | 'function'
  created_at: string
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    difficulty: 'easy' as 'easy' | 'medium' | 'hard',
    time_per_question: 20,
    total_questions: 10,
    question_type: 'polynomial' as 'polynomial' | 'equation' | 'integer' | 'fraction' | 'power' | 'root' | 'function'
  })

  useEffect(() => {
    // ตรวจสอบ login state จาก localStorage
    const savedAuth = localStorage.getItem('admin_authenticated')
    if (savedAuth === 'true') {
      setIsAuthenticated(true)
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      loadQuizzes()
    }
  }, [isAuthenticated])

  const loadQuizzes = async () => {
    const { data } = await supabase
      .from('quizzes')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (data) {
      setQuizzes(data)
    }
  }

  const createQuiz = async () => {
    const { data } = await supabase
      .from('quizzes')
      .insert([
        {
          ...formData,
          created_by: 'admin' // ในเวอร์ชันจริงควรมีระบบ authentication
        }
      ])
      .select()

    if (data) {
      setQuizzes([data[0], ...quizzes])
      setShowCreateForm(false)
      setFormData({
        name: '',
        difficulty: 'easy',
        time_per_question: 20,
        total_questions: 10,
        question_type: 'polynomial'
      })
    }
  }

  const deleteQuiz = async (id: string) => {
    if (confirm('คุณต้องการลบชุดข้อสอบนี้หรือไม่?')) {
      await supabase.from('quizzes').delete().eq('id', id)
      setQuizzes(quizzes.filter(q => q.id !== id))
    }
  }

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'ง่าย'
      case 'medium': return 'ปานกลาง'
      case 'hard': return 'ยาก'
      default: return difficulty
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-gray-100 text-gray-800'
      case 'medium': return 'bg-orange-100 text-orange-800'
      case 'hard': return 'bg-gray-800 text-white'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getQuestionTypeText = (questionType: string) => {
    switch (questionType) {
      case 'polynomial': return 'แยกตัวประกอบ'
      case 'equation': return 'แก้สมการ'
      case 'integer': return 'จำนวนเต็ม'
      case 'fraction': return 'เศษส่วน'
      case 'power': return 'เลขยกกำลัง'
      case 'root': return 'รากที่ n'
      case 'function': return 'ฟังก์ชัน'
      default: return questionType
    }
  }

  const handleLogin = () => {
    // รหัสผ่านสำหรับครู: teacher123
    if (password === 'teacher123') {
      setIsAuthenticated(true)
      setPassword('')
      // บันทึก login state ใน localStorage
      localStorage.setItem('admin_authenticated', 'true')
    } else {
      alert('รหัสผ่านไม่ถูกต้อง')
      setPassword('')
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    localStorage.removeItem('admin_authenticated')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <SigmaSpinner size="xl" className="mx-auto mb-4" />
          <p className="text-gray-600">กำลังโหลด...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <Card className="w-full max-w-md border-0 bg-white/70 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-gray-900">เข้าสู่ระบบครู</CardTitle>
            <p className="text-gray-600 mt-2">กรอกรหัสผ่านเพื่อเข้าใช้งาน</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">รหัสผ่าน</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="กรอกรหัสผ่าน"
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                className="text-center"
              />
            </div>
            <Button onClick={handleLogin} disabled={!password} className="w-full">
              เข้าสู่ระบบ
            </Button>
            <div className="text-center">
              <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
                กลับหน้าหลัก
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">หน้าครู</h1>
            <p className="text-gray-600 mt-2">จัดการชุดข้อสอบและดูผลคะแนน</p>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={handleLogout} className="text-gray-600 hover:text-gray-900">
              ออกจากระบบ
            </button>
            <Link href="/" className="text-gray-600 hover:text-gray-900">
              กลับหน้าหลัก
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">ชุดข้อสอบทั้งหมด</h2>
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                สร้างชุดใหม่
              </Button>
            </div>

            {showCreateForm && (
              <Card className="mb-6 border-0 bg-white/70 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>สร้างชุดข้อสอบใหม่</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">ชื่อชุดข้อสอบ</label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="เช่น การแยกตัวประกอบชุดที่ 1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">ประเภทข้อสอบ</label>
                    <select
                      value={formData.question_type}
                      onChange={(e) => setFormData({ ...formData, question_type: e.target.value as 'polynomial' | 'equation' | 'integer' | 'fraction' | 'power' | 'root' | 'function' })}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option value="polynomial">แยกตัวประกอบพหุนาม</option>
                      <option value="equation">แก้สมการ (เชิงเส้น/กำลังสอง)</option>
                      <option value="integer">คำนวณจำนวนเต็ม (+, -, ×, ÷)</option>
                      <option value="fraction">คำนวณเศษส่วน (+, -, ×, ÷)</option>
                      <option value="power">เลขยกกำลัง (a^n)</option>
                      <option value="root">รากที่ n (√, ∛, ∜)</option>
                      <option value="function">การหาค่าฟังก์ชัน f(x)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">ระดับความยาก</label>
                    <select
                      value={formData.difficulty}
                      onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as 'easy' | 'medium' | 'hard' })}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option value="easy">ง่าย</option>
                      <option value="medium">ปานกลาง</option>
                      <option value="hard">ยาก</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">เวลาต่อข้อ (วินาที)</label>
                      <Input
                        type="number"
                        value={formData.time_per_question}
                        onChange={(e) => setFormData({ ...formData, time_per_question: parseInt(e.target.value) || 20 })}
                        min="10"
                        max="60"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">จำนวนข้อ</label>
                      <Input
                        type="number"
                        value={formData.total_questions}
                        onChange={(e) => setFormData({ ...formData, total_questions: parseInt(e.target.value) || 10 })}
                        min="5"
                        max="50"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button onClick={createQuiz} disabled={!formData.name}>
                      สร้างชุดข้อสอบ
                    </Button>
                    <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                      ยกเลิก
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="space-y-4">
              {quizzes.map((quiz) => (
                <Card key={quiz.id} className="border-0 bg-white/70 backdrop-blur-sm hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{quiz.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                            {getQuestionTypeText(quiz.question_type)}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(quiz.difficulty)}`}>
                            {getDifficultyText(quiz.difficulty)}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>{quiz.total_questions} ข้อ</span>
                          <span>{quiz.time_per_question} วิ/ข้อ</span>
                          <span>สร้างเมื่อ {new Date(quiz.created_at).toLocaleDateString('th-TH')}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/quiz/${quiz.id}/qr`}>
                            <QrCode className="h-4 w-4 mr-1" />
                            QR Code
                          </Link>
                        </Button>
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/admin/quiz/${quiz.id}/results`}>
                            <Users className="h-4 w-4 mr-1" />
                            ผลคะแนน
                          </Link>
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => deleteQuiz(quiz.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <Card className="border-0 bg-white/70 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>สถิติรวม</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900">{quizzes.length}</div>
                    <div className="text-sm text-gray-600">ชุดข้อสอบทั้งหมด</div>
                  </div>
                  <div className="border-t pt-4">
                    <div className="text-sm text-gray-600 space-y-2">
                      <div className="flex justify-between">
                        <span>ง่าย:</span>
                        <span>{quizzes.filter(q => q.difficulty === 'easy').length} ชุด</span>
                      </div>
                      <div className="flex justify-between">
                        <span>ปานกลาง:</span>
                        <span>{quizzes.filter(q => q.difficulty === 'medium').length} ชุด</span>
                      </div>
                      <div className="flex justify-between">
                        <span>ยาก:</span>
                        <span>{quizzes.filter(q => q.difficulty === 'hard').length} ชุด</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}