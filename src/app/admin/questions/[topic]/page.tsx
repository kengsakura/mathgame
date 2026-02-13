'use client'
import { useState, useEffect, use, useRef, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Plus, Trash2, Upload, Pencil, X, ChevronLeft, ChevronRight } from 'lucide-react'
import * as XLSX from 'xlsx'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import 'katex/dist/katex.min.css'
import { InlineMath } from 'react-katex'

const TOPIC_LABELS: Record<string, string> = {
  derivative: 'อนุพันธ์ (Derivative)',
  integral: 'ปริพันธ์ไม่จำกัดเขต (Integral)',
  arithmetic_series: 'อนุกรมเลขคณิต (Arithmetic Series)',
  arithmetic_sequence: 'ลำดับเลขคณิต (Arithmetic Sequence)',
  geometric_sequence: 'ลำดับเรขาคณิต (Geometric Sequence)',
  integer_add_sub: 'บวกลบจำนวนเต็ม',
  polynomial: 'แยกตัวประกอบ',
  equation: 'แก้สมการ',
  power: 'เลขยกกำลัง',
  root: 'รากที่ n',
}

const PER_PAGE = 30

interface Question {
  id: string
  topic: string
  difficulty: 'easy' | 'medium' | 'hard'
  question_latex: string
  correct_answer_latex: string
  choices: string[]
  created_at: string
}

