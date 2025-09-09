import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Users, BookOpen, Trophy } from 'lucide-react'
import Link from 'next/link'

export default function HowToUsePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Button variant="outline" asChild>
              <Link href="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                กลับหน้าหลัก
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">วิธีการใช้งาน</h1>
              <p className="text-gray-600">คู่มือการใช้งานเกมคณิตศาสตร์</p>
            </div>
          </div>

          <div className="space-y-8">
            {/* สำหรับครู */}
            <Card className="border-0 bg-white/70 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Users className="h-6 w-6 text-blue-600" />
                  สำหรับครู
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900">ขั้นตอนที่ 1: สร้างชุดข้อสอบ</h3>
                    <ul className="text-sm text-gray-600 space-y-2">
                      <li>• คลิก "เข้าสู่หน้าครู" จากหน้าหลัก</li>
                      <li>• คลิก "สร้างชุดใหม่"</li>
                      <li>• กรอกชื่อชุดข้อสอบ</li>
                      <li>• เลือกระดับความยาก (ง่าย/ปานกลาง/ยาก)</li>
                      <li>• กำหนดเวลาต่อข้อ และจำนวนข้อ</li>
                      <li>• คลิก "สร้างชุดข้อสอบ"</li>
                    </ul>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900">ขั้นตอนที่ 2: สร้าง QR Code</h3>
                    <ul className="text-sm text-gray-600 space-y-2">
                      <li>• คลิก "QR Code" ในชุดข้อสอบที่สร้าง</li>
                      <li>• QR Code จะสร้างขึ้นอัตโนมัติ</li>
                      <li>• สามารถดาวน์โหลด หรือแชร์ได้</li>
                      <li>• แสดง QR Code ให้นักเรียนสแกน</li>
                      <li>• QR Code ใช้ได้หลายครั้งและไม่หมดอายุ</li>
                    </ul>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900">ขั้นตอนที่ 3: ดูผลคะแนน</h3>
                    <ul className="text-sm text-gray-600 space-y-2">
                      <li>• คลิก "ผลคะแนน" ในชุดข้อสอบ</li>
                      <li>• ดูสถิติรวมและรายชื่อนักเรียน</li>
                      <li>• ผลคะแนนอัปเดตแบบ real-time</li>
                      <li>• สามารถ export ข้อมูลเป็น CSV ได้</li>
                    </ul>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900">การจัดการชุดข้อสอบ</h3>
                    <ul className="text-sm text-gray-600 space-y-2">
                      <li>• สามารถสร้างได้หลายชุด</li>
                      <li>• ลบชุดข้อสอบที่ไม่ใช้แล้วได้</li>
                      <li>• ดูสถิติรวมของทุกชุด</li>
                      <li>• ติดตามจำนวนคนที่เข้าทำข้อสอบ</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* สำหรับนักเรียน */}
            <Card className="border-0 bg-white/70 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <BookOpen className="h-6 w-6 text-orange-600" />
                  สำหรับนักเรียน
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900">ขั้นตอนที่ 1: เข้าสู่ระบบ</h3>
                    <ul className="text-sm text-gray-600 space-y-2">
                      <li>• คลิก "เริ่มเล่นเกม" จากหน้าหลัก</li>
                      <li>• กรอกชื่อ-นามสกุล</li>
                      <li>• สแกน QR Code ที่ครูให้</li>
                      <li>• หรือใส่รหัสชุดข้อสอบด้วยตนเอง</li>
                      <li>• คลิก "เริ่มทำข้อสอบ"</li>
                    </ul>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900">ขั้นตอนที่ 2: ทำข้อสอบ</h3>
                    <ul className="text-sm text-gray-600 space-y-2">
                      <li>• อ่านโจทย์ให้เข้าใจ</li>
                      <li>• เลือกคำตอบที่ถูกต้องจาก 4 ตัวเลือก</li>
                      <li>• ระวังเวลา! แต่ละข้อมีเวลาจำกัด</li>
                      <li>• หมดเวลาจะไปข้อต่อไปอัตโนมัติ</li>
                      <li>• คะแนนจะแสดงเมื่อจบข้อสอบ</li>
                    </ul>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900">เทคนิคการทำข้อสอบ</h3>
                    <ul className="text-sm text-gray-600 space-y-2">
                      <li>• อ่านโจทย์ให้รอบคอบ</li>
                      <li>• ระบุสัมประสิทธิ์ a, b, c</li>
                      <li>• หาค่า p, q ที่ทำให้ p+q = b/a และ pq = c/a</li>
                      <li>• ระวังเครื่องหมาย บวก ลบ</li>
                      <li>• ตรวจสอบคำตอบก่อนเลือก</li>
                    </ul>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900">หลังจบข้อสอบ</h3>
                    <ul className="text-sm text-gray-600 space-y-2">
                      <li>• ดูคะแนนที่ได้ทันที</li>
                      <li>• เปรียบเทียบกับนักเรียนคนอื่น</li>
                      <li>• สามารถทำข้อสอบซ้ำได้</li>
                      <li>• ฝึกฝนเพื่อปรับปรุงคะแนน</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ระดับความยาก */}
            <Card className="border-0 bg-white/70 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Trophy className="h-6 w-6 text-purple-600" />
                  ระดับความยาก
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center space-y-3">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                      <span className="text-gray-800 font-bold">ง่าย</span>
                    </div>
                    <h3 className="font-semibold text-gray-900">ระดับง่าย</h3>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• สัมประสิทธิ์หน้า x² = 1</li>
                      <li>• ตัวเลขไม่ซับซ้อน</li>
                      <li>• เหมาะสำหรับผู้เริ่มต้น</li>
                      <li>• เช่น: x²+5x+6</li>
                    </ul>
                  </div>

                  <div className="text-center space-y-3">
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
                      <span className="text-orange-800 font-bold">กลาง</span>
                    </div>
                    <h3 className="font-semibold text-gray-900">ระดับปานกลาง</h3>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• สัมประสิทธิ์หน้า x² = 1-3</li>
                      <li>• ตัวเลขหลากหลายขึ้น</li>
                      <li>• เหมาะสำหรับผู้มีพื้นฐาน</li>
                      <li>• เช่น: 2x²+7x+3</li>
                    </ul>
                  </div>

                  <div className="text-center space-y-3">
                    <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center mx-auto">
                      <span className="text-white font-bold">ยาก</span>
                    </div>
                    <h3 className="font-semibold text-gray-900">ระดับยาก</h3>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• สัมประสิทธิ์หน้า x² หลากหลาย</li>
                      <li>• ตัวเลขซับซ้อน</li>
                      <li>• เหมาะสำหรับผู้เชี่ยวชาญ</li>
                      <li>• เช่น: 6x²-13x+5</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* เทคนิคการแก้โจทย์ */}
            <Card className="border-0 bg-blue-50/70 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>เทคนิคการแยกตัวประกอบ</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-lg border">
                    <h3 className="font-semibold text-gray-900 mb-3">สูตร: ax² + bx + c = a(x + p)(x + q)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <h4 className="font-medium text-gray-800 mb-2">เงื่อนไข:</h4>
                        <ul className="text-gray-600 space-y-1">
                          <li>• p + q = b/a</li>
                          <li>• p × q = c/a</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-800 mb-2">ตัวอย่าง: x² + 5x + 6</h4>
                        <ul className="text-gray-600 space-y-1">
                          <li>• a=1, b=5, c=6</li>
                          <li>• หา p, q ที่ p+q=5 และ pq=6</li>
                          <li>• p=2, q=3 (2+3=5, 2×3=6)</li>
                          <li>• คำตอบ: (x+2)(x+3)</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="text-center">
              <div className="inline-flex items-center gap-4 bg-white/50 backdrop-blur-sm rounded-full px-6 py-3 border border-gray-200">
                <span className="text-gray-600">พร้อมเริ่มต้นแล้วใช่ไหม?</span>
                <Button asChild>
                  <Link href="/">กลับหน้าหลัก</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}