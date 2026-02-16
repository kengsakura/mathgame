/**
 * Seed script: สร้างโจทย์บวกลบเลขโดดหลายตัว (ปานกลาง) 200 ข้อ ไม่ซ้ำ
 * - เลขโดด 1-9 จำนวน 5-7 ตัว บวกลบกัน
 * - ตัวเลือก 4 ตัว ใกล้ๆ กัน
 * Usage: npx tsx scripts/seed-integer-add-sub-medium.ts
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

interface AQ {
  expression: string
  correctAnswer: number
}

function makeDistractors(correct: number): string[] {
  // ตัวเลือกใกล้ๆ กัน (±1, ±2, ±3)
  const set = new Set<string>()
  const offsets = shuffleArray([1, -1, 2, -2, 3, -3, 4, -4])
  for (const off of offsets) {
    if (set.size < 3) {
      set.add((correct + off).toString())
    }
  }
  return Array.from(set)
}

function generateAll(): AQ[] {
  const all: AQ[] = []
  const seen = new Set<string>()

  // สร้าง 600 ข้อแบบสุ่ม เพื่อให้ pool ใหญ่พอ
  for (let attempt = 0; attempt < 2000 && all.length < 600; attempt++) {
    // สุ่มจำนวนตัว 5-7
    const count = 5 + Math.floor(Math.random() * 3) // 5, 6, 7

    const nums: number[] = []
    const ops: string[] = []

    // ตัวแรกเป็นเลขโดด 1-9
    nums.push(Math.floor(Math.random() * 9) + 1)

    for (let i = 1; i < count; i++) {
      const digit = Math.floor(Math.random() * 9) + 1
      const op = Math.random() < 0.5 ? '+' : '-'
      nums.push(digit)
      ops.push(op)
    }

    // สร้าง expression
    let expr = nums[0].toString()
    let result = nums[0]
    for (let i = 0; i < ops.length; i++) {
      expr += ` ${ops[i]} ${nums[i + 1]}`
      result += ops[i] === '+' ? nums[i + 1] : -nums[i + 1]
    }

    const fullExpr = `${expr} = ?`

    if (!seen.has(fullExpr)) {
      seen.add(fullExpr)
      all.push({ expression: fullExpr, correctAnswer: result })
    }
  }

  return all
}

async function seed() {
  // ลบข้อเก่า medium ของ integer_add_sub
  const { error: delErr } = await supabase
    .from('questions')
    .delete()
    .eq('topic', 'integer_add_sub')
    .eq('difficulty', 'medium')
  if (delErr) { console.error('Delete error:', delErr.message); process.exit(1) }
  console.log('ลบข้อเก่า (medium) แล้ว')

  const allQuestions = generateAll()
  console.log(`Pool ทั้งหมด: ${allQuestions.length} ข้อ`)

  // สุ่มเลือก 200 ข้อ
  const selected = shuffleArray(allQuestions).slice(0, 200)

  const rows = selected.map(q => {
    const distractors = makeDistractors(q.correctAnswer)
    const choices = shuffleArray([q.correctAnswer.toString(), ...distractors])

    return {
      topic: 'integer_add_sub',
      difficulty: 'medium' as const,
      question_latex: q.expression,
      correct_answer_latex: q.correctAnswer.toString(),
      choices,
    }
  })

  console.log(`\nกำลัง insert ${rows.length} ข้อ...`)
  console.log(`ตัวอย่าง:`)
  for (let i = 0; i < Math.min(15, rows.length); i++) {
    console.log(`  ${rows[i].question_latex} → ${rows[i].correct_answer_latex}  choices: [${rows[i].choices.join(', ')}]`)
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

  console.log(`\nเสร็จ! เพิ่มโจทย์บวกลบเลขโดดหลายตัว (ปานกลาง) ${rows.length} ข้อเรียบร้อย`)
}

seed()
