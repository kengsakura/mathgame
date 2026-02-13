/**
 * Seed script: สร้างโจทย์บวกลบจำนวนเต็ม (ง่าย) 200 ข้อ ไม่ซ้ำ
 * - บวก/ลบ 2-3 ตัว เลขไม่เกิน 100 (ค่าสัมบูรณ์)
 * - รวมจำนวนเต็มลบด้วย
 * Usage: npx tsx scripts/seed-integer-add-sub.ts
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

interface IQ {
  expression: string
  correctAnswer: number
}

function formatNum(n: number, isFirst: boolean): string {
  if (isFirst) {
    return n < 0 ? `(${n})` : `${n}`
  }
  if (n < 0) {
    // สลับรูปแบบให้หลากหลาย
    return `- ${Math.abs(n)}`
  }
  return `+ ${n}`
}

function makeDistractors(correct: number): string[] {
  const set = new Set<string>()
  const candidates = [
    correct + 1, correct - 1,
    correct + 2, correct - 2,
    correct + 5, correct - 5,
    correct + 10, correct - 10,
    -correct,
    correct * 2,
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

function generateAll(): IQ[] {
  const all: IQ[] = []
  const seen = new Set<string>()

  // === กลุ่ม 1: บวก 2 ตัว (บวก+บวก) ===
  for (let a = 1; a <= 100; a += 3) {
    for (let b = 1; b <= 100; b += 7) {
      if (a === b) continue
      const expr = `${a} + ${b}`
      if (!seen.has(expr)) {
        seen.add(expr)
        all.push({ expression: `${expr} = ?`, correctAnswer: a + b })
      }
    }
  }

  // === กลุ่ม 2: ลบ 2 ตัว (บวก-บวก) ===
  for (let a = 10; a <= 100; a += 5) {
    for (let b = 1; b <= 99; b += 7) {
      if (a === b) continue
      const expr = `${a} - ${b}`
      if (!seen.has(expr)) {
        seen.add(expr)
        all.push({ expression: `${expr} = ?`, correctAnswer: a - b })
      }
    }
  }

  // === กลุ่ม 3: บวกลบจำนวนลบ 2 ตัว ===
  // (-a) + b
  for (let a = 1; a <= 50; a += 3) {
    for (let b = 1; b <= 50; b += 5) {
      const expr = `(${-a}) + ${b}`
      if (!seen.has(expr)) {
        seen.add(expr)
        all.push({ expression: `${expr} = ?`, correctAnswer: -a + b })
      }
    }
  }

  // a + (-b)  → แสดงเป็น a - b (ซ้ำกับกลุ่ม 2) หรือ a + (-b)
  for (let a = 1; a <= 50; a += 5) {
    for (let b = 1; b <= 50; b += 7) {
      if (a === b) continue
      const expr = `${a} + (${-b})`
      if (!seen.has(expr)) {
        seen.add(expr)
        all.push({ expression: `${expr} = ?`, correctAnswer: a - b })
      }
    }
  }

  // (-a) + (-b)
  for (let a = 1; a <= 50; a += 5) {
    for (let b = 1; b <= 50; b += 7) {
      const expr = `(${-a}) + (${-b})`
      if (!seen.has(expr)) {
        seen.add(expr)
        all.push({ expression: `${expr} = ?`, correctAnswer: -a - b })
      }
    }
  }

  // (-a) - b
  for (let a = 1; a <= 50; a += 7) {
    for (let b = 1; b <= 50; b += 5) {
      const expr = `(${-a}) - ${b}`
      if (!seen.has(expr)) {
        seen.add(expr)
        all.push({ expression: `${expr} = ?`, correctAnswer: -a - b })
      }
    }
  }

  // a - (-b) = a + b
  for (let a = 1; a <= 50; a += 7) {
    for (let b = 1; b <= 50; b += 5) {
      const expr = `${a} - (${-b})`
      if (!seen.has(expr)) {
        seen.add(expr)
        all.push({ expression: `${expr} = ?`, correctAnswer: a + b })
      }
    }
  }

  // (-a) - (-b) = -a + b
  for (let a = 1; a <= 50; a += 7) {
    for (let b = 1; b <= 50; b += 5) {
      const expr = `(${-a}) - (${-b})`
      if (!seen.has(expr)) {
        seen.add(expr)
        all.push({ expression: `${expr} = ?`, correctAnswer: -a + b })
      }
    }
  }

  // === กลุ่ม 4: บวกลบ 3 ตัว ===
  // a + b + c
  for (let a = 1; a <= 30; a += 5) {
    for (let b = 1; b <= 30; b += 7) {
      for (let c = 1; c <= 30; c += 9) {
        const expr = `${a} + ${b} + ${c}`
        if (!seen.has(expr)) {
          seen.add(expr)
          all.push({ expression: `${expr} = ?`, correctAnswer: a + b + c })
        }
      }
    }
  }

  // a + b - c
  for (let a = 10; a <= 50; a += 7) {
    for (let b = 5; b <= 40; b += 9) {
      for (let c = 1; c <= 30; c += 5) {
        const expr = `${a} + ${b} - ${c}`
        if (!seen.has(expr)) {
          seen.add(expr)
          all.push({ expression: `${expr} = ?`, correctAnswer: a + b - c })
        }
      }
    }
  }

  // a - b + c
  for (let a = 20; a <= 60; a += 7) {
    for (let b = 5; b <= 30; b += 5) {
      for (let c = 1; c <= 30; c += 9) {
        const expr = `${a} - ${b} + ${c}`
        if (!seen.has(expr)) {
          seen.add(expr)
          all.push({ expression: `${expr} = ?`, correctAnswer: a - b + c })
        }
      }
    }
  }

  // a - b - c
  for (let a = 30; a <= 80; a += 11) {
    for (let b = 5; b <= 30; b += 7) {
      for (let c = 1; c <= 20; c += 5) {
        const expr = `${a} - ${b} - ${c}`
        if (!seen.has(expr)) {
          seen.add(expr)
          all.push({ expression: `${expr} = ?`, correctAnswer: a - b - c })
        }
      }
    }
  }

  // (-a) + b + c
  for (let a = 5; a <= 30; a += 5) {
    for (let b = 10; b <= 40; b += 7) {
      for (let c = 5; c <= 30; c += 9) {
        const expr = `(${-a}) + ${b} + ${c}`
        if (!seen.has(expr)) {
          seen.add(expr)
          all.push({ expression: `${expr} = ?`, correctAnswer: -a + b + c })
        }
      }
    }
  }

  // (-a) + b - c
  for (let a = 5; a <= 30; a += 7) {
    for (let b = 15; b <= 50; b += 9) {
      for (let c = 3; c <= 20; c += 5) {
        const expr = `(${-a}) + ${b} - ${c}`
        if (!seen.has(expr)) {
          seen.add(expr)
          all.push({ expression: `${expr} = ?`, correctAnswer: -a + b - c })
        }
      }
    }
  }

  // (-a) - b + c
  for (let a = 5; a <= 25; a += 5) {
    for (let b = 5; b <= 25; b += 7) {
      for (let c = 10; c <= 50; c += 9) {
        const expr = `(${-a}) - ${b} + ${c}`
        if (!seen.has(expr)) {
          seen.add(expr)
          all.push({ expression: `${expr} = ?`, correctAnswer: -a - b + c })
        }
      }
    }
  }

  // a + (-b) + c
  for (let a = 10; a <= 50; a += 9) {
    for (let b = 5; b <= 30; b += 7) {
      for (let c = 3; c <= 25; c += 5) {
        const expr = `${a} + (${-b}) + ${c}`
        if (!seen.has(expr)) {
          seen.add(expr)
          all.push({ expression: `${expr} = ?`, correctAnswer: a - b + c })
        }
      }
    }
  }

  return all
}

async function seed() {
  const allQuestions = generateAll()

  console.log(`Pool ทั้งหมด: ${allQuestions.length} ข้อ`)

  // สุ่มเลือก 200 ข้อ
  const selected = shuffleArray(allQuestions).slice(0, 200)

  const rows = selected.map(q => {
    const distractors = makeDistractors(q.correctAnswer)
    const choices = shuffleArray([q.correctAnswer.toString(), ...distractors])

    return {
      topic: 'integer_add_sub',
      difficulty: 'easy' as const,
      question_latex: q.expression,
      correct_answer_latex: q.correctAnswer.toString(),
      choices,
    }
  })

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

  console.log(`\nเสร็จ! เพิ่มโจทย์บวกลบจำนวนเต็ม (ง่าย) ${rows.length} ข้อเรียบร้อย`)
}

seed()
