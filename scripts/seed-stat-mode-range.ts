/**
 * Seed script: สร้างโจทย์หาฐานนิยม (Mode) และพิสัย (Range) 100 ข้อ
 * - ข้อมูล 17-20 จำนวน, ไม่เรียง, เลข 1-30
 * - ฐานนิยมมีตัวเดียว (unimodal)
 * - ตอบแบบเติมคำตอบ (ไม่มี choices)
 * Usage: npx tsx scripts/seed-stat-mode-range.ts
 */
import { readFileSync } from 'fs'
import { resolve } from 'path'

const envPath = resolve(import.meta.dirname || __dirname, '..', '.env.local')
const envContent = readFileSync(envPath, 'utf-8')
for (const line of envContent.split('\n')) {
  const match = line.match(/^([^#=]+)=(.*)$/)
  if (match) process.env[match[1].trim()] = match[2].trim()
}

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

interface SQ {
  expression: string
  correctAnswer: string
  type: 'mode' | 'range'
}

function generateModeQuestion(): SQ {
  const count = 17 + Math.floor(Math.random() * 4) // 17-20
  const modeValue = Math.floor(Math.random() * 30) + 1
  const modeFreq = 3 + Math.floor(Math.random() * 2) // ซ้ำ 3-4 ครั้ง

  const numbers: number[] = []
  for (let i = 0; i < modeFreq; i++) numbers.push(modeValue)

  // เติมเลขอื่น ซ้ำได้แต่ต้องน้อยกว่า modeFreq
  while (numbers.length < count) {
    const v = Math.floor(Math.random() * 30) + 1
    if (v === modeValue) continue
    const freq = numbers.filter(n => n === v).length
    if (freq >= modeFreq - 1) continue
    numbers.push(v)
  }

  const shuffled = shuffleArray(numbers)
  return {
    expression: `ข้อมูล: ${shuffled.join(', ')}  หาฐานนิยม`,
    correctAnswer: modeValue.toString(),
    type: 'mode'
  }
}

function generateRangeQuestion(): SQ {
  const count = 17 + Math.floor(Math.random() * 4) // 17-20
  const numbers: number[] = []
  for (let i = 0; i < count; i++) {
    numbers.push(Math.floor(Math.random() * 30) + 1)
  }
  const shuffled = shuffleArray(numbers)
  const range = Math.max(...shuffled) - Math.min(...shuffled)

  return {
    expression: `ข้อมูล: ${shuffled.join(', ')}  หาพิสัย`,
    correctAnswer: range.toString(),
    type: 'range'
  }
}

async function seed() {
  // ลบข้อเก่า
  const { error: delErr } = await supabase.from('questions').delete().eq('topic', 'stat_mode_range')
  if (delErr) { console.error('Delete error:', delErr.message); process.exit(1) }
  console.log('ลบข้อเก่าแล้ว')

  const all: SQ[] = []
  const seen = new Set<string>()

  // สร้าง 50 ข้อหาฐานนิยม
  while (all.filter(q => q.type === 'mode').length < 50) {
    const q = generateModeQuestion()
    if (!seen.has(q.expression)) {
      seen.add(q.expression)
      all.push(q)
    }
  }

  // สร้าง 50 ข้อหาพิสัย
  while (all.filter(q => q.type === 'range').length < 50) {
    const q = generateRangeQuestion()
    if (!seen.has(q.expression)) {
      seen.add(q.expression)
      all.push(q)
    }
  }

  console.log(`สร้างทั้งหมด: ${all.length} ข้อ (ฐานนิยม: ${all.filter(q => q.type === 'mode').length}, พิสัย: ${all.filter(q => q.type === 'range').length})`)

  const rows = all.map(q => ({
    topic: 'stat_mode_range',
    difficulty: 'easy' as const,
    question_latex: q.expression,
    correct_answer_latex: q.correctAnswer,
    choices: [],
  }))

  console.log(`\nกำลัง insert ${rows.length} ข้อ...`)
  console.log(`ตัวอย่าง:`)
  for (let i = 0; i < Math.min(10, rows.length); i++) {
    console.log(`  ${rows[i].question_latex} → ${rows[i].correct_answer_latex}`)
  }

  for (let i = 0; i < rows.length; i += 25) {
    const batch = rows.slice(i, i + 25)
    const { error } = await supabase.from('questions').insert(batch)
    if (error) {
      console.error(`Error inserting batch ${i / 25 + 1}:`, error.message)
      process.exit(1)
    }
    console.log(`  batch ${i / 25 + 1}: insert ${batch.length} ข้อ OK`)
  }

  console.log(`\nเสร็จ! เพิ่มโจทย์ฐานนิยม & พิสัย ${rows.length} ข้อเรียบร้อย`)
}

seed()
