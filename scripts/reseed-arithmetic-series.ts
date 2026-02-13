/**
 * ลบข้อเก่า + สร้างใหม่ 50 ข้อ (LaTeX format)
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
import { MathQuestionGenerator } from '../src/lib/polynomial-generator'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
const generator = new MathQuestionGenerator()

async function main() {
  // ลบข้อเก่า
  const { error: delErr } = await supabase.from('questions').delete().eq('topic', 'arithmetic_series')
  if (delErr) { console.error('Delete error:', delErr.message); process.exit(1) }
  console.log('ลบข้อเก่าแล้ว')

  // สร้างใหม่
  const questions = generator.generateQuestions(50, { difficulty: 'easy', maxConstantTerm: 20, questionType: 'arithmetic_series' })
  const rows = questions.map(q => ({
    topic: 'arithmetic_series',
    difficulty: 'easy' as const,
    question_latex: q.expression,
    correct_answer_latex: q.correctAnswer,
    choices: q.choices,
  }))

  for (let i = 0; i < rows.length; i += 25) {
    const batch = rows.slice(i, i + 25)
    const { error } = await supabase.from('questions').insert(batch)
    if (error) { console.error('Insert error:', error.message); process.exit(1) }
    console.log(`  batch ${i / 25 + 1}: insert ${batch.length} ข้อ OK`)
  }

  console.log(`\nเสร็จ! เพิ่มอนุกรมเลขคณิต (ง่าย) ${rows.length} ข้อ (LaTeX)`)
  console.log('ตัวอย่าง:', rows[0].question_latex)
}

main()
