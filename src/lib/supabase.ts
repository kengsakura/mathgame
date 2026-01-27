import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY'

// Fail fast ถ้าไม่ได้ตั้งค่าคีย์ (ช่วยให้จับปัญหาคะแนนไม่บันทึกได้เร็วขึ้น)
if (
  (typeof window !== 'undefined') &&
  (supabaseUrl === 'YOUR_SUPABASE_URL' || supabaseAnonKey === 'YOUR_SUPABASE_ANON_KEY')
) {
  // โยน error ทันทีเพื่อบอกว่าต้องตั้งค่า env ก่อนใช้งาน
  throw new Error('Missing Supabase env: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      quizzes: {
        Row: {
          id: string
          name: string
          difficulty: 'easy' | 'medium' | 'hard'
          time_per_question: number
          total_questions: number
          question_type: 'power' | 'root' | 'polynomial' | 'equation'
          passing_threshold: number
          created_at: string
          created_by: string
        }
        Insert: {
          id?: string
          name: string
          difficulty: 'easy' | 'medium' | 'hard'
          time_per_question?: number
          total_questions?: number
          question_type?: 'power' | 'root' | 'polynomial' | 'equation'
          passing_threshold?: number
          created_at?: string
          created_by: string
        }
        Update: {
          id?: string
          name?: string
          difficulty?: 'easy' | 'medium' | 'hard'
          time_per_question?: number
          total_questions?: number
          question_type?: 'power' | 'root' | 'polynomial' | 'equation'
          passing_threshold?: number
          created_at?: string
          created_by?: string
        }
      }
      quiz_attempts: {
        Row: {
          id: string
          quiz_id: string
          student_name: string
          score: number
          total_questions: number
          time_taken: number
          completed_at: string
        }
        Insert: {
          id?: string
          quiz_id: string
          student_name: string
          score: number
          total_questions: number
          time_taken: number
          completed_at?: string
        }
        Update: {
          id?: string
          quiz_id?: string
          student_name?: string
          score?: number
          total_questions?: number
          time_taken?: number
          completed_at?: string
        }
      }
    }
  }
}
