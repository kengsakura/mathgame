-- สร้างตารางสำหรับเก็บข้อมูลชุดข้อสอบ
CREATE TABLE IF NOT EXISTS public.quizzes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    difficulty text NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
    time_per_question integer DEFAULT 20 CHECK (time_per_question > 0),
    total_questions integer DEFAULT 10 CHECK (total_questions > 0),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by text DEFAULT 'admin' NOT NULL
);

-- สร้างตารางสำหรับเก็บผลการทำข้อสอบ
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    quiz_id uuid NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
    student_name text NOT NULL,
    score integer NOT NULL CHECK (score >= 0),
    total_questions integer NOT NULL CHECK (total_questions > 0),
    time_taken integer NOT NULL CHECK (time_taken >= 0),
    completed_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- สร้าง index เพื่อเพิ่มประสิทธิภาพการค้นหา
CREATE INDEX IF NOT EXISTS idx_quizzes_created_at ON public.quizzes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz_id ON public.quiz_attempts(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_completed_at ON public.quiz_attempts(completed_at DESC);

-- เปิดใช้งาน Row Level Security
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

-- สร้าง policy สำหรับการเข้าถึงข้อมูล (ใช้สำหรับ demo - ในเวอร์ชันจริงควรมี authentication)
CREATE POLICY "Allow all access to quizzes" ON public.quizzes
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all access to quiz_attempts" ON public.quiz_attempts
    FOR ALL USING (true) WITH CHECK (true);

-- สร้างข้อมูลตัวอย่าง (optional)
INSERT INTO public.quizzes (name, difficulty, time_per_question, total_questions) VALUES
('การแยกตัวประกอบ ระดับง่าย', 'easy', 30, 10),
('การแยกตัวประกอบ ระดับปานกลาง', 'medium', 25, 15),
('การแยกตัวประกอบ ระดับยาก', 'hard', 20, 20);

-- คำแนะนำสำหรับการตั้งค่า Supabase:
-- 1. สร้างโปรเจค Supabase ใหม่
-- 2. ไปที่ SQL Editor
-- 3. รันคำสั่ง SQL นี้
-- 4. คัดลอก URL และ anon key ไปใส่ใน .env.local