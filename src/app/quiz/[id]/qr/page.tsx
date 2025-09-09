'use client'
import { useState, useEffect, useCallback, use } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import QRCode from 'react-qr-code'
import { Download, Share2, Copy, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface Quiz {
  id: string
  name: string
  difficulty: 'easy' | 'medium' | 'hard'
  time_per_question: number
  total_questions: number
  created_at: string
}

export default function QRCodePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [copied, setCopied] = useState(false)

  const loadQuiz = useCallback(async () => {
    const { data } = await supabase
      .from('quizzes')
      .select('*')
      .eq('id', id)
      .single()

    if (data) {
      setQuiz(data)
    }
  }, [id])

  useEffect(() => {
    loadQuiz()
  }, [loadQuiz])

  const copyToClipboard = () => {
    const url = `${window.location.origin}/student?quiz=${id}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const downloadQR = () => {
    const svg = document.getElementById('qr-code')
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg)
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()
      
      img.onload = () => {
        canvas.width = img.width
        canvas.height = img.height
        if (ctx) {
          ctx.drawImage(img, 0, 0)
          const pngFile = canvas.toDataURL('image/png')
          
          const downloadLink = document.createElement('a')
          downloadLink.download = `qr-${quiz?.name || 'quiz'}.png`
          downloadLink.href = pngFile
          downloadLink.click()
        }
      }
      
      img.src = 'data:image/svg+xml;base64,' + btoa(svgData)
    }
  }

  const shareQuiz = async () => {
    const url = `${window.location.origin}/student?quiz=${id}`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `ข้อสอบ: ${quiz?.name}`,
          text: 'มาทำข้อสอบคณิตศาสตร์กันเถอะ!',
          url: url
        })
      } catch (err) {
        copyToClipboard()
      }
    } else {
      copyToClipboard()
    }
  }

  if (!quiz) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลด...</p>
        </div>
      </div>
    )
  }

  const qrValue = `${window.location.origin}/student?quiz=${id}`
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Button variant="outline" asChild>
              <Link href="/admin">
                <ArrowLeft className="h-4 w-4 mr-2" />
                กลับหน้าครู
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">QR Code สำหรับนักเรียน</h1>
              <p className="text-gray-600">ให้นักเรียนสแกนเพื่อเข้าทำข้อสอบ</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* QR Code Card */}
            <Card className="border-0 bg-white/70 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-center">{quiz.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-white p-8 rounded-lg shadow-sm mb-6 flex justify-center">
                  <QRCode
                    id="qr-code"
                    value={qrValue}
                    size={256}
                    style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                    viewBox={`0 0 256 256`}
                  />
                </div>
                
                <div className="text-center space-y-4">
                  <p className="text-sm text-gray-600">
                    ให้นักเรียนสแกน QR Code นี้เพื่อเข้าทำข้อสอบ
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button onClick={downloadQR} variant="outline" className="flex-1">
                      <Download className="h-4 w-4 mr-2" />
                      ดาวน์โหลด
                    </Button>
                    <Button onClick={shareQuiz} variant="outline" className="flex-1">
                      <Share2 className="h-4 w-4 mr-2" />
                      แชร์
                    </Button>
                    <Button onClick={copyToClipboard} variant="outline" className="flex-1">
                      <Copy className="h-4 w-4 mr-2" />
                      {copied ? 'คัดลอกแล้ว!' : 'คัดลอก URL'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quiz Info Card */}
            <div className="space-y-6">
              <Card className="border-0 bg-white/70 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>รายละเอียดข้อสอบ</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">ชื่อชุดข้อสอบ:</span>
                      <div className="font-medium">{quiz.name}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">ระดับความยาก:</span>
                      <div className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        quiz.difficulty === 'easy' ? 'bg-gray-100 text-gray-800' :
                        quiz.difficulty === 'medium' ? 'bg-orange-100 text-orange-800' :
                        'bg-gray-800 text-white'
                      }`}>
                        {quiz.difficulty === 'easy' ? 'ง่าย' : 
                         quiz.difficulty === 'medium' ? 'ปานกลาง' : 'ยาก'}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600">จำนวนข้อ:</span>
                      <div className="font-medium">{quiz.total_questions} ข้อ</div>
                    </div>
                    <div>
                      <span className="text-gray-600">เวลาต่อข้อ:</span>
                      <div className="font-medium">{quiz.time_per_question} วินาที</div>
                    </div>
                    <div>
                      <span className="text-gray-600">เวลารวม:</span>
                      <div className="font-medium">
                        {Math.floor((quiz.total_questions * quiz.time_per_question) / 60)} นาที {(quiz.total_questions * quiz.time_per_question) % 60} วินาที
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600">สร้างเมื่อ:</span>
                      <div className="font-medium">
                        {new Date(quiz.created_at).toLocaleDateString('th-TH')}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 bg-blue-50/70 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>คำแนะนำสำหรับครู</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm text-gray-700 space-y-2">
                    <li>• แสดง QR Code บนหน้าจอหรือพิมพ์ออกมาให้นักเรียนสแกน</li>
                    <li>• นักเรียนสามารถใส่ชื่อและเริ่มทำข้อสอบได้ทันที</li>
                    <li>• ผลคะแนนจะบันทึกอัตโนมัติเมื่อทำเสร็จ</li>
                    <li>• คุณสามารถดูผลคะแนนทั้งหมดได้ในหน้า "ผลคะแนน"</li>
                    <li>• QR Code นี้ใช้ได้หลายครั้งและไม่หมดอายุ</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-0 bg-orange-50/70 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>URL สำหรับนักเรียน</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-white p-3 rounded border text-sm font-mono break-all">
                    {qrValue}
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    นักเรียนสามารถเข้าลิงก์นี้โดยตรงได้หากไม่สะดวกสแกน QR Code
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="mt-8 text-center space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" variant="outline">
                <Link href={`/quiz/${id}/play?name=ครู (ทดสอบ)`}>
                  ลองเล่นดู
                </Link>
              </Button>
              <Button asChild size="lg">
                <Link href={`/admin/quiz/${id}/results`}>
                  ดูผลคะแนนนักเรียน
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}