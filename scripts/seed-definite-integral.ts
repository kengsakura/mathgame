/**
 * Seed: ปริพันธ์จำกัดเขต (ง่าย) 200 ข้อ คำตอบเป็นจำนวนเต็มเสมอ
 * - ตอบแบบเติมคำตอบ (keypad, ไม่มี choices)
 * - หลายรูปแบบ: constant, x, x², x³, linear, quadratic
 * Usage: npx tsx scripts/seed-definite-integral.ts
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

interface DQ { expression: string; answer: number; type: string }

function collect(): DQ[] {
  const all: DQ[] = []
  const seen = new Set<string>()

  function add(expr: string, answer: number, type: string) {
    if (!seen.has(expr) && Number.isInteger(answer) && answer >= 0 && answer <= 500) {
      seen.add(expr)
      all.push({ expression: expr, answer, type })
    }
  }

  // ===== Type 1: ∫_a^b c dx = c(b-a), c=2..10 =====
  for (let c = 2; c <= 10; c++) {
    for (let a = 0; a <= 7; a++) {
      for (let b = a + 1; b <= 8; b++) {
        const ans = c * (b - a)
        add(`$\\int_{${a}}^{${b}} ${c}\\,dx$`, ans, 'const')
      }
    }
  }

  // ===== Type 2: ∫_a^b 2x dx = b²-a², เสมอจำนวนเต็ม =====
  for (let a = 0; a <= 7; a++) {
    for (let b = a + 1; b <= 8; b++) {
      add(`$\\int_{${a}}^{${b}} 2x\\,dx$`, b * b - a * a, 'linear_2x')
    }
  }

  // ===== Type 3: ∫_a^b x dx = (b²-a²)/2, same parity =====
  for (let a = 0; a <= 7; a++) {
    for (let b = a + 1; b <= 9; b++) {
      if ((a % 2) === (b % 2)) {
        add(`$\\int_{${a}}^{${b}} x\\,dx$`, (b * b - a * a) / 2, 'linear_x')
      }
    }
  }

  // ===== Type 4: ∫_a^b 3x² dx = b³-a³ =====
  for (let a = 0; a <= 5; a++) {
    for (let b = a + 1; b <= 6; b++) {
      add(`$\\int_{${a}}^{${b}} 3x^2\\,dx$`, b ** 3 - a ** 3, 'quad_3x2')
    }
  }

  // ===== Type 5: ∫_a^b x² dx = (b³-a³)/3, when b≡a (mod 3) =====
  for (let a = 0; a <= 6; a++) {
    for (let b = a + 1; b <= 9; b++) {
      if ((b - a) % 3 === 0) {
        add(`$\\int_{${a}}^{${b}} x^2\\,dx$`, (b ** 3 - a ** 3) / 3, 'quad_x2')
      }
    }
  }

  // ===== Type 6: ∫_a^b 4x³ dx = b⁴-a⁴ =====
  for (let a = 0; a <= 3; a++) {
    for (let b = a + 1; b <= 4; b++) {
      add(`$\\int_{${a}}^{${b}} 4x^3\\,dx$`, b ** 4 - a ** 4, 'cubic_4x3')
    }
  }

  // ===== Type 7: ∫_a^b (x+k) dx = (b²-a²)/2 + k(b-a), same parity =====
  for (let k = 1; k <= 5; k++) {
    for (let a = 0; a <= 5; a++) {
      for (let b = a + 1; b <= 7; b++) {
        if ((a % 2) === (b % 2)) {
          const ans = (b * b - a * a) / 2 + k * (b - a)
          add(`$\\int_{${a}}^{${b}} (x+${k})\\,dx$`, ans, 'linear_xpk')
        }
      }
    }
  }

  // ===== Type 8: ∫_a^b (2x+k) dx = b²-a² + k(b-a), เสมอจำนวนเต็ม =====
  for (let k = 1; k <= 6; k++) {
    for (let a = 0; a <= 5; a++) {
      for (let b = a + 1; b <= 7; b++) {
        const ans = (b * b - a * a) + k * (b - a)
        add(`$\\int_{${a}}^{${b}} (2x+${k})\\,dx$`, ans, 'linear_2xpk')
      }
    }
  }

  // ===== Type 9: ∫_a^b (3x²+k) dx = b³-a³ + k(b-a) =====
  for (let k = 1; k <= 5; k++) {
    for (let a = 0; a <= 4; a++) {
      for (let b = a + 1; b <= 5; b++) {
        const ans = b ** 3 - a ** 3 + k * (b - a)
        add(`$\\int_{${a}}^{${b}} (3x^2+${k})\\,dx$`, ans, 'quad_3x2pk')
      }
    }
  }

  // ===== Type 10: ∫_a^b (x²+k) dx = (b³-a³)/3 + k(b-a), b≡a(mod 3) =====
  for (let k = 1; k <= 5; k++) {
    for (let a = 0; a <= 5; a++) {
      for (let b = a + 1; b <= 9; b++) {
        if ((b - a) % 3 === 0) {
          const ans = (b ** 3 - a ** 3) / 3 + k * (b - a)
          add(`$\\int_{${a}}^{${b}} (x^2+${k})\\,dx$`, ans, 'quad_x2pk')
        }
      }
    }
  }

  // ===== Type 11: ∫_0^b cx dx = cb²/2, b even or c even =====
  for (let c = 1; c <= 8; c++) {
    for (let b = 1; b <= 8; b++) {
      if ((c * b * b) % 2 === 0) {
        const ans = c * b * b / 2
        add(`$\\int_{0}^{${b}} ${c === 1 ? '' : c}x\\,dx$`, ans, 'linear_cx')
      }
    }
  }

  // ===== Type 12: ∫_1^b x dx, b odd (b²-1 even) =====
  for (let b = 3; b <= 9; b += 2) {
    add(`$\\int_{1}^{${b}} x\\,dx$`, (b * b - 1) / 2, 'linear_x_from1')
  }

  return all
}

async function seed() {
  const { error: delErr } = await supabase.from('questions').delete().eq('topic', 'definite_integral')
  if (delErr) { console.error('Delete error:', delErr.message); process.exit(1) }
  console.log('ลบข้อเก่าแล้ว')

  const allQuestions = collect()
  console.log(`Pool ทั้งหมด: ${allQuestions.length} ข้อ`)

  // นับแต่ละประเภท
  const typeCounts: Record<string, number> = {}
  for (const q of allQuestions) typeCounts[q.type] = (typeCounts[q.type] || 0) + 1
  console.log('จำนวนแต่ละประเภท:', typeCounts)

  // กระจายทุก type ก่อน แล้วเติมให้ครบ 200
  const byType: Record<string, DQ[]> = {}
  for (const q of allQuestions) {
    if (!byType[q.type]) byType[q.type] = []
    byType[q.type].push(q)
  }

  const selected: DQ[] = []
  const types = Object.keys(byType)
  const perType = Math.floor(200 / types.length)

  for (const t of types) {
    selected.push(...shuffleArray(byType[t]).slice(0, perType))
  }

  // เติมให้ครบ 200
  const extra = shuffleArray(allQuestions.filter(q => !selected.includes(q)))
  selected.push(...extra.slice(0, 200 - selected.length))
  const final200 = shuffleArray(selected).slice(0, 200)

  console.log(`\nกำลัง insert ${final200.length} ข้อ...`)
  console.log(`ตัวอย่าง:`)
  for (let i = 0; i < Math.min(12, final200.length); i++) {
    console.log(`  ${final200[i].expression} → ${final200[i].answer}`)
  }

  const rows = final200.map(q => ({
    topic: 'definite_integral',
    difficulty: 'easy' as const,
    question_latex: q.expression,
    correct_answer_latex: q.answer.toString(),
    choices: [],
  }))

  for (let i = 0; i < rows.length; i += 25) {
    const batch = rows.slice(i, i + 25)
    const { error } = await supabase.from('questions').insert(batch)
    if (error) { console.error(`batch ${i / 25 + 1} error:`, error.message); process.exit(1) }
    console.log(`  batch ${i / 25 + 1}: insert ${batch.length} ข้อ OK`)
  }

  console.log(`\nเสร็จ! เพิ่มโจทย์ปริพันธ์จำกัดเขต (ง่าย) ${rows.length} ข้อเรียบร้อย`)
}

seed()
