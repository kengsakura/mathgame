-- สร้างตารางคลังข้อสอบ (Question Bank)
CREATE TABLE IF NOT EXISTS public.questions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    topic text NOT NULL, -- เช่น 'derivative', 'polynomial'
    difficulty text NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
    question_latex text NOT NULL, -- โจทย์ในรูป LaTeX
    correct_answer_latex text NOT NULL,
    choices jsonb NOT NULL, -- อาเรย์ของตัวเลือกเก็บเป็น JSON ["$x^2$", "$2x$"]
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- เพิ่ม Index
CREATE INDEX IF NOT EXISTS idx_questions_topic_difficulty ON public.questions(topic, difficulty);

-- เปิด RLS
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

-- Policy (อ่านได้ทุกคน)
CREATE POLICY "Allow read access to questions" ON public.questions
    FOR SELECT USING (true);
    
-- Policy (เขียนได้ทุกคนสำหรับ demo)
CREATE POLICY "Allow all access to questions" ON public.questions
    FOR ALL USING (true) WITH CHECK (true);

-- เพิ่มข้อมูลตัวอย่าง (Seeding)
INSERT INTO public.questions (topic, difficulty, question_latex, correct_answer_latex, choices) VALUES
-- อนุพันธ์ (Derivative) - Easy
(
    'derivative', 'easy', 
    'จงหาอนุพันธ์ของ $f(x) = x^2$', 
    '$2x$', 
    '["$2x$", "$x$", "$2$", "$x^2$"]'::jsonb
),
(
    'derivative', 'easy', 
    'จงหาอนุพันธ์ของ $f(x) = 3x$', 
    '$3$', 
    '["$3$", "$3x$", "$0$", "$x$"]'::jsonb
),
(
    'derivative', 'easy', 
    'จงหาอนุพันธ์ของ $f(x) = 5$', 
    '$0$', 
    '["$0$", "$5$", "$1$", "$5x$"]'::jsonb
),

-- อนุพันธ์ (Derivative) - Medium
(
    'derivative', 'medium', 
    'จงหาอนุพันธ์ของ $f(x) = x^2 + 2x + 1$', 
    '$2x + 2$', 
    '["$2x + 2$", "$2x + 1$", "$x + 2$", "$2x$"]'::jsonb
),
(
    'derivative', 'medium', 
    'จงหาอนุพันธ์ของ $f(x) = 3x^3 - 4x$', 
    '$9x^2 - 4$', 
    '["$9x^2 - 4$", "$3x^2 - 4$", "$9x^2 - 4x$", "$x^2 - 4$"]'::jsonb
),

-- แยกตัวประกอบ (Polynomial) - Easy
(
    'polynomial', 'easy',
    'จงแยกตัวประกอบของ $x^2 + 5x + 6$',
    '$(x+2)(x+3)$',
    '["$(x+2)(x+3)$", "$(x+1)(x+6)$", "$(x-2)(x-3)$", "$(x+2)(x+4)$"]'::jsonb
);