export default function TopicQuestionsPage({ params }: { params: Promise<{ topic: string }> }) {
  const { topic } = use(params)
  const searchParams = useSearchParams()
  const defaultDifficulty = useMemo(() => {
    const d = searchParams.get('difficulty')
    return (d === 'easy' || d === 'medium' || d === 'hard') ? d : 'easy'
  }, [searchParams])

  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [importDifficulty, setImportDifficulty] = useState<'easy' | 'medium' | 'hard'>(defaultDifficulty)
  const [importing, setImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Filter & pagination
  const [filterDifficulty, setFilterDifficulty] = useState<'all' | 'easy' | 'medium' | 'hard'>('all')
  const [page, setPage] = useState(1)

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editData, setEditData] = useState({
    difficulty: 'easy' as 'easy' | 'medium' | 'hard',
    question_latex: '',
    correct_answer_latex: '',
    wrong_choice_1: '',
    wrong_choice_2: '',
    wrong_choice_3: ''
  })

  const [formData, setFormData] = useState({
    difficulty: defaultDifficulty as 'easy' | 'medium' | 'hard',
    question_latex: '',
    correct_answer_latex: '',
    wrong_choice_1: '',
    wrong_choice_2: '',
    wrong_choice_3: ''
  })

  useEffect(() => {
    loadQuestions()
  }, [topic])

  // Reset page when filter changes
  useEffect(() => {
    setPage(1)
  }, [filterDifficulty])

  const loadQuestions = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('topic', topic)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error loading questions:', error.message, error.code, error.details)
    } else {
      setQuestions(data || [])
    }
    setLoading(false)
  }

  // Filtered + paginated
  const filtered = useMemo(() =>
    filterDifficulty === 'all' ? questions : questions.filter(q => q.difficulty === filterDifficulty),
    [questions, filterDifficulty]
  )
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const handleSubmit = async () => {
    if (!formData.question_latex || !formData.correct_answer_latex || !formData.wrong_choice_1) {
      alert('กรุณากรอกข้อมูลให้ครบถ้วน')
      return
    }

    const choices = [
      formData.correct_answer_latex,
      formData.wrong_choice_1,
      formData.wrong_choice_2,
      formData.wrong_choice_3
    ].filter(c => c !== '')

    const { data, error } = await supabase.from('questions').insert([
      {
        topic,
        difficulty: formData.difficulty,
        question_latex: formData.question_latex,
        correct_answer_latex: formData.correct_answer_latex,
        choices
      }
    ]).select()

    if (error) {
      alert('เกิดข้อผิดพลาด: ' + error.message)
    } else if (data) {
      setQuestions([data[0], ...questions])
      setShowForm(false)
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

  const startEdit = (q: Question) => {
    setEditingId(q.id)
    const wrongs = q.choices.filter(c => c !== q.correct_answer_latex)
    setEditData({
      difficulty: q.difficulty,
      question_latex: q.question_latex,
      correct_answer_latex: q.correct_answer_latex,
      wrong_choice_1: wrongs[0] || '',
      wrong_choice_2: wrongs[1] || '',
      wrong_choice_3: wrongs[2] || ''
    })
  }

  const handleUpdate = async () => {
    if (!editingId || !editData.question_latex || !editData.correct_answer_latex) {
      alert('กรุณากรอกข้อมูลให้ครบถ้วน')
      return
    }

    const choices = [
      editData.correct_answer_latex,
      editData.wrong_choice_1,
      editData.wrong_choice_2,
      editData.wrong_choice_3
    ].filter(c => c !== '')

    const { error } = await supabase.from('questions').update({
      difficulty: editData.difficulty,
      question_latex: editData.question_latex,
      correct_answer_latex: editData.correct_answer_latex,
      choices
    }).eq('id', editingId)

    if (error) {
      alert('แก้ไขไม่สำเร็จ: ' + error.message)
    } else {
      setQuestions(questions.map(q => q.id === editingId ? {
        ...q,
        difficulty: editData.difficulty,
        question_latex: editData.question_latex,
        correct_answer_latex: editData.correct_answer_latex,
        choices
      } : q))
      setEditingId(null)
    }
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImporting(true)
    try {
      const data = await file.arrayBuffer()
      const wb = XLSX.read(data)
      const ws = wb.Sheets[wb.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1 })

      const startIdx = rows[0]?.[0]?.toString().toLowerCase().includes('question') ? 1 : 0

      const toInsert = rows.slice(startIdx)
        .filter(row => row[0] && row[1])
        .map(row => {
          const question_latex = String(row[0]).trim()
          const correct_answer_latex = String(row[1]).trim()
          const wrongs = [row[2], row[3], row[4]].filter(Boolean).map(v => String(v).trim())
          return {
            topic,
            difficulty: importDifficulty,
            question_latex,
            correct_answer_latex,
            choices: [correct_answer_latex, ...wrongs],
          }
        })

      if (toInsert.length === 0) {
        alert('ไม่พบข้อมูลในไฟล์')
        setImporting(false)
        return
      }

      const { error } = await supabase.from('questions').insert(toInsert)
      if (error) {
        alert('Import ผิดพลาด: ' + error.message)
      } else {
        alert(`นำเข้าสำเร็จ ${toInsert.length} ข้อ`)
        loadQuestions()
      }
    } catch (err) {
      alert('อ่านไฟล์ไม่สำเร็จ: ' + (err as Error).message)
    }
    setImporting(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const topicLabel = TOPIC_LABELS[topic] || topic

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="container mx-auto max-w-5xl">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" asChild>
            <Link href="/admin/questions">
              <ArrowLeft className="h-4 w-4 mr-2" />
              กลับหัวข้อ
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{topicLabel}</h1>
            <p className="text-gray-600">
              {loading ? 'กำลังโหลด...' : `${filtered.length} ข้อ${filterDifficulty !== 'all' ? ` (จาก ${questions.length})` : ''}`}
            </p>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap justify-between gap-3 mb-6">
          {/* Filter */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-lg border">
            {(['all', 'easy', 'medium', 'hard'] as const).map((d) => (
              <button
                key={d}
                onClick={() => setFilterDifficulty(d)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  filterDifficulty === d
                    ? d === 'easy' ? 'bg-green-100 text-green-800'
                    : d === 'medium' ? 'bg-orange-100 text-orange-800'
                    : d === 'hard' ? 'bg-red-100 text-red-800'
                    : 'bg-gray-900 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {d === 'all' ? 'ทั้งหมด' : d === 'easy' ? 'ง่าย' : d === 'medium' ? 'ปานกลาง' : 'ยาก'}
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <select
              value={importDifficulty}
              onChange={(e) => setImportDifficulty(e.target.value as any)}
              className="p-2 border rounded-md text-sm"
            >
              <option value="easy">ง่าย</option>
              <option value="medium">ปานกลาง</option>
              <option value="hard">ยาก</option>
            </select>
            <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={importing}>
              <Upload className="h-4 w-4 mr-2" />
              {importing ? 'กำลัง Import...' : 'Import'}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xls,.xlsx"
              onChange={handleImport}
              className="hidden"
            />
            <Button onClick={() => { setShowForm(!showForm); setEditingId(null) }}>
              <Plus className="h-4 w-4 mr-2" />
              เพิ่มข้อสอบใหม่
            </Button>
          </div>
        </div>

        {/* Add form */}
        {showForm && (
          <Card className="mb-8 border-0 shadow-lg bg-white/80 backdrop-blur">
            <CardHeader>
              <CardTitle>เพิ่มข้อสอบใหม่ — {topicLabel}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
              <div>
                <label className="block text-sm font-medium mb-1">โจทย์ (LaTeX)</label>
                <div className="flex gap-4">
                  <Input
                    value={formData.question_latex}
                    onChange={(e) => setFormData({...formData, question_latex: e.target.value})}
                    placeholder="เช่น จงหาอนุพันธ์ของ $f(x) = x^2$"
                  />
                  <div className="p-2 bg-gray-100 rounded min-w-[100px] flex items-center justify-center">
                    <InlineMath>{formData.question_latex || 'ตัวอย่าง'}</InlineMath>
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
                    <InlineMath>{formData.correct_answer_latex || 'ตัวอย่าง'}</InlineMath>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-red-700">ตัวลวง 1</label>
                  <Input value={formData.wrong_choice_1} onChange={(e) => setFormData({...formData, wrong_choice_1: e.target.value})} placeholder="เช่น $2$" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-red-700">ตัวลวง 2</label>
                  <Input value={formData.wrong_choice_2} onChange={(e) => setFormData({...formData, wrong_choice_2: e.target.value})} placeholder="เช่น $x$" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-red-700">ตัวลวง 3</label>
                  <Input value={formData.wrong_choice_3} onChange={(e) => setFormData({...formData, wrong_choice_3: e.target.value})} placeholder="เช่น $x^2$" />
                </div>
              </div>
              <div className="pt-4 flex gap-2">
                <Button onClick={handleSubmit}>บันทึกข้อมูล</Button>
                <Button variant="ghost" onClick={() => setShowForm(false)}>ยกเลิก</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Question list */}
        {loading ? (
          <div className="text-center py-12 text-gray-500">กำลังโหลด...</div>
        ) : (
          <div className="space-y-4">
            {filtered.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg border border-dashed">
                <p className="text-gray-500">ยังไม่มีข้อสอบ{filterDifficulty !== 'all' ? 'ระดับนี้' : 'ในหัวข้อนี้'}</p>
              </div>
            ) : (
              <>
                {paginated.map((q) => (
                  <Card key={q.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      {editingId === q.id ? (
                        /* Edit inline */
                        <div className="space-y-3">
                          <div className="flex gap-3">
                            <select
                              value={editData.difficulty}
                              onChange={(e) => setEditData({...editData, difficulty: e.target.value as any})}
                              className="p-2 border rounded-md text-sm"
                            >
                              <option value="easy">ง่าย</option>
                              <option value="medium">ปานกลาง</option>
                              <option value="hard">ยาก</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">โจทย์</label>
                            <Input value={editData.question_latex} onChange={(e) => setEditData({...editData, question_latex: e.target.value})} />
                          </div>
                          <div>
                            <label className="block text-xs text-green-600 mb-1">คำตอบที่ถูก</label>
                            <Input value={editData.correct_answer_latex} onChange={(e) => setEditData({...editData, correct_answer_latex: e.target.value})} className="border-green-300" />
                          </div>
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <label className="block text-xs text-red-600 mb-1">ตัวลวง 1</label>
                              <Input value={editData.wrong_choice_1} onChange={(e) => setEditData({...editData, wrong_choice_1: e.target.value})} />
                            </div>
                            <div>
                              <label className="block text-xs text-red-600 mb-1">ตัวลวง 2</label>
                              <Input value={editData.wrong_choice_2} onChange={(e) => setEditData({...editData, wrong_choice_2: e.target.value})} />
                            </div>
                            <div>
                              <label className="block text-xs text-red-600 mb-1">ตัวลวง 3</label>
                              <Input value={editData.wrong_choice_3} onChange={(e) => setEditData({...editData, wrong_choice_3: e.target.value})} />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={handleUpdate}>บันทึก</Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>ยกเลิก</Button>
                          </div>
                        </div>
                      ) : (
                        /* Display */
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`text-xs px-2 py-1 rounded-full uppercase font-bold ${
                                q.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                                q.difficulty === 'medium' ? 'bg-orange-100 text-orange-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {q.difficulty}
                              </span>
                            </div>
                            <h3 className="text-lg font-medium mb-2">
                              <InlineMath>{q.question_latex}</InlineMath>
                            </h3>
                            <div className="flex flex-wrap gap-2 text-sm">
                              <div className="flex items-center text-green-700 bg-green-50 px-3 py-1 rounded-md">
                                <span className="font-bold mr-2">ตอบ:</span>
                                <InlineMath>{q.correct_answer_latex}</InlineMath>
                              </div>
                              {q.choices.filter(c => c !== q.correct_answer_latex).map((c, i) => (
                                <span key={i} className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-500">
                                  <InlineMath>{c}</InlineMath>
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="text-gray-500 hover:text-blue-600 hover:bg-blue-50" onClick={() => startEdit(q)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(q.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage(p => p - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-gray-600">
                      หน้า {page} / {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages}
                      onClick={() => setPage(p => p + 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
