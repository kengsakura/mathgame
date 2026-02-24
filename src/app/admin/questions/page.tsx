'use client'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, ChevronRight, Plus } from 'lucide-react'
import Link from 'next/link'

const DEFAULT_TOPICS: Record<string, string> = {
  derivative: 'อนุพันธ์ (Derivative)',
  integral: 'ปริพันธ์ไม่จำกัดเขต (Integral)',
  arithmetic_series: 'อนุกรมเลขคณิต (Arithmetic Series)',
  arithmetic_sequence: 'ลำดับเลขคณิต (Arithmetic Sequence)',
  polynomial: 'แยกตัวประกอบ',
  equation: 'แก้สมการ',
  geometric_sequence: 'ลำดับเรขาคณิต (Geometric Sequence)',
  integer_add_sub: 'บวกลบจำนวนเต็ม',
  integer_multiply: 'คูณจำนวนเต็ม',
  exponential: 'สมการเลขชี้กำลัง',
  sequence_d_r: 'หา d, r ของลำดับ',
  stat_mode_range: 'ฐานนิยม & พิสัย',
  number_grid: 'Grid หาตัวเลข 1-36',
  number_grid_even: 'Grid หาเลขคู่',
  number_grid_odd: 'Grid หาเลขคี่',
  number_grid_x3: 'Grid หาพหุคูณ 3',
  number_grid_x5: 'Grid หาพหุคูณ 5',
  power: 'เลขยกกำลัง',
  root: 'รากที่ n',
}

export default function QuestionsPage() {
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [newKey, setNewKey] = useState('')
  const [newDifficulty, setNewDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy')

  useEffect(() => {
    loadCounts()
  }, [])

  const loadCounts = async () => {
    const { data, error } = await supabase.from('questions').select('topic')

    if (error) {
      console.error('Error loading questions:', error.message)
    } else {
      const map: Record<string, number> = {}
      for (const row of data || []) {
        map[row.topic] = (map[row.topic] || 0) + 1
      }
      setCounts(map)
    }
    setLoading(false)
  }

  // Merge default topics + any custom topics found in DB
  const allTopicKeys = Array.from(new Set([
    ...Object.keys(DEFAULT_TOPICS),
    ...Object.keys(counts),
  ]))

  const getLabel = (key: string) => DEFAULT_TOPICS[key] || key

  const total = Object.values(counts).reduce((a, b) => a + b, 0)

  const handleAddTopic = () => {
    const key = newKey.trim().toLowerCase().replace(/\s+/g, '-')
    if (!key) return
    window.location.href = `/admin/questions/${encodeURIComponent(key)}?difficulty=${newDifficulty}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="container mx-auto max-w-3xl">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" asChild>
            <Link href="/admin">
              <ArrowLeft className="h-4 w-4 mr-2" />
              กลับหน้าหลัก
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">คลังข้อสอบ (Question Bank)</h1>
            <p className="text-gray-600">
              {loading ? 'กำลังโหลด...' : `ทั้งหมด ${total} ข้อ`}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {allTopicKeys.map((key) => (
            <Link key={key} href={`/admin/questions/${key}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer mb-3">
                <CardContent className="p-5 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">{getLabel(key)}</h2>
                    <p className="text-sm text-gray-500">
                      {loading ? '...' : `${counts[key] || 0} ข้อ`}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {showAdd ? (
          <div className="mt-6 bg-white rounded-lg border p-4 space-y-3">
            <h3 className="font-semibold text-gray-900">เพิ่มหัวข้อใหม่</h3>
            <Input
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              placeholder="ชื่อหัวข้อ เช่น integral"
            />
            <div>
              <label className="block text-sm font-medium mb-1">ระดับความยากเริ่มต้น</label>
              <select
                value={newDifficulty}
                onChange={(e) => setNewDifficulty(e.target.value as any)}
                className="w-full p-2 border rounded-md text-sm"
              >
                <option value="easy">ง่าย</option>
                <option value="medium">ปานกลาง</option>
                <option value="hard">ยาก</option>
              </select>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddTopic} disabled={!newKey.trim()}>สร้างหัวข้อ</Button>
              <Button variant="ghost" onClick={() => { setShowAdd(false); setNewKey('') }}>ยกเลิก</Button>
            </div>
          </div>
        ) : (
          <Button variant="outline" className="mt-6 w-full" onClick={() => setShowAdd(true)}>
            <Plus className="h-4 w-4 mr-2" />
            เพิ่มหัวข้อใหม่
          </Button>
        )}
      </div>
    </div>
  )
}
