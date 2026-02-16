/**
 * Seed script: สร้างโจทย์สมการเลขชี้กำลัง (ง่าย) 100 ข้อ ไม่ซ้ำ
 * - ฐาน > 1 เท่านั้น (ฟังก์ชันเพิ่ม)
 * - ผลยกกำลัง ≤ 1000
 * - คำตอบเป็นจำนวนเต็มเสมอ
 * - ตอบแบบเติมคำตอบ (ไม่มี choices)
 * - 5 รูปแบบ: b^x=n, b^{x+c}=n, b^{x-c}=n, b^{cx}=n, b^{cx+d}=n
 * Usage: npx tsx scripts/seed-exponential.ts
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

interface EQ {
  expression: string
  correctAnswer: string
  subtype: string
}

function generateAll(): EQ[] {
  const all: EQ[] = []
  const seen = new Set<string>()

  const bases = [2, 3, 4, 5, 6, 7, 8, 9, 10]

  for (const b of bases) {
    // หา exponent สูงสุดที่ b^e ≤ 1000
    let maxExp = 1
    while (Math.pow(b, maxExp + 1) <= 1000) maxExp++

    // === subtype 0: b^x = n (simple) ===
    for (let e = 1; e <= maxExp; e++) {
      const result = Math.pow(b, e)
      const expr = `$${b}^{x} = ${result}$`
      if (!seen.has(expr)) {
        seen.add(expr)
        all.push({ expression: expr, correctAnswer: e.toString(), subtype: 'simple' })
      }
    }

    // === subtype 1: b^{x+c} = n ===
    for (const c of [1, 2, 3]) {
      for (let e = c + 1; e <= maxExp; e++) {
        const result = Math.pow(b, e)
        const x = e - c
        if (x < 0) continue
        const expr = `$${b}^{x+${c}} = ${result}$`
        if (!seen.has(expr)) {
          seen.add(expr)
          all.push({ expression: expr, correctAnswer: x.toString(), subtype: 'x_plus_c' })
        }
      }
    }

    // === subtype 2: b^{x-c} = n ===
    for (const c of [1, 2, 3]) {
      for (let e = 1; e <= maxExp; e++) {
        const result = Math.pow(b, e)
        const x = e + c
        const expr = `$${b}^{x-${c}} = ${result}$`
        if (!seen.has(expr)) {
          seen.add(expr)
          all.push({ expression: expr, correctAnswer: x.toString(), subtype: 'x_minus_c' })
        }
      }
    }

    // === subtype 3: b^{cx} = n ===
    for (const c of [2, 3]) {
      for (let x = 1; x * c <= maxExp; x++) {
        const e = c * x
        const result = Math.pow(b, e)
        const expr = `$${b}^{${c}x} = ${result}$`
        if (!seen.has(expr)) {
          seen.add(expr)
          all.push({ expression: expr, correctAnswer: x.toString(), subtype: 'cx' })
        }
      }
    }

    // === subtype 4: b^{cx+d} = n ===
    for (const c of [2, 3]) {
      for (const d of [1, 2]) {
        for (let x = 1; c * x + d <= maxExp; x++) {
          const e = c * x + d
          const result = Math.pow(b, e)
          const expr = `$${b}^{${c}x+${d}} = ${result}$`
          if (!seen.has(expr)) {
            seen.add(expr)
            all.push({ expression: expr, correctAnswer: x.toString(), subtype: 'cx_plus_d' })
          }
        }
      }
    }
  }

  return all
}

async function seed() {
  // ลบข้อเก่าก่อน
  const { error: delErr } = await supabase.from('questions').delete().eq('topic', 'exponential')
  if (delErr) { console.error('Delete error:', delErr.message); process.exit(1) }
  console.log('ลบข้อเก่าแล้ว')

  const allQuestions = generateAll()

  // ลบ expression ซ้ำ (safety)
  const seen = new Set<string>()
  const unique = allQuestions.filter(q => {
    if (seen.has(q.expression)) return false
    seen.add(q.expression)
    return true
  })

  console.log(`Pool ทั้งหมด: ${unique.length} ข้อ`)

  // นับจำนวนแต่ละ subtype
  const subtypeCounts: Record<string, number> = {}
  for (const q of unique) {
    subtypeCounts[q.subtype] = (subtypeCounts[q.subtype] || 0) + 1
  }
  console.log('จำนวนแต่ละรูปแบบ:', subtypeCounts)

  // กระจายให้ครบทุก subtype (20 ข้อต่อ subtype)
  const bySubtype: Record<string, EQ[]> = {}
  for (const q of unique) {
    if (!bySubtype[q.subtype]) bySubtype[q.subtype] = []
    bySubtype[q.subtype].push(q)
  }

  const selected: EQ[] = []
  const subtypes = Object.keys(bySubtype)
  const perSubtype = Math.floor(100 / subtypes.length)
  const remainder = 100 - perSubtype * subtypes.length

  for (let i = 0; i < subtypes.length; i++) {
    const st = subtypes[i]
    const count = perSubtype + (i < remainder ? 1 : 0)
    const shuffled = shuffleArray(bySubtype[st])
    selected.push(...shuffled.slice(0, count))
  }

  // เติมให้ครบ 100 ถ้ายังไม่พอ
  if (selected.length < 100) {
    const extra = shuffleArray(unique.filter(q => !selected.includes(q)))
    selected.push(...extra.slice(0, 100 - selected.length))
  }

  const rows = selected.map(q => ({
    topic: 'exponential',
    difficulty: 'easy' as const,
    question_latex: q.expression,
    correct_answer_latex: q.correctAnswer,
    choices: [], // ไม่มี choices → เติมคำตอบ
  }))

  console.log(`\nกำลัง insert ${rows.length} ข้อ...`)
  console.log(`ตัวอย่าง:`)
  for (let i = 0; i < Math.min(15, rows.length); i++) {
    console.log(`  ${rows[i].question_latex} → x = ${rows[i].correct_answer_latex}`)
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

  console.log(`\nเสร็จ! เพิ่มโจทย์สมการเลขชี้กำลัง (ง่าย) ${rows.length} ข้อเรียบร้อย`)
}

seed()
