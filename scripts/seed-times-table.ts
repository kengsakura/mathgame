/**
 * Seed script: สร้างโจทย์สูตรคูณ (ง่าย) ทุกคู่ 2-12 × 1-12 (132 ข้อ)
 * - difficulty: 'easy' ทั้งหมด
 * Usage: npx tsx scripts/seed-times-table.ts
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

function makeDistractors(correct: number, a: number, b: number): string[] {
  const set = new Set<string>()
  const candidates = [
    a * (b + 1),
    a * (b - 1),
    (a + 1) * b,
    (a - 1) * b,
    a * b + a,
    a * b - a,
    a * b + b,
    a * b - b,
    a + b,
    correct + 1,
    correct - 1,
  ]
  for (const c of candidates) {
    if (c !== correct && c > 0 && set.size < 3) set.add(c.toString())
  }
  while (set.size < 3) {
    const offset = Math.floor(Math.random() * 10) + 1
    const candidate = correct + (Math.random() < 0.5 ? offset : -offset)
    if (candidate !== correct && candidate > 0) set.add(candidate.toString())
  }
  return Array.from(set).slice(0, 3)
}

async function seed() {
  // ลบข้อเก่าก่อน
  const { error: delErr } = await supabase.from('questions').delete().eq('topic', 'times_table')
  if (delErr) { console.error('Delete error:', delErr.message); process.exit(1) }
  console.log('ลบข้อเก่าแล้ว')

  const rows: {
    topic: string
    difficulty: 'easy'
    question_latex: string
    correct_answer_latex: string
    choices: string[]
  }[] = []

  // สร้างทุกคู่ 2-12 × 1-12
  for (let a = 2; a <= 12; a++) {
    for (let b = 1; b <= 12; b++) {
      const correct = a * b
      const expression = `$${a} \\times ${b} = ?$`
      const distractors = makeDistractors(correct, a, b)
      const choices = shuffleArray([correct.toString(), ...distractors])

      rows.push({
        topic: 'times_table',
        difficulty: 'easy',
        question_latex: expression,
        correct_answer_latex: correct.toString(),
        choices,
      })
    }
  }

  console.log(`สร้างโจทย์ทั้งหมด ${rows.length} ข้อ`)
  console.log('ตัวอย่าง 5 ข้อแรก:')
  for (let i = 0; i < 5; i++) {
    console.log(`  ${rows[i].question_latex} → ${rows[i].correct_answer_latex} | ตัวเลือก: ${rows[i].choices.join(', ')}`)
  }

  // Insert เป็น batch
  for (let i = 0; i < rows.length; i += 25) {
    const batch = rows.slice(i, i + 25)
    const { error } = await supabase.from('questions').insert(batch)
    if (error) {
      console.error(`Error inserting batch ${Math.floor(i / 25) + 1}:`, error.message)
      process.exit(1)
    }
    console.log(`  batch ${Math.floor(i / 25) + 1}: insert ${batch.length} ข้อ OK`)
  }

  console.log(`\nเสร็จ! เพิ่มโจทย์สูตรคูณ (ง่าย) ${rows.length} ข้อเรียบร้อย`)
}

seed()
