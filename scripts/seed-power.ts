/**
 * Seed script: สร้างโจทย์เลขยกกำลัง (ง่าย) 50 ข้อ แบบ systematic
 * Usage: npx tsx scripts/seed-power.ts
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

function frac(n: number, d: number): string {
  const g = gcd(Math.abs(n), Math.abs(d))
  return `\\frac{${n / g}}{${d / g}}`
}

function gcd(a: number, b: number): number {
  while (b) { [a, b] = [b, a % b] }
  return a
}

function makeDistractors(correctStr: string, base: number, exp: number): string[] {
  const set = new Set<string>()
  if (exp < 0) {
    // ตัวลวงสำหรับยกกำลังติดลบ
    const absExp = Math.abs(exp)
    const den = Math.pow(base, absExp)
    const candidates = [
      frac(1, Math.pow(base, absExp + 1)),   // กำลังเกิน
      frac(1, Math.pow(base, Math.max(1, absExp - 1))), // กำลังขาด
      Math.pow(base, absExp).toString(),       // ลืมกลับเศษส่วน
      frac(1, Math.pow(base + 1, absExp)),     // ฐานเกิน
      frac(base, den),                          // เศษผิด
      (-den).toString(),                        // ติดลบแทน
    ]
    for (const c of candidates) {
      if (c !== correctStr && set.size < 3) set.add(c)
    }
    while (set.size < 3) {
      const r = Math.pow(base, Math.floor(Math.random() * 3) + 1)
      const fake = frac(1, r)
      if (fake !== correctStr) set.add(fake)
    }
  } else {
    // ตัวลวงสำหรับยกกำลังบวก/ศูนย์
    const correct = Math.pow(base, exp)
    const candidates = [
      base * exp, base + exp,
      Math.pow(base, exp + 1), Math.pow(base, Math.max(1, exp - 1)),
      Math.pow(base + 1, exp), Math.pow(Math.max(1, base - 1), exp),
      correct + base, correct - base, correct * 2, Math.pow(exp, base),
    ]
    for (const c of candidates) {
      if (c !== correct && c > 0 && Number.isInteger(c) && set.size < 3) {
        set.add(c.toString())
      }
    }
    while (set.size < 3) {
      const r = correct + Math.floor(Math.random() * 20) - 10
      if (r !== correct && r > 0) set.add(r.toString())
    }
  }
  return Array.from(set)
}

interface PQ { base: number, exp: number, ansStr: string }

async function seed() {
  const allQuestions: PQ[] = []

  // กำลัง 0: n^0 = 1 (ฐาน 2-20)
  for (let b = 2; b <= 20; b++) {
    allQuestions.push({ base: b, exp: 0, ansStr: '1' })
  }

  // กำลัง 1: n^1 = n (ฐาน 2-20)
  for (let b = 2; b <= 20; b++) {
    allQuestions.push({ base: b, exp: 1, ansStr: b.toString() })
  }

  // กำลัง 2-9 (ผลไม่เกิน 1000)
  for (let b = 2; b <= 31; b++) {
    for (let e = 2; e <= 9; e++) {
      const ans = Math.pow(b, e)
      if (ans <= 1000 && Number.isInteger(ans)) {
        allQuestions.push({ base: b, exp: e, ansStr: ans.toString() })
      }
    }
  }

  // กำลังติดลบ: n^{-e} = 1/n^e (ฐาน 2-10, กำลัง -1 ถึง -3)
  for (let b = 2; b <= 10; b++) {
    for (let e = -1; e >= -3; e--) {
      const den = Math.pow(b, Math.abs(e))
      allQuestions.push({ base: b, exp: e, ansStr: frac(1, den) })
    }
  }

  // สุ่มลำดับแล้วเลือก 50 ข้อ
  const selected = shuffleArray(allQuestions).slice(0, 100)

  const rows = selected.map(q => {
    const distractors = makeDistractors(q.ansStr, q.base, q.exp)
    const choices = shuffleArray([q.ansStr, ...distractors])
    return {
      topic: 'power',
      difficulty: 'easy' as const,
      question_latex: `${q.base}^{${q.exp}} = ?`,
      correct_answer_latex: q.ansStr,
      choices,
    }
  })

  console.log(`กำลัง insert ${rows.length} ข้อ...`)
  console.log(`ตัวอย่าง:`)
  for (let i = 0; i < 5; i++) {
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

  console.log(`\nเสร็จ! เพิ่มโจทย์เลขยกกำลัง (ง่าย) ${rows.length} ข้อเรียบร้อย`)
}

seed()
