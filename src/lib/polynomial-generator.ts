export interface Question {
  expression: string
  correctAnswer: string
  choices: string[]
  a: number
  b: number
  c: number
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

export type QuestionType = 'polynomial' | 'equation' | 'integer' | 'fraction' | 'power' | 'root' | 'function' | 'arithmetic_sequence' | 'geometric_sequence' | 'arithmetic_series' | 'geometric_series'

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
      
      return [a, b, c, a]
    } else {
      // ปานกลางและยาก: สร้างแบบ (ax+m)(bx+n) = abx² + (an+bm)x + mn
      let a1: number, a2: number, m: number, n: number
      
      if (difficulty === 'medium') {
        // ปานกลาง: ใช้ค่าที่ไม่ซับซ้อนเกินไป
        a1 = [1, 2, 3][Math.floor(Math.random() * 3)]
        a2 = [1, 2, 3][Math.floor(Math.random() * 3)]
        m = Math.floor(Math.random() * 6) + 1
        n = Math.floor(Math.random() * 6) + 1
        
        // สุ่มเครื่องหมาย
        if (Math.random() < 0.4) m = -m
        if (Math.random() < 0.4) n = -n
      } else {
        // ยาก: ค่าที่ซับซ้อนขึ้น
        a1 = Math.floor(Math.random() * 4) + 1  // 1-4
        a2 = Math.floor(Math.random() * 4) + 1  // 1-4
        m = Math.floor(Math.random() * 8) + 1
        n = Math.floor(Math.random() * 8) + 1
        
        // สุ่มเครื่องหมาย
        if (Math.random() < 0.5) m = -m
        if (Math.random() < 0.5) n = -n
      }
      
      // คำนวณสัมประสิทธิ์ จาก (a1*x + m)(a2*x + n) = a1*a2*x² + (a1*n + a2*m)x + m*n
      const a = a1 * a2
      const b = a1 * n + a2 * m
      const c = m * n
      
      // ตรวจสอบขอบเขตพจน์หลัง
      if (Math.abs(c) > maxConstantTerm) {
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
      // กรณีง่าย: เช็คทั้ง 2 แบบ (x+p)(x+q) และ (x+q)(x+p)
      const correctOption1 = this.formatFactors(a, p, q)
      const correctOption2 = this.formatFactors(a, q, p)
      
      return (answer: string) => {
        return answer === correctOption1 || answer === correctOption2
      }
    } else if (factorsInfo && typeof factorsInfo === 'object') {
      // กรณีปานกลางและยาก: เช็คทั้ง 2 แบบ (a1x+m)(a2x+n) และ (a2x+n)(a1x+m)
      const { a1, a2, m, n } = factorsInfo
      
      const correctOption1 = `(${this.formatComplexFactor(a1, m)})(${this.formatComplexFactor(a2, n)})`
      const correctOption2 = `(${this.formatComplexFactor(a2, n)})(${this.formatComplexFactor(a1, m)})`
      
      return (answer: string) => {
        return answer === correctOption1 || answer === correctOption2
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

  // ฟังก์ชันหา GCD
  private findGCD(a: number, b: number): number {
    while (b !== 0) {
      const temp = b
      b = a % b
      a = temp
    }
    return a
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
    
    if (difficulty === 'easy') {
      // ฐานง่ายๆ กำลัง 2-3
      base = [2, 3, 4, 5][Math.floor(Math.random() * 4)]
      exponent = [2, 3][Math.floor(Math.random() * 2)]
      correctAnswer = Math.pow(base, exponent)
    } else if (difficulty === 'medium') {
      // ฐานใหญ่ขึ้น หรือ ฐานลบ กำลัง 2-4
      const useNegative = Math.random() < 0.3
      base = useNegative ? -[2, 3, 4][Math.floor(Math.random() * 3)] : [2, 3, 4, 5, 6][Math.floor(Math.random() * 5)]
      exponent = [2, 3, 4][Math.floor(Math.random() * 3)]
      correctAnswer = Math.pow(base, exponent)
    } else {
      // ยาก: เลขยกกำลัง 0, 1 หรือ กำลังสูง
      if (Math.random() < 0.4) {
        // กำลัง 0 หรือ 1
        base = Math.floor(Math.random() * 9) + 2 // 2-10
        exponent = [0, 1][Math.floor(Math.random() * 2)]
        correctAnswer = Math.pow(base, exponent)
      } else {
        // กำลังสูง
        base = [2, 3][Math.floor(Math.random() * 2)]
        exponent = [4, 5, 6][Math.floor(Math.random() * 3)]
        correctAnswer = Math.pow(base, exponent)
      }
    }

    const expression = base < 0 ? `(${base})^{${exponent}}` : `${base}^{${exponent}}`
    
    // สร้างตัวเลือกผิด
    const distractors = new Set<string>()
    
    const possibleDistractors = [
      (correctAnswer + Math.floor(Math.random() * 10) + 1).toString(),
      (correctAnswer - Math.floor(Math.random() * 10) - 1).toString(),
      (base * exponent).toString(), // ผิดพลาดทั่วไป: คูณแทนที่จะยกกำลัง
      (base + exponent).toString(), // ผิดพลาดทั่วไป: บวกแทนที่จะยกกำลัง
      Math.pow(base, exponent + 1).toString(),
      Math.pow(base, Math.max(1, exponent - 1)).toString(),
      Math.pow(base + 1, exponent).toString()
    ]
    
    // เลือกตัวเลือกที่ไม่ซ้ำกับคำตอบที่ถูก
    for (const distractor of possibleDistractors) {
      if (distractor !== correctAnswer.toString() && distractors.size < 3) {
        distractors.add(distractor)
      }
    }
    
    // เติมตัวเลือกเพิ่มหากยังไม่ครบ
    while (distractors.size < 3) {
      const randomDistractor = (Math.floor(Math.random() * 100) + 1).toString()
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
    
    const correctAnswer = Math.round(Math.pow(baseNumber, 1/rootType))
    
    // ตรวจสอบว่าเป็นกำลังสมบูรณ์จริง (เพื่อป้องกัน floating point error)
    if (Math.pow(correctAnswer, rootType) !== baseNumber) {
      // ถ้าไม่ตรงให้สร้างใหม่
      return this.generateRootQuestion(difficulty)
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
      if (distractor !== correctAnswer.toString() && distractors.size < 3 && parseInt(distractor) > 0) {
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
    let a: number, b: number, x: number, correctAnswer: number, functionExpr: string
    
    if (difficulty === 'easy') {
      // ง่าย: f(x) = ax + b
      a = Math.floor(Math.random() * 5) + 1 // 1-5
      b = Math.floor(Math.random() * 10) - 5 // -5 ถึง 4
      x = Math.floor(Math.random() * 5) + 1 // 1-5
      
      correctAnswer = a * x + b
      functionExpr = `f(x) = ${a === 1 ? '' : a}x${b >= 0 ? '+' + b : b}`
    } else if (difficulty === 'medium') {
      // ปานกลาง: f(x) = ax² + b
      a = Math.floor(Math.random() * 3) + 1 // 1-3
      b = Math.floor(Math.random() * 10) - 5 // -5 ถึง 4
      x = Math.floor(Math.random() * 4) + 1 // 1-4
      
      correctAnswer = a * x * x + b
      functionExpr = `f(x) = ${a === 1 ? '' : a}x^2${b >= 0 ? '+' + b : b}`
    } else {
      // ยาก: f(x) = ax² + bx + c
      a = Math.floor(Math.random() * 3) + 1 // 1-3
      b = Math.floor(Math.random() * 6) - 3 // -3 ถึง 2
      const c = Math.floor(Math.random() * 6) - 3 // -3 ถึง 2
      x = Math.floor(Math.random() * 3) + 1 // 1-3
      
      correctAnswer = a * x * x + b * x + c
      functionExpr = `f(x) = ${a === 1 ? '' : a}x^2${b >= 0 ? '+' + b : b}x${c >= 0 ? '+' + c : c}`
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
      expression: `${functionExpr}, f(${x}) = ?`,
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


  generateQuestion(options: GeneratorOptions): Question {
    const questionType = options.questionType || 'polynomial'

    switch (questionType) {
      case 'equation':
        return this.generateEquationQuestion(options.difficulty)
      case 'integer':
        return this.generateIntegerQuestion(options.difficulty)
      case 'fraction':
        return this.generateFractionQuestion(options.difficulty)
      case 'power':
        return this.generatePowerQuestion(options.difficulty)
      case 'root':
        return this.generateRootQuestion(options.difficulty)
      case 'function':
        return this.generateFunctionQuestion(options.difficulty)
      case 'arithmetic_sequence':
        return this.generateArithmeticSequenceQuestion(options.difficulty)
      case 'geometric_sequence':
        return this.generateGeometricSequenceQuestion(options.difficulty)
      case 'arithmetic_series':
        return this.generateArithmeticSeriesQuestion(options.difficulty)
      case 'geometric_series':
        return this.generateGeometricSeriesQuestion(options.difficulty)
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
      p = (-b + sqrt) / 2
      q = (-b - sqrt) / 2
      
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

    for (let i = 0; i < count; i++) {
      let question: Question
      let attempts = 0
      
      do {
        question = this.generateQuestion(options)
        attempts++
      } while (usedExpressions.has(question.expression) && attempts < 50)

      if (attempts < 50) {
        usedExpressions.add(question.expression)
        questions.push(question)
      }
    }

    return questions
  }
}