/**
 * Seed script: สร้างโจทย์ลำดับเลขคณิต (ง่าย) 100 ข้อ แล้ว insert ลง Supabase
 * Usage: npx tsx scripts/seed-arithmetic-sequence.ts
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

async function seed() {
  const questions = generator.generateQuestions(100, {
    difficulty: 'easy',
    maxConstantTerm: 20,
    questionType: 'arithmetic_sequence',
  })

  const rows = questions.map(q => ({
    topic: 'arithmetic_sequence',
    difficulty: 'easy' as const,
    question_latex: q.expression,
    correct_answer_latex: q.correctAnswer,
    choices: q.choices,
  }))

  console.log(`กำลัง insert ${rows.length} ข้อ...`)

  for (let i = 0; i < rows.length; i += 25) {
    const batch = rows.slice(i, i + 25)
    const { error } = await supabase.from('questions').insert(batch)
    if (error) {
      console.error(`Error inserting batch ${i / 25 + 1}:`, error.message)
      process.exit(1)
    }
    console.log(`  batch ${i / 25 + 1}: insert ${batch.length} ข้อ OK`)
  }

  console.log(`\nเสร็จ! เพิ่มโจทย์ลำดับเลขคณิต (ง่าย) ${rows.length} ข้อเรียบร้อย`)
}

seed()
