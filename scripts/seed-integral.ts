/**
 * Seed script: สร้างโจทย์ปริพันธ์ไม่จำกัดเขต (ง่าย) 50 ข้อ แล้ว insert ลง Supabase
 * Usage: npx tsx scripts/seed-integral.ts
 */
import { readFileSync } from 'fs'
import { resolve } from 'path'

// อ่าน .env.local เอง ไม่ต้องพึ่ง dotenv
const envPath = resolve(import.meta.dirname || __dirname, '..', '.env.local')
const envContent = readFileSync(envPath, 'utf-8')
for (const line of envContent.split('\n')) {
  const match = line.match(/^([^#=]+)=(.*)$/)
  if (match) process.env[match[1].trim()] = match[2].trim()
}

import { createClient } from '@supabase/supabase-js'
import { MathQuestionGenerator } from '../src/lib/polynomial-generator'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)
const generator = new MathQuestionGenerator()

async function seed() {
  const questions = generator.generateQuestions(50, {
    difficulty: 'easy',
    maxConstantTerm: 20,
    questionType: 'integral',
  })

  const rows = questions.map((q) => ({
    topic: 'integral',
    difficulty: 'easy' as const,
    question_latex: q.expression,
    correct_answer_latex: q.correctAnswer,
    choices: q.choices,
  }))

  console.log(`กำลัง insert ${rows.length} ข้อ...`)

  // Insert เป็นชุดๆ ละ 25 ข้อ
  for (let i = 0; i < rows.length; i += 25) {
    const batch = rows.slice(i, i + 25)
    const { error } = await supabase.from('questions').insert(batch)
    if (error) {
      console.error(`Error inserting batch ${i / 25 + 1}:`, error.message)
      process.exit(1)
    }
    console.log(`  batch ${i / 25 + 1}: insert ${batch.length} ข้อ OK`)
  }

  console.log(`\nเสร็จ! เพิ่มโจทย์ปริพันธ์ไม่จำกัดเขต (ง่าย) ${rows.length} ข้อเรียบร้อย`)
}

seed()
