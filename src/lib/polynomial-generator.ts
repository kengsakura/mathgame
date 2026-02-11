export interface Question {
  expression: string
  correctAnswer: string
  choices: string[]
  a?: number // เปลี่ยนเป็น optional
  b?: number // เปลี่ยนเป็น optional
  c?: number // เปลี่ยนเป็น optional
  // เพิ่ม method สำหรับเช็คคำตอบ
  checkAnswer?: (answer: string) => boolean
  // เพิ่มข้อมูลการแยกตัวประกอบ
  factorInfo?: {
    a1: number
    a2: number
    m: number
    n: number
  }
}

export type QuestionType = 'power' | 'root' | 'polynomial' | 'equation' | 'derivative' | 'integral'

export interface GeneratorOptions {
  difficulty: 'easy' | 'medium' | 'hard'
  maxConstantTerm: number
  questionType?: QuestionType
}

export class MathQuestionGenerator {
  private generateFactors(difficulty: 'easy' | 'medium' | 'hard', maxConstantTerm: number): [number, number, number, any] {
    let a = 1
    let p: number, q: number

    if (difficulty === 'easy') {
      // ง่าย: สัมประสิทธิ์หน้า x² เป็น 1 แบบ (x+p)(x+q)
      p = Math.floor(Math.random() * 10) + 1
      q = Math.floor(Math.random() * 10) + 1
      
      // สุ่มเครื่องหมาย
      if (Math.random() < 0.3) p = -p
      if (Math.random() < 0.3) q = -q
      
      // คำนวณค่าสัมประสิทธิ์ จาก (x+p)(x+q) = x² + (p+q)x + pq
      const b = p + q
      const c = p * q
      
      // ตรวจสอบขอบเขตพจน์หลัง
      if (Math.abs(c) > maxConstantTerm) {
        return this.generateFactors(difficulty, maxConstantTerm)
      }
      
      // ตรวจสอบว่า gcd(a, b, c) = 1 (จำนวนเฉพาะสัมพัทธ์)
      const gcd = this.findGCD3(a, b, c)
      if (gcd > 1) {
        return this.generateFactors(difficulty, maxConstantTerm)
      }
      
      return [a, b, c, a]
    } else {
      // ปานกลางและยาก: สร้างแบบ (ax+m)(bx+n) = abx² + (an+bm)x + mn
      let a1: number, a2: number, m: number, n: number
      
      if (difficulty === 'medium') {
        // ปานกลาง: ใช้ค่าเล็กเพื่อป้องกัน expression ยาวเกินไป
        a1 = [1, 2][Math.floor(Math.random() * 2)]
        a2 = [1, 2, 3][Math.floor(Math.random() * 3)]
        m = Math.floor(Math.random() * 4) + 1  // 1-4
        n = Math.floor(Math.random() * 4) + 1  // 1-4
        
        // สุ่มเครื่องหมาย (ลดโอกาส)
        if (Math.random() < 0.3) m = -m
        if (Math.random() < 0.3) n = -n
      } else {
        // ยาก: ค่าปานกลาง ไม่ให้ใหญ่เกินไป
        a1 = [1, 2, 3][Math.floor(Math.random() * 3)]  
        a2 = [1, 2, 3][Math.floor(Math.random() * 3)]  
        m = Math.floor(Math.random() * 5) + 1  // 1-5
        n = Math.floor(Math.random() * 5) + 1  // 1-5
        
        // สุ่มเครื่องหมาย
        if (Math.random() < 0.4) m = -m
        if (Math.random() < 0.4) n = -n
      }
      
      // คำนวณสัมประสิทธิ์ จาก (a1*x + m)(a2*x + n) = a1*a2*x² + (a1*n + a2*m)x + m*n
      const a = a1 * a2
      const b = a1 * n + a2 * m
      const c = m * n
      
      // ตรวจสอบขอบเขตพจน์หลัง
      if (Math.abs(c) > maxConstantTerm) {
        return this.generateFactors(difficulty, maxConstantTerm)
      }
      
      // ตรวจสอบว่า gcd(a, b, c) = 1 (จำนวนเฉพาะสัมพัทธ์)
      const gcd = this.findGCD3(a, b, c)
      if (gcd > 1) {
        return this.generateFactors(difficulty, maxConstantTerm)
      }
      
      // คืนค่า [a, b, c, factor_object] โดยใช้ object แทนการ encode
      return [a, b, c, { a1, a2, m, n }]
    }
  }

  private formatExpression(a: number, b: number, c: number): string {
    let expr = ''

    // พจน์แรก x²
    if (a === 1) {
      expr = 'x²'
    } else if (a === -1) {
      expr = '-x²'
    } else {
      expr = `${a}x²`
    }

    // พจน์กลาง x
    if (b > 0) {
      expr += b === 1 ? '+x' : `+${b}x`
    } else if (b < 0) {
      expr += b === -1 ? '-x' : `${b}x`
    }

    // พจน์หลัง (ค่าคงที่)
    if (c > 0) {
      expr += `+${c}`
    } else if (c < 0) {
      expr += `${c}`
    }

    return expr
  }

  private formatFactors(a: number, p: number, q: number, factorsInfo?: any): string {
    if (a === 1) {
      // กรณีง่าย: (x+p)(x+q)
      return `(x${this.formatSign(p)})(x${this.formatSign(q)})`
    } else if (factorsInfo && typeof factorsInfo === 'object') {
      // กรณีปานกลางและยาก: ใช้ข้อมูลจาก factorsInfo object
      const { a1, a2, m, n } = factorsInfo
      
      // สร้าง (a1*x + m)(a2*x + n)
      const factor1 = this.formatComplexFactor(a1, m)
      const factor2 = this.formatComplexFactor(a2, n)
      
      return `(${factor1})(${factor2})`
    } else {
      // fallback เก่า (ไม่ควรเกิดขึ้น)
      return `${a}(x${this.formatSign(p)})(x${this.formatSign(q)})`
    }
  }
  
  private formatComplexFactor(coeff: number, constant: number): string {
    let factor = ''
    
    // ส่วนของ x
    if (coeff === 1) {
      factor = 'x'
    } else if (coeff === -1) {
      factor = '-x'
    } else {
      factor = `${coeff}x`
    }
    
    // ส่วนของค่าคงที่
    if (constant > 0) {
      factor += `+${constant}`
    } else if (constant < 0) {
      factor += constant.toString()
    }
    
    return factor
  }

  private formatSingleFactor(coeff: number, constant: number): string {
    let factor = coeff === 1 ? 'x' : `${coeff}x`
    if (constant > 0) {
      factor += `+${constant}`
    } else if (constant < 0) {
      factor += constant.toString()
    }
    return factor
  }

  private formatSign(value: number): string {
    if (value > 0) {
      return `+${value}`
    } else if (value < 0) {
      return value.toString()
    } else {
      return ''
    }
  }

  private generateDistractors(correctA: number, correctP: number, correctQ: number, factorsInfo?: any): string[] {
    const distractors = new Set<string>()
    const correct = this.formatFactors(correctA, correctP, correctQ, factorsInfo)

    if (correctA === 1) {
      // กรณีง่าย: ใช้วิธีเดิม
      if (correctP > 0 && correctQ > 0) {
        distractors.add(this.formatFactors(correctA, -correctP, correctQ))
        distractors.add(this.formatFactors(correctA, correctP, -correctQ))
      } else if (correctP < 0 && correctQ < 0) {
        distractors.add(this.formatFactors(correctA, -correctP, correctQ))
        distractors.add(this.formatFactors(correctA, correctP, -correctQ))
      } else {
        distractors.add(this.formatFactors(correctA, -correctP, -correctQ))
      }

      const c = correctP * correctQ
      const factors = this.findFactorPairs(Math.abs(c))
      
      for (const [f1, f2] of factors) {
        if (f1 !== Math.abs(correctP) || f2 !== Math.abs(correctQ)) {
          const sign1 = Math.random() < 0.5 ? 1 : -1
          const sign2 = c < 0 ? -sign1 : sign1
          distractors.add(this.formatFactors(correctA, sign1 * f1, sign2 * f2))
          
          if (distractors.size >= 3) break
        }
      }
    } else if (factorsInfo && typeof factorsInfo === 'object') {
      // กรณีปานกลางและยาก: สร้าง distractors สำหรับ (a1x+m)(a2x+n)
      const { a1, a2, m, n } = factorsInfo
      
      // ตัวลวงแบบที่ 1: สลับเครื่องหมาย constant
      distractors.add(`(${this.formatComplexFactor(a1, -m)})(${this.formatComplexFactor(a2, n)})`)
      distractors.add(`(${this.formatComplexFactor(a1, m)})(${this.formatComplexFactor(a2, -n)})`)
      
      // ตัวลวงแบบที่ 2: สลับ coefficients
      distractors.add(`(${this.formatComplexFactor(a2, m)})(${this.formatComplexFactor(a1, n)})`)
      
      // ตัวลวงแบบที่ 3: factor ออกตัวร่วม (วิธีผิดที่หลายคนทำ)
      if (correctA > 1) {
        distractors.add(`${correctA}(x${this.formatSign(Math.round(m/a1))})(x${this.formatSign(Math.round(n/a2))})`)
      }
    }

    // ตัวลวงเพิ่มเติมหากยังไม่ครบ
    while (distractors.size < 3) {
      const randomP = Math.floor(Math.random() * 6) + 1
      const randomQ = Math.floor(Math.random() * 6) + 1
      const randomSignP = Math.random() < 0.5 ? 1 : -1
      const randomSignQ = Math.random() < 0.5 ? 1 : -1
      
      const distractor = this.formatFactors(correctA, randomSignP * randomP, randomSignQ * randomQ, factorsInfo)
      if (distractor !== correct) {
        distractors.add(distractor)
      }
    }

    return Array.from(distractors).slice(0, 3)
  }

