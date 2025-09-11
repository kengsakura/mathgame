# เกมคณิตศาสตร์ - การแยกตัวประกอบพหุนาม

เกมการเรียนรู้คณิตศาสตร์สำหรับการแยกตัวประกอบของพหุนามดีกรีสอง พัฒนาด้วย Next.js และ Supabase

## 🎯 คุณสมบัติหลัก

### สำหรับครู
- **สร้างชุดข้อสอบ**: กำหนดชื่อ, ระดับความยาก, เวลา และจำนวนข้อ
- **QR Code Generator**: สร้าง QR Code สำหรับนักเรียนสแกน
- **ระบบผลคะแนน**: ติดตามผลคะแนนแบบ real-time
- **Export ข้อมูล**: ส่งออกผลคะแนนเป็น CSV

### สำหรับนักเรียน
- **QR Code Scanner**: สแกนเพื่อเข้าเกมได้ทันที
- **ระบบเวลา**: นับถอยหลังต่อข้อ (ปรับได้)
- **ตัวลวงอัจฉริยะ**: ตัวเลือกที่ท้าทายและสมเหตุสมผล
- **ผลคะแนนทันที**: ดูคะแนนและเปอร์เซ็นต์ทันทีหลังจบ

### ระดับความยาก
- **ง่าย**: สัมประสิทธิ์หน้า x² = 1
- **ปานกลาง**: สัมประสิทธิ์หน้า x² = 1-3  
- **ยาก**: สัมประสิทธิ์หน้า x² หลากหลาย

## 🛠️ เทคโนโลยีที่ใช้

- **Frontend**: Next.js 14, React, TypeScript
- **UI Library**: Tailwind CSS, Radix UI, Lucide Icons
- **Backend**: Supabase (PostgreSQL, Real-time)
- **QR Code**: react-qr-code, qr-scanner
- **Styling**: มินิมอล, โมเดิร์น, สีสันไม่มาก

## 📦 การติดตั้ง

### 1. ติดตั้ง dependencies

```bash
npm install
```

### 2. ตั้งค่า Supabase

1. สร้างโปรเจค Supabase ใหม่ที่ [supabase.com](https://supabase.com)
2. ไปที่ **SQL Editor** และรันไฟล์ `supabase-schema.sql`
3. ไปที่ **Settings > API** เพื่อคัดลอก URL และ anon key

### 3. ตั้งค่า Environment Variables

แก้ไขไฟล์ `.env.local` และใส่ค่าจาก Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. รันโปรแกรม

```bash
npm run dev
```

เปิดบราวเซอร์ไปที่ [http://localhost:3000](http://localhost:3000)

## 📖 วิธีการใช้งาน

### สำหรับครู

1. **สร้างชุดข้อสอบ**
   - เข้าหน้า "สำหรับครู"
   - คลิก "สร้างชุดใหม่"
   - กรอกรายละเอียด: ชื่อ, ระดับความยาก, เวลา, จำนวนข้อ
   - คลิก "สร้างชุดข้อสอบ"

2. **แชร์ QR Code**
   - คลิก "QR Code" ในชุดที่สร้าง
   - แสดงหรือพิมพ์ QR Code ให้นักเรียน
   - หรือแชร์ URL โดยตรง

3. **ดูผลคะแนน**
   - คลิก "ผลคะแนน" เพื่อดูสถิติ
   - ผลจะอัปเดตแบบ real-time
   - Export เป็น CSV ได้

### สำหรับนักเรียน

1. **เริ่มทำข้อสอบ**
   - เข้าหน้า "สำหรับนักเรียน"
   - กรอกชื่อ-นามสกุล
   - สแกน QR Code หรือใส่รหัสชุดข้อสอบ
   - คลิก "เริ่มทำข้อสอบ"

2. **ทำข้อสอบ**
   - อ่านโจทย์การแยกตัวประกอบ
   - เลือกคำตอบจาก 4 ตัวเลือก
   - ระวังเวลา! หมดเวลาจะไปข้อต่อไป
   - ดูคะแนนทันทีเมื่อจบ

## 🧮 วิธีการแยกตัวประกอบ

สำหรับพหุนาม **ax² + bx + c**

หาค่า p และ q ที่ทำให้:
- p + q = b/a
- p × q = c/a

แล้วเขียนเป็น: **a(x + p)(x + q)**

### ตัวอย่าง: x² + 5x + 6

- a = 1, b = 5, c = 6
- หา p, q ที่ p + q = 5 และ p × q = 6
- p = 2, q = 3 (เพราะ 2 + 3 = 5 และ 2 × 3 = 6)
- **คำตอบ: (x + 2)(x + 3)**

## 🎨 การออกแบบ UI

- **สไตล์**: มินิมอล, โมเดิร์น
- **สีสัน**: Slate/Gray เป็นหลัก พร้อมสีเพิ่มเติมเล็กน้อย
- **Typography**: ชัดเจน อ่านง่าย
- **Layout**: Responsive สำหรับทุกหน้าจอ
- **Animations**: Subtle transitions

## 📊 ฐานข้อมูล Schema

### ตาราง `quizzes`
- `id` (UUID) - Primary Key
- `name` (TEXT) - ชื่อชุดข้อสอบ  
- `difficulty` (TEXT) - ระดับความยาก
- `time_per_question` (INTEGER) - เวลาต่อข้อ (วินาที)
- `total_questions` (INTEGER) - จำนวนข้อ
- `created_at` (TIMESTAMP) - วันที่สร้าง
- `created_by` (TEXT) - ผู้สร้าง

### ตาราง `quiz_attempts`  
- `id` (UUID) - Primary Key
- `quiz_id` (UUID) - Foreign Key ไปยัง quizzes
- `student_name` (TEXT) - ชื่อนักเรียน
- `score` (INTEGER) - คะแนนที่ได้
- `total_questions` (INTEGER) - จำนวนข้อทั้งหมด
- `time_taken` (INTEGER) - เวลาที่ใช้ (วินาที)
- `completed_at` (TIMESTAMP) - วันที่ทำเสร็จ

## 🚀 การ Deploy

### Vercel (แนะนำ)

```bash
npm run build
npx vercel --prod
```

อย่าลืมตั้งค่า Environment Variables ใน Vercel Dashboard

## 👥 ผู้พัฒนา

พัฒนาโดย Claude Code

---

**หมายเหตุ**: โปรแกรมนี้เป็น educational tool สำหรับการเรียนการสอน
