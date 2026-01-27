-- Migration สำหรับตาราง quizzes:
-- 1) สร้างคอลัมน์หากยังไม่มี (ยังไม่ใส่ CHECK เพื่อหลีกเลี่ยง error ระหว่าง clean data)
-- 2) จัดระเบียบข้อมูลให้เข้าเกณฑ์
-- 3) เพิ่ม CHECK constraint แบบ NOT VALID แล้วค่อย VALIDATE หลังข้อมูลถูกต้อง

BEGIN;

-- เพิ่มคอลัมน์ (ถ้ายังไม่มี) โดยยังไม่ใส่ CHECK ตรงนี้
ALTER TABLE public.quizzes
  ADD COLUMN IF NOT EXISTS question_type text;

ALTER TABLE public.quizzes
  ADD COLUMN IF NOT EXISTS passing_threshold integer;

-- ตั้งค่า DEFAULT ของคอลัมน์ (มีผลกับแถวใหม่)
ALTER TABLE public.quizzes
  ALTER COLUMN question_type SET DEFAULT 'power';

ALTER TABLE public.quizzes
  ALTER COLUMN passing_threshold SET DEFAULT 60;

-- จัดระเบียบข้อมูลที่มีอยู่ให้สอดคล้องกับชุดค่าที่อนุญาต
-- แปลงเป็นตัวพิมพ์เล็กและตัดช่องว่าง
UPDATE public.quizzes
SET question_type = lower(trim(question_type))
WHERE question_type IS NOT NULL;

-- แก้ค่าที่เป็น NULL หรืออยู่นอกลิสต์ให้เป็นค่าเริ่มต้น 'power'
UPDATE public.quizzes
SET question_type = 'power'
WHERE question_type IS NULL
   OR question_type NOT IN ('power', 'root', 'polynomial', 'equation');

-- ตั้งค่า passing_threshold ให้ถูกช่วง และเติมค่าเริ่มต้นกรณี NULL
UPDATE public.quizzes
SET passing_threshold = 60
WHERE passing_threshold IS NULL
   OR passing_threshold < 0
   OR passing_threshold > 100;

-- อัปเดต/เพิ่ม CHECK constraint อย่างปลอดภัย
ALTER TABLE public.quizzes DROP CONSTRAINT IF EXISTS check_question_type;
ALTER TABLE public.quizzes
  ADD CONSTRAINT check_question_type
  CHECK (question_type IN ('power', 'root', 'polynomial', 'equation')) NOT VALID;

-- ตรวจสอบและยืนยัน constraint หลังจากข้อมูลถูกต้องแล้ว
ALTER TABLE public.quizzes VALIDATE CONSTRAINT check_question_type;

COMMIT;
