import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BookOpen, Users, QrCode } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            เกมคณิตศาสตร์
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            เรียนรู้คณิตศาสตร์แบบเกมส์ พร้อมข้อสอบหลากหลายประเภท
          </p>
          <p className="text-sm text-gray-500 mt-4">
            พัฒนาโดยครูเก่ง
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <Card className="hover:shadow-lg transition-shadow duration-300 border-0 bg-white/70 backdrop-blur-sm">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <CardTitle className="text-xl text-gray-900">สำหรับครู</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600 mb-6">
                สร้างและจัดการชุดข้อสอบ พร้อมดูผลคะแนนของนักเรียน
              </p>
              <Link href="/admin" className="w-full">
                <Button className="w-full cursor-pointer">เข้าสู่หน้าครู</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-300 border-0 bg-white/70 backdrop-blur-sm">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="h-8 w-8 text-orange-600" />
              </div>
              <CardTitle className="text-xl text-gray-900">สำหรับนักเรียน</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600 mb-6">
                สแกน QR Code เพื่อเข้าเล่นเกมทดสอบความรู้
              </p>
              <Link href="/student" className="w-full">
                <Button variant="outline" className="w-full cursor-pointer">เริ่มเล่นเกม</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-300 border-0 bg-white/70 backdrop-blur-sm md:col-span-2 lg:col-span-1">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <QrCode className="h-8 w-8 text-purple-600" />
              </div>
              <CardTitle className="text-xl text-gray-900">วิธีการใช้งาน</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600 mb-6">
                ครูสร้างชุดข้อสอบ → สร้าง QR Code → นักเรียนสแกนและทำข้อสอบ
              </p>
              <Link href="/how-to-use" className="w-full">
                <Button variant="secondary" className="w-full cursor-pointer">เรียนรู้เพิ่มเติม</Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="mt-16 text-center">
          <div className="inline-flex items-center space-x-4 bg-white/50 backdrop-blur-sm rounded-full px-6 py-3 border border-gray-200">
            <span className="text-gray-600">พัฒนาโดย ครูเก่ง</span>
          </div>
        </div>
      </div>
    </div>
  )
}
