/**
 * Seed script: สร้างโจทย์หา d (ลำดับเลขคณิต) และ r (ลำดับเรขาคณิต) 200 ข้อ
 * - d: จำนวนเต็ม (บวก/ลบ), แสดง 4-5 พจน์
 * - r: จำนวนเต็ม (บวก/ลบ, ≠0, ≠1), แสดง 4 พจน์
 * - ตอบแบบเติมคำตอบ (ไม่มี choices)
 * Usage: npx tsx scripts/seed-sequence-d-r.ts
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
  type: 'find_d' | 'find_r'
}

function generateAll(): SQ[] {
  const all: SQ[] = []
  const seen = new Set<string>()

  // === หา d ของลำดับเลขคณิต ===
  // d: ±1 ถึง ±15, a1: -10 ถึง 20, แสดง 4-5 พจน์
  for (const d of [...Array.from({length: 15}, (_, i) => i + 1), ...Array.from({length: 15}, (_, i) => -(i + 1))]) {
    for (let a1 = -10; a1 <= 20; a1++) {
      for (const termCount of [4, 5]) {
        const terms = Array.from({ length: termCount }, (_, i) => a1 + i * d)
        // ตรวจว่าเลขไม่ใหญ่เกิน
        if (terms.some(t => Math.abs(t) > 200)) continue

        const termStr = terms.join(', ')
        const expr = `ลำดับ ${termStr}, ... หา $d$`
        if (!seen.has(expr)) {
          seen.add(expr)
          all.push({ expression: expr, correctAnswer: d.toString(), type: 'find_d' })
        }
      }
    }
  }

  // === หา r ของลำดับเรขาคณิต ===
  // r: ±2, ±3, ±4, ±5, a1: ±1, ±2, ±3, แสดง 4 พจน์
  const rValues = [2, 3, 4, 5, -2, -3, -4, -5]
  const a1Values = [1, 2, 3, -1, -2, -3]

  for (const r of rValues) {
    for (const a1 of a1Values) {
      const terms = Array.from({ length: 4 }, (_, i) => a1 * Math.pow(r, i))
      // ตรวจว่าเลขไม่ใหญ่เกิน
      if (terms.some(t => Math.abs(t) > 5000)) continue

      const termStr = terms.join(', ')
      const expr = `ลำดับ ${termStr}, ... หา $r$`
      if (!seen.has(expr)) {
        seen.add(expr)
        all.push({ expression: expr, correctAnswer: r.toString(), type: 'find_r' })
      }
    }
  }

  return all
}

async function seed() {
  // ลบข้อเก่า
  const { error: delErr } = await supabase.from('questions').delete().eq('topic', 'sequence_d_r')
  if (delErr) { console.error('Delete error:', delErr.message); process.exit(1) }
  console.log('ลบข้อเก่าแล้ว')

  const allQuestions = generateAll()

  const findD = allQuestions.filter(q => q.type === 'find_d')
  const findR = allQuestions.filter(q => q.type === 'find_r')

  console.log(`Pool ทั้งหมด: ${allQuestions.length} ข้อ`)
  console.log(`  หา d: ${findD.length} ข้อ`)
  console.log(`  หา r: ${findR.length} ข้อ`)

  // เลือก 100 ข้อหา d + 100 ข้อหา r = 200 ข้อ
  const selectedD = shuffleArray(findD).slice(0, 100)
  const selectedR = shuffleArray(findR).slice(0, Math.min(100, findR.length))

  // ถ้า r ไม่ถึง 100 เติม d เพิ่ม
  const totalR = selectedR.length
  let selected: SQ[]
  if (totalR < 100) {
    const extraD = shuffleArray(findD.filter(q => !selectedD.includes(q))).slice(0, 100 - totalR)
    selected = [...selectedD, ...extraD, ...selectedR]
  } else {
    selected = [...selectedD, ...selectedR]
  }

  console.log(`เลือก: ${selected.length} ข้อ (d: ${selected.filter(q => q.type === 'find_d').length}, r: ${selected.filter(q => q.type === 'find_r').length})`)

  const rows = selected.map(q => ({
    topic: 'sequence_d_r',
    difficulty: 'easy' as const,
    question_latex: q.expression,
    correct_answer_latex: q.correctAnswer,
    choices: [], // ไม่มี choices → เติมคำตอบ
  }))

  console.log(`\nกำลัง insert ${rows.length} ข้อ...`)
  console.log(`ตัวอย่าง:`)
  for (let i = 0; i < Math.min(15, rows.length); i++) {
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

  console.log(`\nเสร็จ! เพิ่มโจทย์หา d, r ของลำดับ ${rows.length} ข้อเรียบร้อย`)
}

seed()
