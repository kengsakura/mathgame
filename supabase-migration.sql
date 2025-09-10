-- อัปเดต constraint เพื่อรองรับประเภทข้อสอบใหม่
ALTER TABLE quizzes DROP CONSTRAINT IF EXISTS check_question_type;
ALTER TABLE quizzes ADD CONSTRAINT check_question_type 
  CHECK (question_type IN ('polynomial', 'equation', 'integer', 'fraction', 'power', 'root', 'function'));