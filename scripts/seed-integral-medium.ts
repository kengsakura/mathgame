/**
 * Seed script: สร้างโจทย์ปริพันธ์ระดับกลาง 100 ข้อ ไม่ซ้ำ
 * - มียกกำลังติดลบ (x^{-2}, x^{-3})
 * - มียกกำลังเศษส่วน (x^{1/2}, x^{3/2})
 * - ฟังก์ชัน 1-2 พจน์
 * Usage: npx tsx scripts/seed-integral-medium.ts
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

function gcd(a: number, b: number): number {
  a = Math.abs(a); b = Math.abs(b)
  while (b) { [a, b] = [b, a % b] }
  return a
}

// เศษส่วน
interface Frac { n: number; d: number }

function simplify(f: Frac): Frac {
  if (f.n === 0) return { n: 0, d: 1 }
  const g = gcd(Math.abs(f.n), Math.abs(f.d))
  let n = f.n / g, d = f.d / g
  if (d < 0) { n = -n; d = -d }
  return { n, d }
}

function fracAdd(a: Frac, b: Frac): Frac {
  return simplify({ n: a.n * b.d + b.n * a.d, d: a.d * b.d })
}

function fracDiv(a: Frac, b: Frac): Frac {
  return simplify({ n: a.n * b.d, d: a.d * b.n })
}

// format เลขยกกำลังเป็น LaTeX
function formatExp(f: Frac): string {
  const s = simplify(f)
  if (s.d === 1) return `${s.n}`
  return `\\frac{${s.n}}{${s.d}}`
}

interface Term { coeff: number; exp: Frac }

// format พจน์ใน integrand: cx^{p}
function formatTerm(t: Term, isFirst: boolean): string {
  if (t.coeff === 0) return ''
  const e = simplify(t.exp)
  let str = ''

  if (!isFirst) {
    str += t.coeff > 0 ? ' + ' : ' - '
  } else if (t.coeff < 0) {
    str += '-'
  }

  const absC = Math.abs(t.coeff)
  // ถ้า exp=0 → เป็นค่าคงที่
  if (e.n === 0) {
    str += absC
    return str
  }

  if (absC !== 1) str += absC
  str += 'x'
  // แสดง exponent ถ้าไม่ใช่ 1
  if (!(e.n === 1 && e.d === 1)) {
    str += `^{${formatExp(e)}}`
  }
  return str
}

// format พจน์ผลลัพธ์ปริพันธ์ (สัมประสิทธิ์อาจเป็นเศษส่วน)
function formatResultTerm(coeffNum: number, coeffDen: number, exp: Frac, isFirst: boolean): string {
  const g = gcd(Math.abs(coeffNum), Math.abs(coeffDen))
  let cn = coeffNum / g, cd = coeffDen / g
  if (cd < 0) { cn = -cn; cd = -cd }

  const e = simplify(exp)
  let str = ''

  if (!isFirst) {
    str += cn > 0 ? ' + ' : ' - '
  } else if (cn < 0) {
    str += '-'
  }

  const absN = Math.abs(cn)

  if (e.n === 0) {
    // ค่าคงที่
    if (cd === 1) str += absN
    else str += `\\frac{${absN}}{${cd}}`
    return str
  }

  if (cd === 1) {
    if (absN !== 1) str += absN
  } else {
    str += `\\frac{${absN}}{${cd}}`
  }

  str += 'x'
  if (!(e.n === 1 && e.d === 1)) {
    str += `^{${formatExp(e)}}`
  }
  return str
}

interface IQ {
  questionLatex: string
  answerLatex: string
  category: string
}

function computeIntegral(terms: Term[]): { resultTerms: { cn: number; cd: number; exp: Frac }[]; ansStr: string } {
  const resultTerms = terms.map(t => {
    // ∫ cx^{p/q} dx = c / (p/q + 1) · x^{p/q + 1} + C
    //              = c·q / (p + q) · x^{(p+q)/q} + C
    const e = simplify(t.exp)
    const newExpFrac = simplify({ n: e.n + e.d, d: e.d })
    const cn = t.coeff * e.d
    const cd = e.n + e.d
    return { cn, cd, exp: newExpFrac }
  })

  let ansStr = ''
  resultTerms.forEach((rt, i) => {
    ansStr += formatResultTerm(rt.cn, rt.cd, rt.exp, i === 0)
  })
  ansStr += ' + C'
  return { resultTerms, ansStr }
}

function generateAll(): IQ[] {
  const all: IQ[] = []

  // ===== กลุ่ม 1: กำลังติดลบ 1 พจน์ =====
  const negExps: Frac[] = [
    { n: -2, d: 1 }, { n: -3, d: 1 }, { n: -4, d: 1 },
  ]
  const negCoeffs = [1, 2, 3, 4, 5, 6, -1, -2, -3, -4, -5, -6]

  for (const exp of negExps) {
    for (const c of negCoeffs) {
      const terms: Term[] = [{ coeff: c, exp }]
      const integrandStr = formatTerm(terms[0], true)
      const { ansStr } = computeIntegral(terms)

      all.push({
        questionLatex: `จงหาปริพันธ์ $\\int ${integrandStr}\\,dx$`,
        answerLatex: `$${ansStr}$`,
        category: 'neg_1term',
      })
    }
  }

  // ===== กลุ่ม 2: กำลังเศษส่วน 1 พจน์ =====
  const fracExps: Frac[] = [
    { n: 1, d: 2 }, { n: -1, d: 2 }, { n: 1, d: 3 },
    { n: 3, d: 2 }, { n: 2, d: 3 }, { n: 3, d: 4 },
  ]
  // เลือก c ที่ให้ผลลัพธ์สวย
  const fracCoeffMap: Record<string, number[]> = {
    '1/2': [3, 6, 9, -3, -6],     // result = 2c/3
    '-1/2': [1, 2, 3, 4, -1, -2], // result = 2c/1 = 2c
    '1/3': [4, 8, -4, -8],        // result = 3c/4
    '3/2': [5, 10, -5],           // result = 2c/5
    '2/3': [5, 10, -5],           // result = 3c/5
    '3/4': [7, -7, 14],           // result = 4c/7
  }

  for (const exp of fracExps) {
    const key = `${exp.n}/${exp.d}`
    const coeffs = fracCoeffMap[key] || [1, 2, 3, -1, -2, -3]
    for (const c of coeffs) {
      const terms: Term[] = [{ coeff: c, exp }]
      const integrandStr = formatTerm(terms[0], true)
      const { ansStr } = computeIntegral(terms)

      all.push({
        questionLatex: `จงหาปริพันธ์ $\\int ${integrandStr}\\,dx$`,
        answerLatex: `$${ansStr}$`,
        category: 'frac_1term',
      })
    }
  }

  // ===== กลุ่ม 3: กำลังติดลบ + ค่าคงที่ (2 พจน์) =====
  const constants = [1, 2, 3, 4, 5, -1, -2, -3]
  for (const exp of negExps) {
    for (const c of [1, 2, 3, -1, -2, -3]) {
      for (const d of [1, 2, 3, -1, -2]) {
        const terms: Term[] = [
          { coeff: c, exp },
          { coeff: d, exp: { n: 0, d: 1 } },
        ]
        const integrandStr = terms.map((t, i) => formatTerm(t, i === 0)).join('')
        const { ansStr } = computeIntegral(terms)

        all.push({
          questionLatex: `จงหาปริพันธ์ $\\int (${integrandStr})\\,dx$`,
          answerLatex: `$${ansStr}$`,
          category: 'neg_const',
        })
      }
    }
  }

  // ===== กลุ่ม 4: กำลังเศษส่วน + ค่าคงที่ (2 พจน์) =====
  for (const exp of [{ n: 1, d: 2 }, { n: -1, d: 2 }, { n: 1, d: 3 }]) {
    const key = `${exp.n}/${exp.d}`
    const coeffs = fracCoeffMap[key] || [1, 2, 3, -1, -2]
    for (const c of coeffs.slice(0, 3)) {
      for (const d of [1, 2, 3, -1, -2]) {
        const terms: Term[] = [
          { coeff: c, exp },
          { coeff: d, exp: { n: 0, d: 1 } },
        ]
        const integrandStr = terms.map((t, i) => formatTerm(t, i === 0)).join('')
        const { ansStr } = computeIntegral(terms)

        all.push({
          questionLatex: `จงหาปริพันธ์ $\\int (${integrandStr})\\,dx$`,
          answerLatex: `$${ansStr}$`,
          category: 'frac_const',
        })
      }
    }
  }

  // ===== กลุ่ม 5: กำลังติดลบ + พจน์ x^n (2 พจน์) =====
  for (const negExp of [{ n: -2, d: 1 }, { n: -3, d: 1 }]) {
    for (const c1 of [1, 2, 3, -1, -2]) {
      for (const posExp of [{ n: 1, d: 1 }, { n: 2, d: 1 }]) {
        // c2 เลือกให้ผลลัพธ์สวย
        const p = posExp.n
        const c2vals = [p + 1, 2 * (p + 1), -(p + 1)]
        for (const c2 of c2vals.slice(0, 2)) {
          const terms: Term[] = [
            { coeff: c1, exp: negExp },
            { coeff: c2, exp: posExp },
          ]
          const integrandStr = terms.map((t, i) => formatTerm(t, i === 0)).join('')
          const { ansStr } = computeIntegral(terms)

          all.push({
            questionLatex: `จงหาปริพันธ์ $\\int (${integrandStr})\\,dx$`,
            answerLatex: `$${ansStr}$`,
            category: 'neg_pos',
          })
        }
      }
    }
  }

  return all
}

function makeDistractors(ansStr: string, terms: Term[]): string[] {
  const distractors = new Set<string>()

  // Type 1: ลืมเพิ่มกำลัง
  {
    const result = terms.map(t => {
      const e = simplify(t.exp)
      const cd = e.n + e.d
      return { cn: t.coeff * e.d, cd, exp: t.exp } // exp ไม่เพิ่ม
    })
    let s = ''
    result.forEach((rt, i) => { s += formatResultTerm(rt.cn, rt.cd, rt.exp, i === 0) })
    s += ' + C'
    if (`$${s}$` !== ansStr) distractors.add(`$${s}$`)
  }

  // Type 2: ลืมหารด้วย (p+1)
  {
    const result = terms.map(t => {
      const e = simplify(t.exp)
      const newExp = simplify({ n: e.n + e.d, d: e.d })
      return { cn: t.coeff, cd: 1, exp: newExp }
    })
    let s = ''
    result.forEach((rt, i) => { s += formatResultTerm(rt.cn, rt.cd, rt.exp, i === 0) })
    s += ' + C'
    if (`$${s}$` !== ansStr) distractors.add(`$${s}$`)
  }

  // Type 3: หาอนุพันธ์แทนปริพันธ์
  {
    const result = terms.filter(t => simplify(t.exp).n !== 0).map(t => {
      const e = simplify(t.exp)
      const newCoeff = t.coeff * e.n
      const newExp = simplify({ n: e.n - e.d, d: e.d })
      return { cn: newCoeff, cd: e.d, exp: newExp }
    })
    if (result.length > 0) {
      let s = ''
      result.forEach((rt, i) => { s += formatResultTerm(rt.cn, rt.cd, rt.exp, i === 0) })
      s += ' + C'
      if (`$${s}$` !== ansStr) distractors.add(`$${s}$`)
    }
  }

  // Type 4: เครื่องหมายผิด
  {
    const { resultTerms } = computeIntegral(terms)
    const result = resultTerms.map(rt => ({ ...rt, cn: -rt.cn }))
    let s = ''
    result.forEach((rt, i) => { s += formatResultTerm(rt.cn, rt.cd, rt.exp, i === 0) })
    s += ' + C'
    if (`$${s}$` !== ansStr) distractors.add(`$${s}$`)
  }

  // fallback
  while (distractors.size < 3) {
    const { resultTerms } = computeIntegral(terms)
    const tweak = resultTerms.map(rt => ({
      ...rt,
      cn: rt.cn + (Math.random() > 0.5 ? rt.cd : -rt.cd),
    })).filter(rt => rt.cn !== 0)
    if (tweak.length > 0) {
      let s = ''
      tweak.forEach((rt, i) => { s += formatResultTerm(rt.cn, rt.cd, rt.exp, i === 0) })
      s += ' + C'
      if (`$${s}$` !== ansStr) distractors.add(`$${s}$`)
    }
  }

  return Array.from(distractors).slice(0, 3)
}

async function seed() {
  const allQuestions = generateAll()

  // ลบ expression ซ้ำ
  const seen = new Set<string>()
  const unique = allQuestions.filter(q => {
    if (seen.has(q.questionLatex)) return false
    seen.add(q.questionLatex)
    return true
  })

  console.log(`Pool ทั้งหมด: ${unique.length} ข้อ`)

  const byCat: Record<string, IQ[]> = {}
  for (const q of unique) {
    if (!byCat[q.category]) byCat[q.category] = []
    byCat[q.category].push(q)
  }
  console.log('จำนวนแต่ละกลุ่ม:')
  for (const [k, v] of Object.entries(byCat)) {
    console.log(`  ${k}: ${v.length} ข้อ`)
  }

  // เลือก 100 ข้อ กระจายทุกกลุ่ม
  const selected: IQ[] = []
  const cats = Object.keys(byCat)
  const perCat = Math.floor(100 / cats.length)
  const remainder = 100 - perCat * cats.length

  for (let i = 0; i < cats.length; i++) {
    const count = perCat + (i < remainder ? 1 : 0)
    const shuffled = shuffleArray(byCat[cats[i]])
    selected.push(...shuffled.slice(0, count))
  }

  // parse terms จาก expression สำหรับทำ distractors
  // (ง่ายกว่า: regenerate terms จากข้อมูลที่เราสร้างไว้)
  // → เนื่องจาก makeDistractors ต้องการ terms, เราจะ compute distractors ตอนสร้าง
  // แต่ตอนนี้เราเก็บแค่ latex string ไว้ ดังนั้นจะใช้วิธีง่ายๆ: สร้าง distractors จาก answer string

  const rows = selected.map(q => {
    // สร้างตัวลวงง่ายๆ จาก answer
    const distractors = new Set<string>()

    // swap sign ของ answer
    const flipped = q.answerLatex.replace(/\$(.+) \+ C\$/, (_, body) => {
      const newBody = body.startsWith('-')
        ? body.slice(1)
        : '-' + body
      return `$${newBody} + C$`
    })
    if (flipped !== q.answerLatex) distractors.add(flipped)

    // ลบ + C
    const noC = q.answerLatex.replace(' + C', '')
    if (noC !== q.answerLatex) distractors.add(noC + '$')

    // เปลี่ยน coefficient เล็กน้อย
    const tweaked1 = q.answerLatex.replace(/\$(-?\d+)/, (_, num) => {
      return `$${parseInt(num) + 1}`
    })
    if (tweaked1 !== q.answerLatex) distractors.add(tweaked1)

    const tweaked2 = q.answerLatex.replace(/\$(-?\d+)/, (_, num) => {
      return `$${parseInt(num) - 1}`
    })
    if (tweaked2 !== q.answerLatex) distractors.add(tweaked2)

    // เปลี่ยน exponent
    const tweaked3 = q.answerLatex.replace(/x\^{([^}]+)}/, (_, exp) => {
      if (exp.includes('frac')) return `x^{${exp}}` // ไม่แก้ frac
      const n = parseInt(exp)
      return `x^{${n + 1}}`
    })
    if (tweaked3 !== q.answerLatex) distractors.add(tweaked3)

    const choices = shuffleArray([q.answerLatex, ...Array.from(distractors).slice(0, 3)])
    // ensure exactly 4 choices
    while (choices.length < 4) {
      choices.push(q.answerLatex.replace('+ C', '').trim() + '$')
    }

    return {
      topic: 'integral',
      difficulty: 'medium' as const,
      question_latex: q.questionLatex,
      correct_answer_latex: q.answerLatex,
      choices: choices.slice(0, 4),
    }
  })

  console.log(`\nกำลัง insert ${rows.length} ข้อ...`)
  console.log(`ตัวอย่าง:`)
  for (let i = 0; i < Math.min(10, rows.length); i++) {
    console.log(`  ${rows[i].question_latex}`)
    console.log(`    → ${rows[i].correct_answer_latex}`)
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

  console.log(`\nเสร็จ! เพิ่มโจทย์ปริพันธ์ระดับกลาง ${rows.length} ข้อเรียบร้อย`)
}

seed()
