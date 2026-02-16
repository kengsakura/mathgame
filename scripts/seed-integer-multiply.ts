/**
 * Seed script: สร้างโจทย์คูณจำนวนเต็ม (ง่าย) 200 ข้อ ไม่ซ้ำ
 * - คูณ 2 ตัว: ตัวแรก ±1 ถึง ±12, ตัวที่สอง ±1 ถึง ±99
 * - |ผลลัพธ์| ≤ 200
 * - มีทั้งบวก×บวก, บวก×ลบ, ลบ×บวก, ลบ×ลบ
 * Usage: npx tsx scripts/seed-integer-multiply.ts
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

interface MQ {
  a: number
  b: number
  expression: string
  correctAnswer: number
  signType: string // '+×+', '+×-', '-×+', '-×-'
}

function makeDistractors(correct: number, a: number, b: number): string[] {
  const set = new Set<string>()
  const candidates = [
    correct + a,
    correct - a,
    correct + b,
    correct - b,
    -correct,        // เครื่องหมายผิด
    a + b,           // บวกแทนคูณ
    a - b,           // ลบแทนคูณ
    correct + 1,
    correct - 1,
    Math.abs(a) * Math.abs(b) * (correct < 0 ? 1 : -1), // เครื่องหมายกลับ
  ]
  for (const c of candidates) {
    if (c !== correct && set.size < 3) set.add(c.toString())
  }
  while (set.size < 3) {
    const r = correct + Math.floor(Math.random() * 20) - 10
    if (r !== correct) set.add(r.toString())
  }
  return Array.from(set)
}

function generateAll(): MQ[] {
  const all: MQ[] = []
  const seen = new Set<string>()

  // a: 1-12, b: 1-99
  for (let a = 1; a <= 12; a++) {
    for (let b = 1; b <= 99; b++) {
      if (a * b > 200) continue

      // 4 แบบเครื่องหมาย
      const signs: [number, number, string][] = [
        [a, b, '+×+'],
        [a, -b, '+×-'],
        [-a, b, '-×+'],
        [-a, -b, '-×-'],
      ]

      for (const [sa, sb, signType] of signs) {
        const ans = sa * sb
        const aStr = sa < 0 ? `(${sa})` : `${sa}`
        const bStr = sb < 0 ? `(${sb})` : `${sb}`
        const expr = `$${aStr} \\times ${bStr} = ?$`

        if (!seen.has(expr)) {
          seen.add(expr)
          all.push({ a: sa, b: sb, expression: expr, correctAnswer: ans, signType })
        }
      }
    }
  }

  return all
}

async function seed() {
  // ลบข้อเก่าก่อน
  const { error: delErr } = await supabase.from('questions').delete().eq('topic', 'integer_multiply')
  if (delErr) { console.error('Delete error:', delErr.message); process.exit(1) }
  console.log('ลบข้อเก่าแล้ว')

  const allQuestions = generateAll()

  // นับจำนวนแต่ละ signType
  const signCounts: Record<string, number> = {}
  for (const q of allQuestions) {
    signCounts[q.signType] = (signCounts[q.signType] || 0) + 1
  }
  console.log(`Pool ทั้งหมด: ${allQuestions.length} ข้อ`)
  console.log('จำนวนแต่ละแบบ:', signCounts)

  // กระจาย 200 ข้อ: 50 ข้อต่อ signType
  const bySign: Record<string, MQ[]> = {}
  for (const q of allQuestions) {
    if (!bySign[q.signType]) bySign[q.signType] = []
    bySign[q.signType].push(q)
  }

  const selected: MQ[] = []
  const signTypes = Object.keys(bySign)
  const perSign = Math.floor(200 / signTypes.length) // 50

  for (const st of signTypes) {
    const shuffled = shuffleArray(bySign[st])
    selected.push(...shuffled.slice(0, perSign))
  }

  // เติมส่วนที่เหลือ (ถ้ามี)
  const remaining = 200 - selected.length
  if (remaining > 0) {
    const extra = shuffleArray(allQuestions.filter(q => !selected.includes(q)))
    selected.push(...extra.slice(0, remaining))
  }

  const rows = selected.map(q => {
    const distractors = makeDistractors(q.correctAnswer, q.a, q.b)
    const choices = shuffleArray([q.correctAnswer.toString(), ...distractors])

    return {
      topic: 'integer_multiply',
      difficulty: 'easy' as const,
      question_latex: q.expression,
      correct_answer_latex: q.correctAnswer.toString(),
      choices,
    }
  })

  console.log(`\nกำลัง insert ${rows.length} ข้อ...`)
  console.log(`ตัวอย่าง:`)
  for (let i = 0; i < Math.min(12, rows.length); i++) {
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

  console.log(`\nเสร็จ! เพิ่มโจทย์คูณจำนวนเต็ม (ง่าย) ${rows.length} ข้อเรียบร้อย`)
}

seed()
