'use client'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Plus, Trash2, Search } from 'lucide-react'
import Link from 'next/link'
import 'katex/dist/katex.min.css'
import Latex from 'react-katex'

interface Question {
  id: string
  topic: string
  difficulty: 'easy' | 'medium' | 'hard'
  question_latex: string
  correct_answer_latex: string
  choices: string[]
  created_at: string
}

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [filterTopic, setFilterTopic] = useState<string>('all')
  
  // Form State
  const [formData, setFormData] = useState({
    topic: 'derivative',
    difficulty: 'easy' as 'easy' | 'medium' | 'hard',
    question_latex: '',
    correct_answer_latex: '',
    wrong_choice_1: '',
    wrong_choice_2: '',
    wrong_choice_3: ''
  })

  useEffect(() => {
    loadQuestions()
  }, [])

  const loadQuestions = async () => {
    setLoading(true)
    let query = supabase.from('questions').select('*').order('created_at', { ascending: false })
    
    if (filterTopic !== 'all') {
      query = query.eq('topic', filterTopic)
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('Error loading questions:', error)
    } else {
      setQuestions(data || [])
    }
    setLoading(false)
  }

  // Reload when filter changes
  useEffect(() => {
    loadQuestions()
  }, [filterTopic])

  const handleSubmit = async () => {
    // Validate
    if (!formData.question_latex || !formData.correct_answer_latex || !formData.wrong_choice_1) {
      alert('กรุณากรอกข้อมูลให้ครบถ้วน')
      return
    }

    const choices = [
      formData.correct_answer_latex,
      formData.wrong_choice_1,
      formData.wrong_choice_2, 
      formData.wrong_choice_3
    ].filter(c => c !== '') // Remove empty choices

    const { data, error } = await supabase.from('questions').insert([
      {
        topic: formData.topic,
        difficulty: formData.difficulty,
        question_latex: formData.question_latex,
        correct_answer_latex: formData.correct_answer_latex,
        choices: choices // Supabase handles array -> jsonb conversion or we pass list
      }
    ]).select()

    if (error) {
      alert('เกิดข้อผิดพลาด: ' + error.message)
    } else if (data) {
      setQuestions([data[0], ...questions])
      setShowForm(false)
      // Reset form (keep basics)
      setFormData({
        ...formData,
        question_latex: '',
        correct_answer_latex: '',
        wrong_choice_1: '',
        wrong_choice_2: '',
        wrong_choice_3: ''
      })
      alert('บันทึกข้อสอบเรียบร้อย')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('ยืนยันการลบข้อสอบนี้?')) return

    const { error } = await supabase.from('questions').delete().eq('id', id)
    if (error) {
      alert('ลบไม่สำเร็จ: ' + error.message)
    } else {
      setQuestions(questions.filter(q => q.id !== id))
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="container mx-auto max-w-5xl">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" asChild>
            <Link href="/admin">
              <ArrowLeft className="h-4 w-4 mr-2" />
              กลับหน้าหลัก
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">คลังข้อสอบ (Question Bank)</h1>
            <p className="text-gray-600">จัดการโจทย์และตัวเลือกสำหรับระบบสุ่มข้อสอบ</p>
          </div>
        </div>

        <div className="flex justify-between items-center mb-6 gap-4">
          <div className="flex items-center gap-2 bg-white p-2 rounded-lg border">
            <Search className="h-4 w-4 text-gray-500" />
            <select 
              value={filterTopic} 
              onChange={(e) => setFilterTopic(e.target.value)}
              className="bg-transparent border-none outline-none text-sm min-w-[150px]"
            >
              <option value="all">ทุกหัวข้อ</option>
              <option value="derivative">อนุพันธ์ (Derivative)</option>
              <option value="polynomial">แยกตัวประกอบ</option>
              <option value="equation">แก้สมการ</option>
              <option value="power">เลขยกกำลัง</option>
              <option value="root">รากที่ n</option>
            </select>
          </div>

          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4 mr-2" />
            เพิ่มข้อสอบใหม่
          </Button>
        </div>

        {showForm && (
          <Card className="mb-8 border-0 shadow-lg bg-white/80 backdrop-blur">
            <CardHeader>
              <CardTitle>เพิ่มข้อสอบใหม่</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">หัวข้อ</label>
                  <select 
                    value={formData.topic}
                    onChange={(e) => setFormData({...formData, topic: e.target.value})}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="derivative">อนุพันธ์ (Derivative)</option>
                    <option value="polynomial">แยกตัวประกอบ</option>
                    <option value="equation">แก้สมการ</option>
                    <option value="power">เลขยกกำลัง</option>
                    <option value="root">รากที่ n</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">ความยาก</label>
                  <select 
                    value={formData.difficulty}
                    onChange={(e) => setFormData({...formData, difficulty: e.target.value as any})}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="easy">ง่าย</option>
                    <option value="medium">ปานกลาง</option>
                    <option value="hard">ยาก</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">โจทย์ (LaTeX)</label>
                <div className="flex gap-4">
                  <Input 
                    value={formData.question_latex} 
                    onChange={(e) => setFormData({...formData, question_latex: e.target.value})}
                    placeholder="เช่น จงหาอนุพันธ์ของ $f(x) = x^2$"
                  />
                  <div className="p-2 bg-gray-100 rounded min-w-[100px] flex items-center justify-center">
                    <Latex>{formData.question_latex || 'ตัวอย่าง'}</Latex>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-green-700">คำตอบที่ถูก (LaTeX)</label>
                <div className="flex gap-4">
                  <Input 
                    value={formData.correct_answer_latex} 
                    onChange={(e) => setFormData({...formData, correct_answer_latex: e.target.value})}
                    placeholder="เช่น $2x$"
                    className="border-green-300 focus:border-green-500"
                  />
                   <div className="p-2 bg-green-50 rounded min-w-[100px] flex items-center justify-center">
                    <Latex>{formData.correct_answer_latex || 'ตัวอย่าง'}</Latex>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-red-700">ตัวลวง 1</label>
                  <Input 
                    value={formData.wrong_choice_1} 
                    onChange={(e) => setFormData({...formData, wrong_choice_1: e.target.value})}
                    placeholder="เช่น $2$"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-red-700">ตัวลวง 2</label>
                  <Input 
                    value={formData.wrong_choice_2} 
                    onChange={(e) => setFormData({...formData, wrong_choice_2: e.target.value})}
                    placeholder="เช่น $x$"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-red-700">ตัวลวง 3</label>
                  <Input 
                    value={formData.wrong_choice_3} 
                    onChange={(e) => setFormData({...formData, wrong_choice_3: e.target.value})}
                    placeholder="เช่น $x^2$"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-2">
                <Button onClick={handleSubmit}>บันทึกข้อมูล</Button>
                <Button variant="ghost" onClick={() => setShowForm(false)}>ยกเลิก</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <div className="text-center py-12 text-gray-500">กำลังโหลด...</div>
        ) : (
          <div className="space-y-4">
            {questions.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg border border-dashed">
                <p className="text-gray-500">ยังไม่มีข้อสอบในคลังสำหรับหัวข้อนี้</p>
              </div>
            ) : (
              questions.map((q) => (
                <Card key={q.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full uppercase font-bold">
                            {q.topic}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full uppercase font-bold ${
                            q.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                            q.difficulty === 'medium' ? 'bg-orange-100 text-orange-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {q.difficulty}
                          </span>
                        </div>
                        <h3 className="text-lg font-medium mb-2">
                          <Latex>{q.question_latex}</Latex>
                        </h3>
                        <div className="flex gap-4 text-sm">
                          <div className="flex items-center text-green-700 bg-green-50 px-3 py-1 rounded-md">
                            <span className="font-bold mr-2">ตอบ:</span>
                            <Latex>{q.correct_answer_latex}</Latex>
                          </div>
                          <div className="text-gray-500 flex items-center">
                            <span className="mr-2">ตัวเลือก:</span>
                            {q.choices.map((c, i) => (
                              <span key={i} className="mr-2 px-2 bg-gray-100 rounded text-xs">
                                {c}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(q.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