  private findFactorPairs(n: number): [number, number][] {
    const pairs: [number, number][] = []
    for (let i = 1; i <= Math.sqrt(n); i++) {
      if (n % i === 0) {
        pairs.push([i, n / i])
      }
    }
    return pairs
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  // ฟังก์ชันเช็คคำตอบแบบยืดหยุ่น - เช็คทั้ง 2 แบบ (x+a)(x+b) และ (x+b)(x+a)
  private createAnswerChecker(correctAnswer: string, a: number, p: number, q: number, factorsInfo?: any): (answer: string) => boolean {
    if (a === 1) {
      // กรณีง่าย: เช็คทั้ง 2 แบบและรูปแบบคูณ -1 ทั้งสองวงเล็บ
      const correctOption1 = this.formatFactors(a, p, q)
      const correctOption2 = this.formatFactors(a, q, p)
      const negOption1 = `(${this.formatComplexFactor(-1, -p)})(${this.formatComplexFactor(-1, -q)})`
      const negOption2 = `(${this.formatComplexFactor(-1, -q)})(${this.formatComplexFactor(-1, -p)})`
      
      return (answer: string) => {
        return (
          answer === correctOption1 ||
          answer === correctOption2 ||
          answer === negOption1 ||
          answer === negOption2
        )
      }
    } else if (factorsInfo && typeof factorsInfo === 'object') {
      // กรณีปานกลางและยาก: เช็คทั้ง 2 แบบ และรูปแบบคูณ -1 ทั้งสองวงเล็บ
      const { a1, a2, m, n } = factorsInfo
      
      const correctOption1 = `(${this.formatComplexFactor(a1, m)})(${this.formatComplexFactor(a2, n)})`
      const correctOption2 = `(${this.formatComplexFactor(a2, n)})(${this.formatComplexFactor(a1, m)})`
      const negOption1 = `(${this.formatComplexFactor(-a1, -m)})(${this.formatComplexFactor(-a2, -n)})`
      const negOption2 = `(${this.formatComplexFactor(-a2, -n)})(${this.formatComplexFactor(-a1, -m)})`
      
      return (answer: string) => {
        return (
          answer === correctOption1 ||
          answer === correctOption2 ||
          answer === negOption1 ||
          answer === negOption2
        )
      }
    } else {
      // fallback
      return (answer: string) => {
        return answer === correctAnswer
      }
    }
  }

  // ===== สำหรับการแก้สมการพหุนาม =====
  private generateEquationQuestion(difficulty: 'easy' | 'medium' | 'hard'): Question {
    if (difficulty === 'easy') {
      // สมการเชิงเส้น: ax + b = c
      const a = Math.floor(Math.random() * 9) + 1 // 1-9
      const x = Math.floor(Math.random() * 20) + 1 // คำตอบ 1-20
      const b = Math.floor(Math.random() * 20) - 10 // -10 ถึง 9
      const c = a * x + b

      const expression = `${a === 1 ? '' : a}x${b >= 0 ? '+' + b : b} = ${c}`
      const correctAnswer = x.toString()

      // สร้างตัวเลือกผิดที่ไม่ซ้ำกัน
      const distractors = new Set<string>()
      
      // เพิ่มตัวเลือกผิดแบบต่างๆ
      const possibleDistractors = [
        (x + Math.floor(Math.random() * 5) + 1).toString(),
        (x - Math.floor(Math.random() * 5) - 1).toString(),
        (Math.floor(c / a) + (c % a !== 0 ? 1 : 0)).toString(), // ค่าผิดจากการหารไม่ลงตัว
        (x + 1).toString(),
        (x - 1).toString(),
        (x + 2).toString(),
        (x - 2).toString(),
        Math.floor(c / a).toString(), // หารไม่ดูเศษ
        (2 * x).toString(), // คูณด้วย 2
        Math.abs(x - Math.floor(Math.random() * 10)).toString()
      ]
      
      // เลือกตัวเลือกที่ไม่ซ้ำกับคำตอบที่ถูก
      for (const distractor of possibleDistractors) {
        if (distractor !== correctAnswer && distractors.size < 3) {
          distractors.add(distractor)
        }
      }
      
      // เติมตัวเลือกเพิ่มหากยังไม่ครบ
      while (distractors.size < 3) {
        const randomDistractor = (Math.floor(Math.random() * 30) + 1).toString()
        if (randomDistractor !== correctAnswer) {
          distractors.add(randomDistractor)
        }
      }
      
      const distractorArray = Array.from(distractors)

      return {
        expression: `แก้สมการ: ${expression}`,
        correctAnswer,
        choices: this.shuffleArray([correctAnswer, ...distractorArray]),
        a: 0, b: 0, c: 0
      }
    } else {
      // สมการกำลังสอง: x² + bx + c = 0
      const p = Math.floor(Math.random() * 6) + 1 // รากที่ 1
      const q = Math.floor(Math.random() * 6) + 1 // รากที่ 2
      
      // สุ่มเครื่องหมายรากบางครั้ง
      const root1 = Math.random() < 0.3 ? -p : p
      const root2 = Math.random() < 0.3 ? -q : q
      const actualB = -(root1 + root2)
      const actualC = root1 * root2

      const expression = `x²${actualB >= 0 ? '+' + actualB : actualB}x${actualC >= 0 ? '+' + actualC : actualC} = 0`
      
      // จัดเรียงรากเพื่อให้คำตอบมีรูปแบบเดียวกัน
      const sortedRoots = [root1, root2].sort((a, b) => a - b)
      const correctAnswer = `x = ${sortedRoots[0]}, ${sortedRoots[1]}`

      // สร้างตัวเลือกผิดที่ไม่ซ้ำกัน
      const distractors = []
      const possibleDistractors = [
        `x = ${sortedRoots[0] + 1}, ${sortedRoots[1] + 1}`, // เพิ่มทั้งสองราก
        `x = ${sortedRoots[0] - 1}, ${sortedRoots[1] - 1}`, // ลดทั้งสองราก
        `x = ${Math.abs(sortedRoots[0])}, ${Math.abs(sortedRoots[1])}`, // ทำให้เป็นบวกทั้งคู่
        `x = ${-sortedRoots[0]}, ${-sortedRoots[1]}`, // เปลี่ยนเครื่องหมายทั้งคู่
        `x = ${sortedRoots[1]}, ${sortedRoots[0]}`, // สลับตำแหน่ง (ถ้าต่างกัน)
        `x = ${sortedRoots[0]}, ${sortedRoots[0]}`, // ใช้รากเดียวกัน
        `x = ${sortedRoots[0] + 2}, ${sortedRoots[1] - 1}`, // เพิ่ม/ลดแบบไม่สมมาตร
      ]

      // เลือกตัวเลือกที่ไม่ซ้ำกับคำตอบที่ถูก
      for (const distractor of possibleDistractors) {
        if (distractor !== correctAnswer && distractors.length < 3) {
          distractors.push(distractor)
        }
      }

      // เติมตัวเลือกเพิ่มหากยังไม่ครบ
      while (distractors.length < 3) {
        const randomRoot1 = Math.floor(Math.random() * 10) - 5 // -5 ถึง 4
        const randomRoot2 = Math.floor(Math.random() * 10) - 5 // -5 ถึง 4
        const sortedRandomRoots = [randomRoot1, randomRoot2].sort((a, b) => a - b)
        const randomDistractor = `x = ${sortedRandomRoots[0]}, ${sortedRandomRoots[1]}`
        
        if (randomDistractor !== correctAnswer && !distractors.includes(randomDistractor)) {
          distractors.push(randomDistractor)
        }
      }

      return {
        expression: `แก้สมการ: ${expression}`,
        correctAnswer,
        choices: this.shuffleArray([correctAnswer, ...distractors.slice(0, 3)]),
        a: 0, b: 0, c: 0
      }
    }
  }

  // ===== สำหรับการคำนวณจำนวนเต็ม =====
  private generateIntegerQuestion(difficulty: 'easy' | 'medium' | 'hard'): Question {
    const operations = ['+', '-', '×', '÷']
    const operation = operations[Math.floor(Math.random() * operations.length)]
    
    let num1: number, num2: number, correctAnswer: number, expression: string

    if (difficulty === 'easy') {
      // ตัวเลข 1-20
      num1 = Math.floor(Math.random() * 20) + 1
      num2 = Math.floor(Math.random() * 20) + 1
    } else if (difficulty === 'medium') {
      // ตัวเลข 1-100
      num1 = Math.floor(Math.random() * 100) + 1
      num2 = Math.floor(Math.random() * 100) + 1
    } else {
      // ตัวเลข 1-500
      num1 = Math.floor(Math.random() * 500) + 1
      num2 = Math.floor(Math.random() * 500) + 1
    }

    switch (operation) {
      case '+':
        correctAnswer = num1 + num2
        expression = `${num1} + ${num2}`
        break
      case '-':
        // ให้ผลลัพธ์เป็นบวกเสมอ
        if (num1 < num2) [num1, num2] = [num2, num1]
        correctAnswer = num1 - num2
        expression = `${num1} - ${num2}`
        break
      case '×':
        // ลดขนาดตัวเลขสำหรับการคูณ
        num1 = Math.floor(num1 / (difficulty === 'hard' ? 10 : 5)) + 1
        num2 = Math.floor(num2 / (difficulty === 'hard' ? 10 : 5)) + 1
        correctAnswer = num1 * num2
        expression = `${num1} × ${num2}`
        break
      case '÷':
        // ทำให้หารลงตัว
        correctAnswer = Math.floor(Math.random() * 10) + 2
        num1 = num2 * correctAnswer
        expression = `${num1} ÷ ${num2}`
        break
      default:
        correctAnswer = 0
        expression = ''
    }

    // สร้างตัวเลือกผิด
    const distractors = [
      correctAnswer + Math.floor(Math.random() * 10) + 1,
      correctAnswer - Math.floor(Math.random() * 10) - 1,
      Math.floor(correctAnswer * 1.5)
    ].filter(d => d !== correctAnswer && d > 0).slice(0, 3)

    return {
      expression: `${expression} = ?`,
      correctAnswer: correctAnswer.toString(),
      choices: this.shuffleArray([correctAnswer.toString(), ...distractors.map(d => d.toString())]),
      a: 0, b: 0, c: 0
    }
  }

  // ===== สำหรับการคำนวณเศษส่วน =====
  private generateFractionQuestion(difficulty: 'easy' | 'medium' | 'hard'): Question {
    if (difficulty === 'easy') {
      // บวกลบเศษส่วน - ตัวส่วนเท่ากัน (ง่าย)
      return this.generateFractionAddSubEasy()
    } else if (difficulty === 'medium') {
      // บวกลบเศษส่วน - ตัวส่วนไม่เท่ากัน (ยาก) หรือ คูณ
      const operationType = Math.random() < 0.5 ? 'add_sub_hard' : 'multiply'
      return operationType === 'add_sub_hard' 
        ? this.generateFractionAddSubHard()
        : this.generateFractionMultiply()
    } else {
      // หาร (ยากที่สุด)
      return this.generateFractionDivide()
    }
  }

  // บวกลบเศษส่วน - ตัวส่วนเท่ากัน
  private generateFractionAddSubEasy(): Question {
    const operation = Math.random() < 0.5 ? '+' : '-'
    const den = [2, 3, 4, 5, 6, 8][Math.floor(Math.random() * 6)] // ตัวส่วนที่ใช้ง่าย
    
    let num1 = Math.floor(Math.random() * (den - 1)) + 1 // 1 ถึง den-1
    let num2 = Math.floor(Math.random() * (den - 1)) + 1
    
    // ทำให้ผลลัพธ์เป็นบวกในการลบ
    if (operation === '-' && num1 < num2) {
      [num1, num2] = [num2, num1]
    }

    let resultNum: number
    if (operation === '+') {
      resultNum = num1 + num2
    } else {
      resultNum = num1 - num2
    }

    // ลดเศษส่วน
    const gcd = this.findGCD(resultNum, den)
    resultNum /= gcd
    const resultDen = den / gcd

    const expression = `${this.formatFraction(num1, den)} ${operation} ${this.formatFraction(num2, den)}`
    const correctAnswer = resultDen === 1 ? resultNum.toString() : this.formatFraction(resultNum, resultDen)

    return this.createFractionChoices(expression, correctAnswer, resultNum, resultDen)
  }

  // บวกลบเศษส่วน - ตัวส่วนไม่เท่ากัน
  private generateFractionAddSubHard(): Question {
    const operation = Math.random() < 0.5 ? '+' : '-'
    
    // เลือกตัวส่วนที่ต่างกัน
    const denominators = [2, 3, 4, 5, 6, 8, 9, 10, 12]
    const den1 = denominators[Math.floor(Math.random() * denominators.length)]
    let den2 = denominators[Math.floor(Math.random() * denominators.length)]
    while (den2 === den1) {
      den2 = denominators[Math.floor(Math.random() * denominators.length)]
    }

    const num1 = Math.floor(Math.random() * (den1 - 1)) + 1
    const num2 = Math.floor(Math.random() * (den2 - 1)) + 1

    // คำนวณผลลัพธ์
    let resultNum: number, resultDen: number
    if (operation === '+') {
      resultNum = num1 * den2 + num2 * den1
      resultDen = den1 * den2
    } else {
      // ทำให้ผลลัพธ์เป็นบวก
      if (num1 * den2 < num2 * den1) {
        resultNum = num2 * den1 - num1 * den2
        resultDen = den1 * den2
      } else {
        resultNum = num1 * den2 - num2 * den1
        resultDen = den1 * den2
      }
    }

    // ลดเศษส่วน
    const gcd = this.findGCD(resultNum, resultDen)
    resultNum /= gcd
    resultDen /= gcd

    const expression = `${this.formatFraction(num1, den1)} ${operation} ${this.formatFraction(num2, den2)}`
    const correctAnswer = resultDen === 1 ? resultNum.toString() : this.formatFraction(resultNum, resultDen)

    return this.createFractionChoices(expression, correctAnswer, resultNum, resultDen)
  }

  // คูณเศษส่วน
  private generateFractionMultiply(): Question {
    const denominators = [2, 3, 4, 5, 6, 8]
    const den1 = denominators[Math.floor(Math.random() * denominators.length)]
    const den2 = denominators[Math.floor(Math.random() * denominators.length)]
    
    const num1 = Math.floor(Math.random() * (den1 - 1)) + 1
    const num2 = Math.floor(Math.random() * (den2 - 1)) + 1

    let resultNum = num1 * num2
    let resultDen = den1 * den2

    // ลดเศษส่วน
    const gcd = this.findGCD(resultNum, resultDen)
    resultNum /= gcd
    resultDen /= gcd

    const expression = `${this.formatFraction(num1, den1)} \\times ${this.formatFraction(num2, den2)}`
    const correctAnswer = resultDen === 1 ? resultNum.toString() : this.formatFraction(resultNum, resultDen)

    return this.createFractionChoices(expression, correctAnswer, resultNum, resultDen)
  }

  // หารเศษส่วน
  private generateFractionDivide(): Question {
    const denominators = [2, 3, 4, 5, 6]
    const den1 = denominators[Math.floor(Math.random() * denominators.length)]
    const den2 = denominators[Math.floor(Math.random() * denominators.length)]
    
    const num1 = Math.floor(Math.random() * (den1 - 1)) + 1
    const num2 = Math.floor(Math.random() * (den2 - 1)) + 1

    // หารเศษส่วน = คูณกับส่วนกลับ
    let resultNum = num1 * den2
    let resultDen = den1 * num2

    // ลดเศษส่วน
    const gcd = this.findGCD(resultNum, resultDen)
    resultNum /= gcd
    resultDen /= gcd

    const expression = `${this.formatFraction(num1, den1)} \\div ${this.formatFraction(num2, den2)}`
    const correctAnswer = resultDen === 1 ? resultNum.toString() : this.formatFraction(resultNum, resultDen)

    return this.createFractionChoices(expression, correctAnswer, resultNum, resultDen)
  }

  // ฟังก์ชันสร้างตัวเลือกสำหรับเศษส่วน
  private createFractionChoices(expression: string, correctAnswer: string, resultNum: number, resultDen: number): Question {
    // สร้างตัวเลือกผิดที่ไม่ซ้ำกัน
    const distractors = new Set<string>()
    
    const possibleDistractors = [
      this.formatFraction(resultNum + 1, resultDen),
      this.formatFraction(resultNum, Math.max(1, resultDen + 1)),
      this.formatFraction(Math.max(1, resultNum - 1), resultDen),
      this.formatFraction(resultNum, Math.max(1, resultDen - 1)),
      this.formatFraction(resultNum * 2, resultDen),
      this.formatFraction(resultNum, Math.max(1, resultDen * 2)),
      this.formatFraction(resultNum + resultDen, resultDen), // เพิ่มตัวเศษด้วยตัวส่วน
      this.formatFraction(Math.max(1, resultNum + 2), resultDen),
      this.formatFraction(Math.max(1, resultNum - 2), resultDen)
    ]
    
    // เลือกตัวเลือกที่ไม่ซ้ำกับคำตอบที่ถูก
    for (const distractor of possibleDistractors) {
      if (distractor !== correctAnswer && distractors.size < 3) {
        distractors.add(distractor)
      }
    }
    
    // เติมตัวเลือกเพิ่มหากยังไม่ครับ
    while (distractors.size < 3) {
      const randomNum = Math.floor(Math.random() * 10) + 1
      const randomDen = Math.floor(Math.random() * 10) + 1
      const randomDistractor = this.formatFraction(randomNum, randomDen)
      if (randomDistractor !== correctAnswer) {
        distractors.add(randomDistractor)
      }
    }
    
    const distractorArray = Array.from(distractors)

    return {
      expression: `${expression} = ?`,
      correctAnswer,
      choices: this.shuffleArray([correctAnswer, ...distractorArray]),
      a: 0, b: 0, c: 0
    }
  }

  // ฟังก์ชันหา GCD สำหรับ 2 ตัวเลข
  private findGCD(a: number, b: number): number {
    while (b !== 0) {
      const temp = b
      b = a % b
      a = temp
    }
    return a
  }

  // ฟังก์ชันหา GCD สำหรับ 3 ตัวเลข
  private findGCD3(a: number, b: number, c: number): number {
    return this.findGCD(this.findGCD(Math.abs(a), Math.abs(b)), Math.abs(c))
  }

  // ฟังก์ชันแสดงเศษส่วนแบบ LaTeX
  private formatFraction(numerator: number, denominator: number): string {
    // ลดเศษส่วนก่อนแสดงผล
    const gcd = this.findGCD(Math.abs(numerator), Math.abs(denominator))
    const num = numerator / gcd
    const den = denominator / gcd
    
    // ถ้าตัวส่วนเป็น 1 ให้แสดงเป็นจำนวนเต็ม
    if (den === 1) {
      return num.toString()
    }
    
    // ใช้รูปแบบ LaTeX สำหรับเศษส่วน
    return `\\frac{${num}}{${den}}`
  }

  // ===== สำหรับเลขยกกำลัง =====
  private generatePowerQuestion(difficulty: 'easy' | 'medium' | 'hard'): Question {
    let base: number, exponent: number, correctAnswer: number
    let attempts = 0
    const maxAttempts = 10

    do {
      attempts++

      if (difficulty === 'easy') {
        // ฐาน 2-5 กำลัง 2-4 (เลขยกกำลังแท้ๆ)
        base = [2, 3, 4, 5][Math.floor(Math.random() * 4)]
        exponent = [2, 3, 4][Math.floor(Math.random() * 3)]
        correctAnswer = Math.pow(base, exponent)
      } else if (difficulty === 'medium') {
        // ฐาน 2-8 กำลัง 2-5 หรือ ฐานลบ กำลัง 2-3
        const useNegative = Math.random() < 0.4
        if (useNegative) {
          base = -[2, 3, 4, 5][Math.floor(Math.random() * 4)]
          exponent = [2, 3][Math.floor(Math.random() * 2)]
        } else {
          base = [2, 3, 4, 5, 6, 7, 8][Math.floor(Math.random() * 7)]
          exponent = [2, 3, 4, 5][Math.floor(Math.random() * 4)]
        }
        correctAnswer = Math.pow(base, exponent)
      } else {
        // ยาก: ฐาน 2-10 กำลัง 3-6 หรือ กำลัง 0, 1
        if (Math.random() < 0.6) {
          // กำลังสูง
          base = [2, 3, 4, 5, 6][Math.floor(Math.random() * 5)]
          exponent = [3, 4, 5, 6][Math.floor(Math.random() * 4)]
          correctAnswer = Math.pow(base, exponent)
        } else {
          // กำลัง 0 หรือ 1
          base = [2, 3, 4, 5, 6, 7, 8, 9, 10][Math.floor(Math.random() * 9)]
          exponent = [0, 1][Math.floor(Math.random() * 2)]
          correctAnswer = Math.pow(base, exponent)
        }
      }

      // ตรวจสอบว่าผลลัพธ์เป็นจำนวนจริงและไม่ใช่ Infinity หรือ NaN
      if (!isFinite(correctAnswer) || isNaN(correctAnswer)) {
        continue
      }

      // ตรวจสอบว่าผลลัพธ์ไม่ใหญ่เกินไป (เลขยกกำลังแท้ๆ ไม่ควรเกินหลักล้าน)
      if (Math.abs(correctAnswer) > 1000000) {
        continue
      }

      // ตรวจสอบว่าผลลัพธ์เป็นจำนวนเต็มบวก (ยกเว้นเลข 0 และ 1)
      if (correctAnswer < 0 || (correctAnswer === 0 && exponent > 0) || (correctAnswer === 1 && exponent !== 0)) {
        continue
      }

    } while (attempts < maxAttempts)

    // ถ้าไม่สามารถสร้างได้ ให้ใช้ค่าดีฟอลต์
    if (attempts >= maxAttempts) {
      base = 2
      exponent = 3
      correctAnswer = 8
    }

    const expression = base < 0 ? `(${base})^{${exponent}}` : `${base}^{${exponent}}`

    // สร้างตัวเลือกผิดแบบเลขยกกำลังแท้ๆ
    const distractors = new Set<string>()

    const possibleDistractors = [
      // ผิดพลาดทั่วไป: คูณแทนยกกำลัง
      (base * exponent).toString(),
      // ผิดพลาดทั่วไป: บวกแทนยกกำลัง
      (base + exponent).toString(),
      // ยกกำลังผิดพลาด: เพิ่ม/ลดเลขชี้กำลัง
      Math.pow(base, exponent + 1).toString(),
      Math.pow(base, Math.max(1, exponent - 1)).toString(),
      // ยกกำลังผิดพลาด: เปลี่ยนฐาน
      Math.pow(base + 1, exponent).toString(),
      Math.pow(base - 1, exponent).toString(),
      // ผิดพลาด: ใช้ฐานเป็นเลขชี้กำลัง
      Math.pow(exponent, base).toString(),
      // ผิดพลาด: รากที่สองแทนยกกำลัง
      Math.pow(base, 1/exponent).toString()
    ]

    // เลือกตัวเลือกที่ไม่ซ้ำกับคำตอบที่ถูก
    for (const distractor of possibleDistractors) {
      const numDistractor = parseFloat(distractor)
      if (!isNaN(numDistractor) && isFinite(numDistractor) && numDistractor > 0 &&
          distractor !== correctAnswer.toString() && distractors.size < 3) {
        distractors.add(distractor)
      }
    }

    // เติมตัวเลือกเพิ่มหากยังไม่ครบ
    while (distractors.size < 3) {
      const randomBase = [2, 3, 4, 5, 6][Math.floor(Math.random() * 5)]
      const randomExponent = [2, 3, 4][Math.floor(Math.random() * 3)]
      const randomDistractor = Math.pow(randomBase, randomExponent).toString()
      if (randomDistractor !== correctAnswer.toString()) {
        distractors.add(randomDistractor)
      }
    }

    return {
      expression: `${expression} = ?`,
      correctAnswer: correctAnswer.toString(),
      choices: this.shuffleArray([correctAnswer.toString(), ...Array.from(distractors)]),
      a: 0, b: 0, c: 0
    }
  }

  // ===== สำหรับรากที่ n =====
  private generateRootQuestion(difficulty: 'easy' | 'medium' | 'hard'): Question {
    const rootType = [2, 3, 4][Math.floor(Math.random() * 3)] // รากที่ 2, 3, หรือ 4
    let baseNumber: number
    let correctAnswer: number
    let attempts = 0
    const maxAttempts = 10

    do {
      attempts++

      if (rootType === 2) { // รากที่ 2
        if (difficulty === 'easy') {
          // ง่าย: กำลังสองที่สมบูรณ์ไม่เกิน 100
          const perfectSquares = [4, 9, 16, 25, 36, 49, 64, 81, 100]
          baseNumber = perfectSquares[Math.floor(Math.random() * perfectSquares.length)]
        } else if (difficulty === 'medium') {
          // ปานกลาง: กำลังสองที่สมบูรณ์ไม่เกิน 400
          const perfectSquares = [121, 144, 169, 196, 225, 256, 289, 324, 361, 400]
          baseNumber = perfectSquares[Math.floor(Math.random() * perfectSquares.length)]
        } else {
          // ยาก: กำลังสองที่สมบูรณ์ไม่เกิน 1000
          const perfectSquares = [441, 484, 529, 576, 625, 676, 729, 784, 841, 900, 961]
          baseNumber = perfectSquares[Math.floor(Math.random() * perfectSquares.length)]
        }
      } else if (rootType === 3) { // รากที่ 3
        if (difficulty === 'easy') {
          // ง่าย: กำลังสามที่สมบูรณ์ไม่เกิน 64
          const perfectCubes = [8, 27, 64]
          baseNumber = perfectCubes[Math.floor(Math.random() * perfectCubes.length)]
        } else if (difficulty === 'medium') {
          // ปานกลาง: กำลังสามที่สมบูรณ์ไม่เกิน 216
          const perfectCubes = [125, 216]
          baseNumber = perfectCubes[Math.floor(Math.random() * perfectCubes.length)]
        } else {
          // ยาก: กำลังสามที่สมบูรณ์ไม่เกิน 1000
          const perfectCubes = [343, 512, 729, 1000]
          baseNumber = perfectCubes[Math.floor(Math.random() * perfectCubes.length)]
        }
      } else { // รากที่ 4
        if (difficulty === 'easy') {
          // ง่าย: กำลังสี่ที่สมบูรณ์ไม่เกิน 81
          const perfectFourths = [16, 81]
          baseNumber = perfectFourths[Math.floor(Math.random() * perfectFourths.length)]
        } else if (difficulty === 'medium') {
          // ปานกลาง: กำลังสี่ที่สมบูรณ์ไม่เกิน 625
          const perfectFourths = [256, 625]
          baseNumber = perfectFourths[Math.floor(Math.random() * perfectFourths.length)]
        } else {
          // ยาก: กำลังสี่ที่สมบูรณ์ไม่เกิน 1000
          const perfectFourths = [16, 81, 256, 625]
          baseNumber = perfectFourths[Math.floor(Math.random() * perfectFourths.length)]
        }
      }

      correctAnswer = Math.round(Math.pow(baseNumber, 1/rootType))

      // ตรวจสอบว่าเป็นกำลังสมบูรณ์จริง (เพื่อป้องกัน floating point error)
      const checkResult = Math.pow(correctAnswer, rootType)
      if (Math.abs(checkResult - baseNumber) > 0.0001) {
        continue
      }

      // ตรวจสอบว่าผลลัพธ์เป็นจำนวนบวก
      if (correctAnswer <= 0) {
        continue
      }

    } while (attempts < maxAttempts)

    // ถ้าไม่สามารถสร้างได้ ให้ใช้ค่าดีฟอลต์
    if (attempts >= maxAttempts) {
      baseNumber = 4
      correctAnswer = 2
    }

    // สร้างตัวเลือกผิด
    const distractors = new Set<string>()

    const possibleDistractors = [
      (correctAnswer + 1).toString(),
      (correctAnswer - 1).toString(),
      Math.ceil(correctAnswer * 1.5).toString(),
      Math.floor(correctAnswer / 1.5).toString(),
      Math.floor(Math.sqrt(baseNumber / 2)).toString(),
      Math.ceil(Math.sqrt(baseNumber * 2)).toString(),
      (correctAnswer * 2).toString()
    ]

    // เลือกตัวเลือกที่ไม่ซ้ำกับคำตอบที่ถูก
    for (const distractor of possibleDistractors) {
      const numDistractor = parseInt(distractor)
      if (!isNaN(numDistractor) && numDistractor > 0 &&
          distractor !== correctAnswer.toString() && distractors.size < 3) {
        distractors.add(distractor)
      }
    }

    // เติมตัวเลือกเพิ่มหากยังไม่ครบ
    while (distractors.size < 3) {
      const randomDistractor = (Math.floor(Math.random() * 20) + 1).toString()
      if (randomDistractor !== correctAnswer.toString()) {
        distractors.add(randomDistractor)
      }
    }

    return {
      expression: rootType === 2 ? `\\sqrt{${baseNumber}} = ?` : `\\sqrt[${rootType}]{${baseNumber}} = ?`,
      correctAnswer: correctAnswer.toString(),
      choices: this.shuffleArray([correctAnswer.toString(), ...Array.from(distractors)]),
      a: 0, b: 0, c: 0
    }
  }

  // ===== สำหรับการหาค่าฟังก์ชัน =====
  private generateFunctionQuestion(difficulty: 'easy' | 'medium' | 'hard'): Question {
    let a: number, b: number, c: number, x: number, correctAnswer: number, functionExpr: string, questionExpr: string
    
    if (difficulty === 'easy') {
      // ง่าย: ฟังก์ชันเชิงเส้น f(x) = ax + b
      a = Math.floor(Math.random() * 4) + 1 // 1-4 (เล็กกว่าเดิม)
      b = Math.floor(Math.random() * 8) - 4 // -4 ถึง 3
      x = Math.floor(Math.random() * 4) + 1 // 1-4
      
      correctAnswer = a * x + b
      functionExpr = `f(x) = ${a === 1 ? '' : a}x${b >= 0 ? '+' + b : b}`
      questionExpr = `f(${x}) = ?`
    } else if (difficulty === 'medium') {
      // ปานกลาง: ฟังก์ชันผสม (เชิงเส้น + กำลังสอง)
      const isLinear = Math.random() < 0.5 // สุ่มระหว่างเชิงเส้นและกำลังสอง
      
      if (isLinear) {
        // เชิงเส้น f(x) = ax + b (ค่า a, b ใหญ่ขึ้น)
        a = Math.floor(Math.random() * 6) + 3 // 3-8
        b = Math.floor(Math.random() * 12) - 6 // -6 ถึง 5
        x = Math.floor(Math.random() * 3) + 1 // 1-3
        
        correctAnswer = a * x + b
        functionExpr = `f(x) = ${a}x${b >= 0 ? '+' + b : b}`
        questionExpr = `f(${x}) = ?`
      } else {
        // กำลังสอง f(x) = ax² + b
        a = Math.floor(Math.random() * 3) + 1 // 1-3
        b = Math.floor(Math.random() * 8) - 4 // -4 ถึง 3
        x = Math.floor(Math.random() * 3) + 1 // 1-3
        
        correctAnswer = a * x * x + b
        functionExpr = `f(x) = ${a === 1 ? '' : a}x^{2}${b >= 0 ? '+' + b : b}`
        questionExpr = `f(${x}) = ?`
      }
    } else {
      // ยาก: ฟังก์ชันกำลังสอง f(x) = ax² + bx + c
      a = Math.floor(Math.random() * 3) + 1 // 1-3
      b = Math.floor(Math.random() * 5) - 2 // -2 ถึง 2
      c = Math.floor(Math.random() * 5) - 2 // -2 ถึง 2
      x = Math.floor(Math.random() * 3) + 1 // 1-3
      
      correctAnswer = a * x * x + b * x + c
      // สร้าง expression ให้ถูกต้อง
      let expr = `f(x) = ${a === 1 ? '' : a}x^{2}`
      if (b !== 0) {
        expr += `${b > 0 ? '+' : ''}${b === 1 ? '' : b === -1 ? '-' : b}x`
      }
      if (c !== 0) {
        expr += `${c > 0 ? '+' : ''}${c}`
      }
      functionExpr = expr
      questionExpr = `f(${x}) = ?`
    }
    
    // สร้างตัวเลือกผิด
    const distractors = new Set<string>()
    
    const possibleDistractors = [
      (correctAnswer + Math.floor(Math.random() * 10) + 1).toString(),
      (correctAnswer - Math.floor(Math.random() * 10) - 1).toString(),
      (a * x + b).toString(), // ลืมยกกำลังสอง
      (a + b).toString(), // ผิดพลาดพื้นฐาน
      (correctAnswer * 2).toString(),
      (a * (x + 1) + b).toString(), // แทน x ผิด
      (correctAnswer + x).toString()
    ]
    
    // เลือกตัวเลือกที่ไม่ซ้ำกับคำตอบที่ถูก
    for (const distractor of possibleDistractors) {
      if (distractor !== correctAnswer.toString() && distractors.size < 3) {
        distractors.add(distractor)
      }
    }
    
    // เติมตัวเลือกเพิ่มหากยังไม่ครบ
    while (distractors.size < 3) {
      const randomDistractor = (Math.floor(Math.random() * 50) + 1).toString()
      if (randomDistractor !== correctAnswer.toString()) {
        distractors.add(randomDistractor)
      }
    }

    return {
      expression: `${functionExpr}\\\\${questionExpr}`,
      correctAnswer: correctAnswer.toString(),
      choices: this.shuffleArray([correctAnswer.toString(), ...Array.from(distractors)]),
      a: 0, b: 0, c: 0
    }
  }

  // ===== สำหรับลำดับเลขคณิต =====
  private generateArithmeticSequenceQuestion(difficulty: 'easy' | 'medium' | 'hard'): Question {
    let a1: number, d: number, n: number
    
    if (difficulty === 'easy') {
      // ง่าย: พจน์แรกและส่วนต่างเป็นจำนวนเต็มบวกเล็กๆ
      a1 = Math.floor(Math.random() * 10) + 1 // 1-10
      d = Math.floor(Math.random() * 5) + 1   // 1-5
      n = Math.floor(Math.random() * 8) + 3   // 3-10 (หาพจน์ที่ n)
    } else if (difficulty === 'medium') {
      // ปานกลาง: อาจมีส่วนต่างลบ หรือค่าใหญ่ขึ้น
      a1 = Math.floor(Math.random() * 20) + 1 // 1-20
      d = Math.floor(Math.random() * 10) - 5  // -5 ถึง 4
      n = Math.floor(Math.random() * 12) + 5  // 5-16
    } else {
      // ยาก: ค่าใหญ่และซับซ้อน
      a1 = Math.floor(Math.random() * 50) + 1  // 1-50
      d = Math.floor(Math.random() * 20) - 10  // -10 ถึง 9
      n = Math.floor(Math.random() * 15) + 10  // 10-24
    }
    
    // คำนวณคำตอบ: an = a1 + (n-1)d
    const correctAnswer = a1 + (n - 1) * d
    
    // สร้างตัวเลือกผิด
    const distractors = new Set<string>()
    const possibleDistractors = [
      (a1 + n * d).toString(),           // ผิด: ใช้ nd แทน (n-1)d
      (a1 + (n + 1) * d).toString(),     // ผิด: ใช้ n+1 แทน n-1
      (a1 + (n - 2) * d).toString(),     // ผิด: ใช้ n-2 แทน n-1
      (correctAnswer + d).toString(),     // ผิด: เพิ่มอีก d
      (correctAnswer - d).toString(),     // ผิด: ลบ d
      (a1 * n + d).toString(),           // ผิด: คูณแทนบวก
      (correctAnswer + Math.floor(Math.random() * 10) + 1).toString()
    ]
    
    for (const distractor of possibleDistractors) {
      if (distractor !== correctAnswer.toString() && distractors.size < 3) {
        distractors.add(distractor)
      }
    }
    
    while (distractors.size < 3) {
      const randomDistractor = (correctAnswer + Math.floor(Math.random() * 20) - 10).toString()
      if (randomDistractor !== correctAnswer.toString()) {
        distractors.add(randomDistractor)
      }
    }

    return {
      expression: `ลำดับเลขคณิต: a_1 = ${a1}, d = ${d >= 0 ? '+' + d : d}. หา a_{${n}}`,
      correctAnswer: correctAnswer.toString(),
      choices: this.shuffleArray([correctAnswer.toString(), ...Array.from(distractors)]),
      a: 0, b: 0, c: 0
    }
  }

  // ===== สำหรับลำดับเรขาคณิต =====
  private generateGeometricSequenceQuestion(difficulty: 'easy' | 'medium' | 'hard'): Question {
    let a1: number, r: number, n: number
    
    if (difficulty === 'easy') {
      // ง่าย: อัตราส่วนเป็น 2, 3, 4 เพื่อให้คำนวณง่าย
      a1 = [1, 2, 3][Math.floor(Math.random() * 3)]
      r = [2, 3][Math.floor(Math.random() * 2)]
      n = Math.floor(Math.random() * 4) + 3  // 3-6
    } else if (difficulty === 'medium') {
      // ปานกลาง: อัตราส่วนหลากหลายขึ้น
      a1 = [1, 2, 3, 4, 5][Math.floor(Math.random() * 5)]
      r = [2, 3, 4, 5][Math.floor(Math.random() * 4)]
      n = Math.floor(Math.random() * 5) + 4  // 4-8
    } else {
      // ยาก: อัตราส่วนเศษส่วนหรือลบ
      a1 = [1, 2, 4, 8][Math.floor(Math.random() * 4)]
      if (Math.random() < 0.3) {
        // อัตราส่วนเศษส่วน
        r = [0.5, 1.5][Math.floor(Math.random() * 2)]
      } else {
        r = [2, 3, -2][Math.floor(Math.random() * 3)]
      }
      n = Math.floor(Math.random() * 6) + 4  // 4-9
    }
    
    // คำนวณคำตอบ: an = a1 × r^(n-1)
    const correctAnswer = a1 * Math.pow(r, n - 1)
    
    // ตรวจสอบว่าคำตอบเป็นจำนวนเต็ม
    if (!Number.isInteger(correctAnswer)) {
      return this.generateGeometricSequenceQuestion(difficulty)
    }
    
    // สร้างตัวเลือกผิด
    const distractors = new Set<string>()
    const possibleDistractors = [
      (a1 * Math.pow(r, n)).toString(),      // ผิด: ใช้ r^n แทน r^(n-1)
      (a1 * Math.pow(r, n - 2)).toString(),  // ผิด: ใช้ r^(n-2)
      (a1 + Math.pow(r, n - 1)).toString(),  // ผิด: บวกแทนคูณ
      (Math.pow(a1, n) * r).toString(),      // ผิด: ยกกำลัง a1
      (correctAnswer * r).toString(),        // ผิด: คูณอีกครั้ง
      (correctAnswer / r).toString(),        // ผิด: หาร r
    ].filter(d => Number.isInteger(parseFloat(d)) && parseFloat(d) > 0)
    
    for (const distractor of possibleDistractors) {
      if (distractor !== correctAnswer.toString() && distractors.size < 3) {
        distractors.add(distractor)
      }
    }
    
    while (distractors.size < 3) {
      const randomDistractor = Math.floor(correctAnswer * (0.5 + Math.random())).toString()
      if (randomDistractor !== correctAnswer.toString() && parseInt(randomDistractor) > 0) {
        distractors.add(randomDistractor)
      }
    }

    return {
      expression: `ลำดับเรขาคณิต: a_1 = ${a1}, r = ${r}. หา a_{${n}}`,
      correctAnswer: correctAnswer.toString(),
      choices: this.shuffleArray([correctAnswer.toString(), ...Array.from(distractors)]),
      a: 0, b: 0, c: 0
    }
  }

  // ===== สำหรับอนุกรมเลขคณิต =====
  private generateArithmeticSeriesQuestion(difficulty: 'easy' | 'medium' | 'hard'): Question {
    let a1: number, d: number, n: number
    
    if (difficulty === 'easy') {
      a1 = Math.floor(Math.random() * 10) + 1  // 1-10
      d = Math.floor(Math.random() * 5) + 1    // 1-5
      n = Math.floor(Math.random() * 8) + 3    // 3-10
    } else if (difficulty === 'medium') {
      a1 = Math.floor(Math.random() * 20) + 1  // 1-20
      d = Math.floor(Math.random() * 10) - 5   // -5 ถึง 4
      n = Math.floor(Math.random() * 12) + 5   // 5-16
    } else {
      a1 = Math.floor(Math.random() * 30) + 1   // 1-30
      d = Math.floor(Math.random() * 20) - 10   // -10 ถึง 9
      n = Math.floor(Math.random() * 15) + 10   // 10-24
    }
    
    // คำนวณคำตอบ: Sn = n/2 × (2a1 + (n-1)d)
    const correctAnswer = (n / 2) * (2 * a1 + (n - 1) * d)
    
    // ตรวจสอบว่าคำตอบเป็นจำนวนเต็ม
    if (!Number.isInteger(correctAnswer)) {
      return this.generateArithmeticSeriesQuestion(difficulty)
    }
    
    // สร้างตัวเลือกผิด
    const distractors = new Set<string>()
    const possibleDistractors = [
      (n * (2 * a1 + (n - 1) * d)).toString(),     // ผิด: ไม่หารด้วย 2
      ((n / 2) * (a1 + (n - 1) * d)).toString(),   // ผิด: ขาด a1 หนึ่งตัว
      ((n / 2) * (2 * a1 + n * d)).toString(),     // ผิด: ใช้ nd แทน (n-1)d
      (n * a1 + (n - 1) * d).toString(),          // ผิด: สูตรผิด
      (correctAnswer + a1).toString(),             // ผิด: เพิ่ม a1
      (correctAnswer - d).toString(),              // ผิด: ลบ d
    ].filter(d => Number.isInteger(parseFloat(d)) && parseFloat(d) > 0)
    
    for (const distractor of possibleDistractors) {
      if (distractor !== correctAnswer.toString() && distractors.size < 3) {
        distractors.add(distractor)
      }
    }
    
    while (distractors.size < 3) {
      const randomDistractor = Math.floor(correctAnswer * (0.5 + Math.random() * 1.5)).toString()
      if (randomDistractor !== correctAnswer.toString() && parseInt(randomDistractor) > 0) {
        distractors.add(randomDistractor)
      }
    }

    return {
      expression: `อนุกรมเลขคณิต: a_1 = ${a1}, d = ${d >= 0 ? '+' + d : d}, n = ${n}. หา S_{${n}}`,
      correctAnswer: correctAnswer.toString(),
      choices: this.shuffleArray([correctAnswer.toString(), ...Array.from(distractors)]),
      a: 0, b: 0, c: 0
    }
  }

  // ===== สำหรับอนุกรมเรขาคณิต =====
  private generateGeometricSeriesQuestion(difficulty: 'easy' | 'medium' | 'hard'): Question {
    let a1: number, r: number, n: number
    
    if (difficulty === 'easy') {
      a1 = [1, 2][Math.floor(Math.random() * 2)]
      r = [2, 3][Math.floor(Math.random() * 2)]
      n = Math.floor(Math.random() * 3) + 3  // 3-5
    } else if (difficulty === 'medium') {
      a1 = [1, 2, 3][Math.floor(Math.random() * 3)]
      r = [2, 3, 4][Math.floor(Math.random() * 3)]
      n = Math.floor(Math.random() * 4) + 4  // 4-7
    } else {
      a1 = [1, 2, 3, 4][Math.floor(Math.random() * 4)]
      r = [2, 3, 5][Math.floor(Math.random() * 3)]
      n = Math.floor(Math.random() * 5) + 5  // 5-9
    }
    
    // คำนวณคำตอบ: Sn = a1 × (r^n - 1) / (r - 1)
    const rPowN = Math.pow(r, n)
    const correctAnswer = a1 * (rPowN - 1) / (r - 1)
    
    // ตรวจสอบว่าคำตอบเป็นจำนวนเต็ม
    if (!Number.isInteger(correctAnswer)) {
      return this.generateGeometricSeriesQuestion(difficulty)
    }
    
    // สร้างตัวเลือกผิด
    const distractors = new Set<string>()
    const possibleDistractors = [
      (a1 * rPowN).toString(),                    // ผิด: ลืมลบ 1 และหาร (r-1)
      (a1 * (rPowN - 1)).toString(),              // ผิด: ลืมหาร (r-1)
      (a1 * (rPowN + 1) / (r - 1)).toString(),    // ผิด: บวก 1 แทนลบ 1
      ((rPowN - 1) / (r - 1)).toString(),         // ผิด: ขาด a1
      (correctAnswer * r).toString(),             // ผิด: คูณอีก r
      (correctAnswer + a1).toString(),            // ผิด: เพิ่ม a1
    ].filter(d => Number.isInteger(parseFloat(d)) && parseFloat(d) > 0)
    
    for (const distractor of possibleDistractors) {
      if (distractor !== correctAnswer.toString() && distractors.size < 3) {
        distractors.add(distractor)
      }
    }
    
    while (distractors.size < 3) {
      const randomDistractor = Math.floor(correctAnswer * (0.3 + Math.random() * 1.4)).toString()
      if (randomDistractor !== correctAnswer.toString() && parseInt(randomDistractor) > 0) {
        distractors.add(randomDistractor)
      }
    }

    return {
      expression: `อนุกรมเรขาคณิต: a_1 = ${a1}, r = ${r}, n = ${n}. หา S_{${n}}`,
      correctAnswer: correctAnswer.toString(),
      choices: this.shuffleArray([correctAnswer.toString(), ...Array.from(distractors)]),
      a: 0, b: 0, c: 0
    }
  }


  // ===== สำหรับการหาอนุพันธ์ =====
  private generateDerivativeQuestion(difficulty: 'easy' | 'medium' | 'hard'): Question {
    // Helper function to format term like 3x^2
    const formatTerm = (coeff: number, power: number, isFirst: boolean) => {
      if (coeff === 0) return ''
      
      let str = ''
      if (!isFirst) {
        str += coeff > 0 ? ' + ' : ' - '
      } else if (coeff < 0) {
        str += '-'
      }
      
      const absCoeff = Math.abs(coeff)
      if (absCoeff !== 1 || power === 0) str += absCoeff // Show coeff if not 1 or it's a constant
      
      if (power !== 0) {
        str += 'x'
        if (power !== 1) str += `^{${power}}`
      }
      return str
    }

    let terms: { c: number, p: number }[] = []
    
    if (difficulty === 'easy') {
      // f(x) = ax^n + b
      // Term 1
      const n = Math.floor(Math.random() * 4) + 2 // power 2-5
      const a = Math.floor(Math.random() * 9) + 1  // coeff 1-9
      terms.push({ c: a, p: n })
      
      // Term 2 (constant or x)
      if (Math.random() > 0.5) {
        const b = Math.floor(Math.random() * 19) - 9 // -9 to 9
        terms.push({ c: b, p: 0 })
      } else {
        const b = Math.floor(Math.random() * 9) + 1
        terms.push({ c: b, p: 1 })
      }
    } else if (difficulty === 'medium') {
      // f(x) = ax^n + bx^m + c
      const n = Math.floor(Math.random() * 3) + 3 // power 3-5
      const a = Math.floor(Math.random() * 9) + 2
      terms.push({ c: a, p: n })
      
      const m = Math.floor(Math.random() * (n - 2)) + 2 // power 2 to n-1
      const b = Math.floor(Math.random() * 15) - 7 // -7 to 7
      if (b !== 0) terms.push({ c: b, p: m })
      
      const c = Math.floor(Math.random() * 15) - 7
      if (c !== 0) terms.push({ c: c, p: Math.random() > 0.5 ? 1 : 0 })
    } else {
      // Hard: multiple terms, higher powers, maybe negative coeff
      const n = Math.floor(Math.random() * 3) + 4 // power 4-6
      const a = Math.floor(Math.random() * 9) + 2
      terms.push({ c: a, p: n })
      
      const m = n - 1
      const b = Math.floor(Math.random() * 15) - 7
      if (b !== 0) terms.push({ c: b, p: m })
      
      const k = Math.floor(Math.random() * (m - 1)) + 1
      const c = Math.floor(Math.random() * 15) - 7
      if (c !== 0) terms.push({ c: c, p: k })
      
      const d = Math.floor(Math.random() * 20) - 10
      if (d !== 0) terms.push({ c: d, p: 0 })
    }

    // Build question expression: f(x) = ...
    let expressionStr = ''
    terms.forEach((term, index) => {
      expressionStr += formatTerm(term.c, term.p, index === 0)
    })
    
    // Calculate derivative
    let derivativeTerms = terms.map(term => {
      if (term.p === 0) return { c: 0, p: 0 }
      return { c: term.c * term.p, p: term.p - 1 }
    }).filter(term => term.c !== 0)

    if (derivativeTerms.length === 0) {
      derivativeTerms.push({ c: 0, p: 0 })
    }

    let answerStr = ''
    derivativeTerms.forEach((term, index) => {
      answerStr += formatTerm(term.c, term.p, index === 0)
    })
    if (answerStr === '') answerStr = '0'

    // Generate distractors
    const distractors = new Set<string>()
    while (distractors.size < 3) {
      // Create fake derivatives
      const type = Math.floor(Math.random() * 4)
      let fakeTerms: {c: number, p: number}[] = []
      
      if (type === 0) {
        // Forgot to reduce power: nx^n
        fakeTerms = terms.map(t => t.p === 0 ? {c:0, p:0} : {c: t.c * t.p, p: t.p}).filter(t => t.c !== 0)
      } else if (type === 1) {
        // Did not multiply by power: x^{n-1}
        fakeTerms = terms.map(t => t.p === 0 ? {c:0, p:0} : {c: t.c, p: t.p - 1}).filter(t => t.c !== 0)
      } else if (type === 2) {
        // Intergrate instead: (c/(p+1))x^{p+1} - approximated to simple nums for distractor
        fakeTerms = terms.map(t => ({c: t.c, p: t.p + 1})).filter(t => t.c !== 0)
      } else {
         // Random coefficient changes
         fakeTerms = derivativeTerms.map(t => ({c: t.c + (Math.random() > 0.5 ? 1 : -1), p: t.p})).filter(t => t.c !== 0)
      }

      let fakeStr = ''
      fakeTerms.forEach((term, index) => {
        fakeStr += formatTerm(term.c, term.p, index === 0)
      })
      if (fakeStr === '') fakeStr = '0'
      
      if (fakeStr !== answerStr) {
        distractors.add(fakeStr)
      }
    }

    return {
      expression: `จงหาอนุพันธ์ของ $f(x) = ${expressionStr}$`,
      correctAnswer: `$${answerStr}$`,
      choices: this.shuffleArray([`$${answerStr}$`, ...Array.from(distractors).map(d => `$${d}$`)]),
      a: 0, b: 0, c: 0
    }
  }

  // ===== สำหรับการหาปริพันธ์ไม่จำกัดเขต =====
  private generateIntegralQuestion(difficulty: 'easy' | 'medium' | 'hard'): Question {
    // Helper: format term สำหรับ integrand (สัมประสิทธิ์เป็นจำนวนเต็ม)
    const formatTerm = (coeff: number, power: number, isFirst: boolean): string => {
      if (coeff === 0) return ''
      let str = ''
      if (!isFirst) {
        str += coeff > 0 ? ' + ' : ' - '
      } else if (coeff < 0) {
        str += '-'
      }
      const absCoeff = Math.abs(coeff)
      if (absCoeff !== 1 || power === 0) str += absCoeff
      if (power !== 0) {
        str += 'x'
        if (power !== 1) str += `^{${power}}`
      }
      return str
    }

    // Helper: format term สำหรับผลลัพธ์ปริพันธ์ (อาจเป็นเศษส่วน)
    const formatIntegralTerm = (num: number, den: number, power: number, isFirst: boolean): string => {
      if (num === 0) return ''
      const gcd = this.findGCD(Math.abs(num), Math.abs(den))
      const rNum = num / gcd
      const rDen = den / gcd
      let str = ''
      if (!isFirst) {
        str += rNum > 0 ? ' + ' : ' - '
      } else if (rNum < 0) {
        str += '-'
      }
      const absNum = Math.abs(rNum)
      if (rDen === 1) {
        if (absNum !== 1 || power === 0) str += absNum
        if (power !== 0) {
          str += 'x'
          if (power !== 1) str += `^{${power}}`
        }
      } else {
        str += `\\frac{${absNum}}{${rDen}}`
        if (power !== 0) {
          str += 'x'
          if (power !== 1) str += `^{${power}}`
        }
      }
      return str
    }

    let terms: { c: number, p: number }[] = []

    if (difficulty === 'easy') {
      // ง่าย: 1-2 พจน์ สัมประสิทธิ์เป็นทวีคูณของ (n+1) เพื่อให้ผลลัพธ์เป็นจำนวนเต็ม
      // ∫ ax^n dx = (a/(n+1))x^(n+1) + C → ถ้า a = k(n+1) จะได้ kx^(n+1)
      const n = [1, 2, 3, 4][Math.floor(Math.random() * 4)]
      const multiplier = Math.floor(Math.random() * 5) + 1 // 1-5
      const sign = Math.random() < 0.2 ? -1 : 1
      terms.push({ c: multiplier * (n + 1) * sign, p: n })

      // เพิ่มพจน์ที่ 2 (ค่าคงที่ หรือ เชิงเส้น)
      if (Math.random() > 0.3) {
        if (Math.random() > 0.5 && n > 1) {
          // พจน์เชิงเส้น: ใช้ทวีคูณของ 2 เพื่อให้หาร 2 ลงตัว
          const b = (Math.floor(Math.random() * 5) + 1) * 2 * (Math.random() < 0.2 ? -1 : 1)
          terms.push({ c: b, p: 1 })
        } else {
          // ค่าคงที่
          const b = (Math.floor(Math.random() * 9) + 1) * (Math.random() < 0.2 ? -1 : 1)
          terms.push({ c: b, p: 0 })
        }
      }
    } else if (difficulty === 'medium') {
      // ปานกลาง: 2-3 พจน์ อาจมีผลลัพธ์เป็นเศษส่วน
      const n = [2, 3, 4][Math.floor(Math.random() * 3)]
      const a = (Math.floor(Math.random() * 9) + 1) * (Math.random() < 0.3 ? -1 : 1)
      terms.push({ c: a, p: n })

      const m = Math.floor(Math.random() * (n - 1)) + 1
      const b = (Math.floor(Math.random() * 9) + 1) * (Math.random() < 0.3 ? -1 : 1)
      terms.push({ c: b, p: m })

      if (Math.random() > 0.4) {
        const d = (Math.floor(Math.random() * 9) + 1) * (Math.random() < 0.3 ? -1 : 1)
        terms.push({ c: d, p: 0 })
      }
    } else {
      // ยาก: 3-4 พจน์ กำลังสูง
      const n = [3, 4, 5][Math.floor(Math.random() * 3)]
      const a = (Math.floor(Math.random() * 9) + 2) * (Math.random() < 0.3 ? -1 : 1)
      terms.push({ c: a, p: n })

      const m = n - 1
      const b = (Math.floor(Math.random() * 9) + 2) * (Math.random() < 0.3 ? -1 : 1)
      terms.push({ c: b, p: m })

      const k = Math.floor(Math.random() * Math.max(1, m - 1)) + 1
      const cVal = (Math.floor(Math.random() * 9) + 1) * (Math.random() < 0.3 ? -1 : 1)
      if (k !== m) terms.push({ c: cVal, p: k })

      if (Math.random() > 0.3) {
        const d = (Math.floor(Math.random() * 9) + 1) * (Math.random() < 0.3 ? -1 : 1)
        terms.push({ c: d, p: 0 })
      }
    }

    // สร้าง expression ของ integrand
    let integrandStr = ''
    terms.forEach((term, index) => {
      integrandStr += formatTerm(term.c, term.p, index === 0)
    })

    // คำนวณปริพันธ์: ∫ cx^p dx = (c/(p+1))x^(p+1) + C
    const integralResult = terms.map(term => ({
      num: term.c,
      den: term.p + 1,
      power: term.p + 1
    }))

    // สร้างคำตอบ
    let answerStr = ''
    integralResult.forEach((term, index) => {
      answerStr += formatIntegralTerm(term.num, term.den, term.power, index === 0)
    })
    answerStr += ' + C'

    // สร้างตัวลวง
    const distractors = new Set<string>()
    while (distractors.size < 3) {
      const type = Math.floor(Math.random() * 4)
      let fakeResult: { num: number, den: number, power: number }[]

      if (type === 0) {
        // ผิด: ลืมเพิ่มกำลัง → (c/(p+1))x^p แทน x^(p+1)
        fakeResult = terms.map(t => ({
          num: t.c, den: t.p + 1, power: t.p
        }))
      } else if (type === 1) {
        // ผิด: ลืมหารด้วย (p+1) → cx^(p+1)
        fakeResult = terms.map(t => ({
          num: t.c, den: 1, power: t.p + 1
        }))
      } else if (type === 2) {
        // ผิด: หาอนุพันธ์แทน → c·p·x^(p-1)
        fakeResult = terms
          .filter(t => t.p !== 0)
          .map(t => ({ num: t.c * t.p, den: 1, power: t.p - 1 }))
        if (fakeResult.length === 0) fakeResult = [{ num: 1, den: 1, power: 1 }]
      } else {
        // ผิด: สัมประสิทธิ์คลาดเคลื่อน
        fakeResult = integralResult.map(t => ({
          num: t.num + (Math.random() > 0.5 ? t.den : -t.den),
          den: t.den,
          power: t.power
        })).filter(t => t.num !== 0)
        if (fakeResult.length === 0) fakeResult = [{ num: 1, den: 1, power: 1 }]
      }

      let fakeStr = ''
      fakeResult.forEach((term, index) => {
        fakeStr += formatIntegralTerm(term.num, term.den, term.power, index === 0)
      })
      if (fakeStr === '') fakeStr = '0'
      fakeStr += ' + C'

      if (fakeStr !== answerStr) {
        distractors.add(fakeStr)
      }
    }

    const needParens = terms.length > 1
    const integralExpr = needParens
      ? `\\int (${integrandStr})\\,dx`
      : `\\int ${integrandStr}\\,dx`

    return {
      expression: `จงหาปริพันธ์ $${integralExpr}$`,
      correctAnswer: `$${answerStr}$`,
      choices: this.shuffleArray([`$${answerStr}$`, ...Array.from(distractors).map(d => `$${d}$`)]),
      a: 0, b: 0, c: 0
    }
  }

  generateQuestion(options: GeneratorOptions): Question {
    const questionType = options.questionType || 'polynomial'

    switch (questionType) {
      case 'derivative':
        return this.generateDerivativeQuestion(options.difficulty)
      case 'integral':
        return this.generateIntegralQuestion(options.difficulty)
      case 'equation':
        return this.generateEquationQuestion(options.difficulty)
      case 'power':
        return this.generatePowerQuestion(options.difficulty)
      case 'root':
        return this.generateRootQuestion(options.difficulty)
      case 'polynomial':
      default:
        return this.generatePolynomialQuestion(options)
    }
  }

  private generatePolynomialQuestion(options: GeneratorOptions): Question {
    const [a, b, c, factorsInfo] = this.generateFactors(options.difficulty, options.maxConstantTerm)
    
    let correctAnswer: string
    let p: number, q: number
    
    if (a === 1) {
      // กรณีง่าย: หา p และ q จาก x² + bx + c = (x + p)(x + q)
      // โดยที่ b = p + q และ c = pq
      const discriminant = b * b - 4 * c
      if (discriminant < 0) {
        return this.generatePolynomialQuestion(options)
      }
      
      const sqrt = Math.sqrt(discriminant)
      // หา p และ q โดยตรงจากเงื่อนไข p+q=b และ pq=c
      // รากของสมการ X^2 - bX + c = 0 คือ p และ q
      p = (b + sqrt) / 2
      q = (b - sqrt) / 2
      
      if (!Number.isInteger(p) || !Number.isInteger(q)) {
        return this.generatePolynomialQuestion(options)
      }
      
      correctAnswer = this.formatFactors(a, Math.round(p), Math.round(q))
    } else {
      // กรณีปานกลางและยาก: ใช้ข้อมูลจาก factorsInfo
      correctAnswer = this.formatFactors(a, 0, 0, factorsInfo)
      p = 0 // ไม่ใช้สำหรับกรณีนี้
      q = 0 // ไม่ใช้สำหรับกรณีนี้
    }

    const expression = this.formatExpression(a, b, c)
    const distractors = this.generateDistractors(a, Math.round(p), Math.round(q), factorsInfo)
    
    const choices = this.shuffleArray([correctAnswer, ...distractors])

    return {
      expression: `${expression}`,
      correctAnswer,
      choices,
      a,
      b,
      c,
      checkAnswer: this.createAnswerChecker(correctAnswer, a, Math.round(p), Math.round(q), factorsInfo),
      factorInfo: typeof factorsInfo === 'object' ? factorsInfo : undefined
    }
  }

  generateQuestions(count: number, options: GeneratorOptions): Question[] {
    const questions: Question[] = []
    const usedExpressions = new Set<string>()

    // ถ้าเจาะจงประเภทมา ให้ใช้ประเภทนั้นทั้งหมด
    // ถ้าไม่เจาะจง ค่อยสุ่มจากชุดค่าเริ่มต้น (ให้น้ำหนัก power)
    const availableTypes: QuestionType[] = options.questionType
      ? [options.questionType]
      : [
          'power', 'power', 'power', 'power', 'power',
          'root', 'root',
          'polynomial', 'equation'
        ]

    for (let i = 0; i < count; i++) {
      let question: Question | null = null
      let attempts = 0
      const maxAttempts = 100 // เพิ่มจำนวนครั้งสูงสุด

      while (question === null && attempts < maxAttempts) {
        attempts++

        // เลือกประเภทโจทย์ตามที่ระบุ (หรือสุ่มจาก availableTypes)
        const chosenType = availableTypes[Math.floor(Math.random() * availableTypes.length)]
        const questionOptions = { ...options, questionType: chosenType }

        try {
          const candidateQuestion = this.generateQuestion(questionOptions)

          // ตรวจสอบว่ามีโจทย์นี้อยู่แล้วหรือไม่
          if (!usedExpressions.has(candidateQuestion.expression)) {
            question = candidateQuestion
            usedExpressions.add(candidateQuestion.expression)
          }
        } catch (error) {
          // ถ้ามีข้อผิดพลาด ให้ลองใหม่
          console.warn(`Error generating question attempt ${attempts}:`, error)
          continue
        }
      }

      if (question) {
        questions.push(question)
      } else {
        // ถ้าไม่สามารถสร้างโจทย์ได้ ให้สร้างโจทย์ polynomial แทน
        console.warn(`Could not generate unique question after ${maxAttempts} attempts, using polynomial fallback`)
        const fallbackQuestion = this.generateQuestion({ ...options, questionType: 'polynomial' })
        if (!usedExpressions.has(fallbackQuestion.expression)) {
          questions.push(fallbackQuestion)
          usedExpressions.add(fallbackQuestion.expression)
        }
      }
    }

    return questions
  }
}
