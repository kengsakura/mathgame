/**
 * Seed script: สร้างโจทย์ลำดับเรขาคณิต (ง่าย) 100 ข้อ แบบ systematic ไม่ซ้ำ
 * 5 รูปแบบ: หา aₙ, หา r, หาพจน์ถัดไป, หา a₁, หา n
 * Usage: npx tsx scripts/seed-geometric-sequence.ts
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

interface GQ {
  expression: string
  correctAnswer: string
  subtype: string
}

function makeDistractors(correct: string, candidates: string[]): string[] {
  const set = new Set<string>()
  for (const c of candidates) {
    if (c !== correct && c !== '0' && c !== 'NaN' && c !== 'Infinity' && set.size < 3) {
      set.add(c)
    }
  }
  // fallback: สุ่มเลขใกล้เคียง
  const num = parseInt(correct)
  while (set.size < 3) {
    const r = (num + Math.floor(Math.random() * 10) - 5)
    if (r.toString() !== correct && r > 0) set.add(r.toString())
  }
  return Array.from(set)
}

function generateAll(): GQ[] {
  const all: GQ[] = []

  // พารามิเตอร์สำหรับ easy
  const a1Values = [1, 2, 3, 4, 5]
  const rValues = [2, 3, 4, 5]
  const nValues = [3, 4, 5, 6]

  for (const a1 of a1Values) {
    for (const r of rValues) {
      for (const n of nValues) {
        const an = a1 * Math.pow(r, n - 1)
        if (!Number.isInteger(an) || an > 10000) continue

        // === subtype 0: หา aₙ ===
        all.push({
          expression: `ลำดับเรขาคณิต: $a_1 = ${a1}$, $r = ${r}$. หา $a_{${n}}$`,
          correctAnswer: an.toString(),
          subtype: 'find_an',
        })

        // === subtype 1: หา r จากลำดับ ===
        const seq4 = [a1, a1 * r, a1 * r * r, a1 * r * r * r]
        all.push({
          expression: `ลำดับเรขาคณิต $${seq4.join(', ')}, ...$ หา $r$`,
          correctAnswer: r.toString(),
          subtype: 'find_r',
        })

        // === subtype 2: หาพจน์ถัดไป ===
        // แสดง 3 พจน์
        const seq3 = [a1, a1 * r, a1 * r * r]
        const next3 = a1 * r * r * r
        if (Number.isInteger(next3) && next3 <= 10000) {
          all.push({
            expression: `ลำดับเรขาคณิต $${seq3.join(', ')}, ...$ พจน์ถัดไปคือข้อใด`,
            correctAnswer: next3.toString(),
            subtype: 'find_next',
          })
        }

        // === subtype 3: หา a₁ ===
        all.push({
          expression: `ลำดับเรขาคณิต: $a_{${n}} = ${an}$, $r = ${r}$. หา $a_1$`,
          correctAnswer: a1.toString(),
          subtype: 'find_a1',
        })

        // === subtype 4: หา n ===
        all.push({
          expression: `ลำดับเรขาคณิต: $a_1 = ${a1}$, $r = ${r}$, $a_n = ${an}$. หา $n$`,
          correctAnswer: n.toString(),
          subtype: 'find_n',
        })
      }
    }
  }

  return all
}

function getDistractorsForQuestion(q: GQ, a1: number, r: number, n: number, an: number): string[] {
  const correct = q.correctAnswer
  let candidates: string[]

  switch (q.subtype) {
    case 'find_an':
      candidates = [
        (a1 * Math.pow(r, n)).toString(),
        (a1 * Math.pow(r, n - 2)).toString(),
        (a1 + Math.pow(r, n - 1)).toString(),
        (an * r).toString(),
        Math.round(an / r).toString(),
        (an + r).toString(),
      ]
      break
    case 'find_r':
      candidates = [
        (r + 1).toString(), (r - 1).toString(), (r * 2).toString(),
        (r + 2).toString(), (a1).toString(), (-r).toString(),
      ]
      break
    case 'find_next':
      const nextVal = parseInt(correct)
      candidates = [
        (nextVal * r).toString(), Math.round(nextVal / r).toString(),
        (nextVal + r).toString(), (nextVal - r).toString(),
        (nextVal * 2).toString(), (nextVal + 1).toString(),
      ]
      break
    case 'find_a1':
      candidates = [
        (a1 * r).toString(), (a1 + 1).toString(), (a1 - 1).toString(),
        (a1 * 2).toString(), Math.round(an / Math.pow(r, n)).toString(),
        (a1 + r).toString(),
      ]
      break
    case 'find_n':
      candidates = [
        (n + 1).toString(), (n - 1).toString(), (n + 2).toString(),
        (n - 2).toString(), (n * 2).toString(), (n + 3).toString(),
      ]
      break
    default:
      candidates = []
  }

  return makeDistractors(correct, candidates.filter(c => Number.isInteger(parseFloat(c)) && parseFloat(c) > 0))
}

async function seed() {
  const allQuestions = generateAll()

  // ลบ expression ซ้ำ
  const seen = new Set<string>()
  const unique = allQuestions.filter(q => {
    if (seen.has(q.expression)) return false
    seen.add(q.expression)
    return true
  })

  console.log(`Pool ทั้งหมด: ${unique.length} ข้อ (ไม่ซ้ำ)`)

  // นับจำนวนแต่ละ subtype
  const subtypeCounts: Record<string, number> = {}
  for (const q of unique) {
    subtypeCounts[q.subtype] = (subtypeCounts[q.subtype] || 0) + 1
  }
  console.log('จำนวนแต่ละรูปแบบ:', subtypeCounts)

  // สุ่มเลือก 100 ข้อ โดยกระจายให้ครบทุก subtype (20 ข้อต่อ subtype)
  const bySubtype: Record<string, GQ[]> = {}
  for (const q of unique) {
    if (!bySubtype[q.subtype]) bySubtype[q.subtype] = []
    bySubtype[q.subtype].push(q)
  }

  const selected: GQ[] = []
  const subtypes = Object.keys(bySubtype)
  const perSubtype = Math.floor(100 / subtypes.length)
  const remainder = 100 - perSubtype * subtypes.length

  for (let i = 0; i < subtypes.length; i++) {
    const st = subtypes[i]
    const count = perSubtype + (i < remainder ? 1 : 0)
    const shuffled = shuffleArray(bySubtype[st])
    selected.push(...shuffled.slice(0, count))
  }

  // Parse a1, r, n จาก expression สำหรับทำ distractors
  const rows = selected.map(q => {
    // parse ค่าจาก expression
    let a1 = 1, r = 2, n = 3, an = 0
    const a1Match = q.expression.match(/a_1 = (\d+)/)
    const rMatch = q.expression.match(/r = (\d+)/)
    const nMatch = q.expression.match(/a_\{(\d+)\}/) || q.expression.match(/หา \$a_\{(\d+)\}/)
    const anMatch = q.expression.match(/a_\{\d+\} = (\d+)/)
    const seqMatch = q.expression.match(/\$([0-9, ]+),/)

    if (a1Match) a1 = parseInt(a1Match[1])
    if (rMatch) r = parseInt(rMatch[1])
    if (nMatch) n = parseInt(nMatch[1])
    if (anMatch) an = parseInt(anMatch[1])

    // คำนวณ an ถ้าไม่ได้ parse ได้
    if (!an && a1 && r && n) an = a1 * Math.pow(r, n - 1)

    // ถ้าเป็น find_r หรือ find_next ลองหา r จาก seq
    if (seqMatch) {
      const nums = seqMatch[1].split(', ').map(Number)
      if (nums.length >= 2 && nums[0] !== 0) {
        r = nums[1] / nums[0]
        a1 = nums[0]
      }
    }

    const distractors = getDistractorsForQuestion(q, a1, r, n, an)
    const choices = shuffleArray([q.correctAnswer, ...distractors])

    return {
      topic: 'geometric_sequence',
      difficulty: 'easy' as const,
      question_latex: q.expression,
      correct_answer_latex: q.correctAnswer,
      choices,
    }
  })

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

  console.log(`\nเสร็จ! เพิ่มโจทย์ลำดับเรขาคณิต (ง่าย) ${rows.length} ข้อเรียบร้อย`)
}

seed()
