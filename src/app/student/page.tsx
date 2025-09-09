'use client'
import { useState, useRef, useEffect, Suspense } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Camera, QrCode } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

function StudentPageContent() {
  const [studentName, setStudentName] = useState('')
  const [quizId, setQuizId] = useState('')
  const [showQRScanner, setShowQRScanner] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // ตรวจสอบว่ามี quiz ID จาก QR Code หรือไม่
  useEffect(() => {
    const quizFromUrl = searchParams.get('quiz')
    if (quizFromUrl) {
      setQuizId(quizFromUrl)
    }
  }, [searchParams])

  const startQuiz = () => {
    if (studentName.trim() && quizId.trim()) {
      router.push(`/quiz/${quizId}/play?name=${encodeURIComponent(studentName)}`)
    }
  }

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setShowQRScanner(true)
    } catch (error) {
      console.error('Error accessing camera:', error)
      alert('ไม่สามารถเปิดกล้องได้ กรุณาใส่ ID ชุดข้อสอบด้วยตนเอง')
    }
  }

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
    }
    setShowQRScanner(false)
  }

  const simulateQRScan = () => {
    // จำลองการสแกน QR code (ในเวอร์ชันจริงจะใช้ qr-scanner library)
    const mockQuizId = 'demo-quiz-id'
    setQuizId(mockQuizId)
    setShowQRScanner(false)
    stopCamera()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">นักเรียน</h1>
            <p className="text-gray-600">เริ่มทำข้อสอบคณิตศาสตร์</p>
            <Link href="/" className="text-sm text-gray-500 hover:text-gray-700 mt-2 inline-block">
              กลับหน้าหลัก
            </Link>
          </div>

          <Card className="border-0 bg-white/70 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-center">เข้าสู่ระบบ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">ชื่อของคุณ</label>
                <Input
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="กรอกชื่อ-นามสกุล"
                  className="text-center"
                />
              </div>

              {quizId ? (
                <div>
                  <label className="block text-sm font-medium mb-2">รหัสชุดข้อสอบ</label>
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-center">
                    <p className="text-orange-800 font-mono text-sm">✅ สแกน QR Code สำเร็จ</p>
                    <p className="text-orange-600 font-mono text-xs mt-1">{quizId}</p>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium mb-2">รหัสชุดข้อสอบ</label>
                  <Input
                    value={quizId}
                    onChange={(e) => setQuizId(e.target.value)}
                    placeholder="กรอกรหัสชุดข้อสอบ หรือสแกน QR Code"
                    className="text-center"
                  />
                </div>
              )}

              <div className="flex gap-2">
                {!quizId && (
                  <Button 
                    onClick={startCamera}
                    variant="outline" 
                    className="flex-1"
                    disabled={showQRScanner}
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    สแกน QR Code
                  </Button>
                )}
                <Button 
                  onClick={startQuiz} 
                  disabled={!studentName.trim() || !quizId.trim()}
                  className={quizId ? "w-full" : "flex-1"}
                >
                  เริ่มทำข้อสอบ
                </Button>
              </div>

              {showQRScanner && (
                <div className="space-y-4">
                  <div className="relative">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full rounded-lg"
                    />
                    <canvas
                      ref={canvasRef}
                      className="hidden"
                    />
                    <div className="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none">
                      <div className="absolute inset-4 border border-blue-300 rounded-lg">
                        <div className="absolute top-0 left-0 w-6 h-6 border-l-2 border-t-2 border-blue-500"></div>
                        <div className="absolute top-0 right-0 w-6 h-6 border-r-2 border-t-2 border-blue-500"></div>
                        <div className="absolute bottom-0 left-0 w-6 h-6 border-l-2 border-b-2 border-blue-500"></div>
                        <div className="absolute bottom-0 right-0 w-6 h-6 border-r-2 border-b-2 border-blue-500"></div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={simulateQRScan} className="flex-1">
                      จำลองการสแกน (Demo)
                    </Button>
                    <Button onClick={stopCamera} variant="outline">
                      ปิดกล้อง
                    </Button>
                  </div>
                  <p className="text-sm text-gray-600 text-center">
                    หันกล้องไปที่ QR Code ที่ครูให้
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="mt-6 border-0 bg-blue-50/70 backdrop-blur-sm">
            <CardContent className="p-4">
              <h3 className="font-semibold text-gray-900 mb-2">วิธีการทำข้อสอบ</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• แต่ละข้อมีเวลาจำกัด (ตามที่ครูกำหนด)</li>
                <li>• เลือกคำตอบที่ถูกต้องจาก 4 ตัวเลือก</li>
                <li>• ถ้าหมดเวลาจะไปข้อต่อไปอัตโนมัติ</li>
                <li>• คะแนนจะปรากฏทันทีเมื่อจบข้อสอบ</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function StudentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลด...</p>
        </div>
      </div>
    }>
      <StudentPageContent />
    </Suspense>
  )
}