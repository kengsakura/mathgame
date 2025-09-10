export interface Question {
  expression: string
  correctAnswer: string
  choices: string[]
  a: number
  b: number
  c: number
  // เพิ่ม method สำหรับเช็คคำตอบ
  checkAnswer?: (answer: string) => boolean
}

export type QuestionType = 'polynomial' | 'equation' | 'integer' | 'fraction' | 'power' | 'root' | 'function'

export interface GeneratorOptions {
  difficulty: 'easy' | 'medium' | 'hard'
  maxConstantTerm: number
  questionType?: QuestionType
}

export class MathQuestionGenerator {
  private generateFactors(difficulty: 'easy' | 'medium' | 'hard', maxConstantTerm: number): [number, number, number, number] {
    let a = 1
    let p: number, q: number

    if (difficulty === 'easy') {
      // ง่าย: สัมประสิทธิ์หน้า x² เป็น 1
      p = Math.floor(Math.random() * 10) + 1
      q = Math.floor(Math.random() * 10) + 1
      
      // สุ่มเครื่องหมาย
      if (Math.random() < 0.3) p = -p
      if (Math.random() < 0.3) q = -q
    } else if (difficulty === 'medium') {
      // ปานกลาง: สัมประสิทธิ์หน้า x² อาจเป็น 2, 3
      a = Math.random() < 0.6 ? 1 : (Math.random() < 0.5 ? 2 : 3)
      p = Math.floor(Math.random() * 8) + 1
      q = Math.floor(Math.random() * 8) + 1
      
      if (Math.random() < 0.4) p = -p
      if (Math.random() < 0.4) q = -q
    } else {
      // ยาก: สัมประสิทธิ์หน้า x² หลากหลาย
      a = Math.floor(Math.random() * 4) + 2
      p = Math.floor(Math.random() * 6) + 1
      q = Math.floor(Math.random() * 6) + 1
      
      if (Math.random() < 0.5) p = -p
      if (Math.random() < 0.5) q = -q
    }

    // คำนวณค่าสัมประสิทธิ์
    const b = a * (p + q)
    const c = a * p * q

    // ตรวจสอบขอบเขตพจน์หลัง
    if (Math.abs(c) > maxConstantTerm) {
      return this.generateFactors(difficulty, maxConstantTerm)
    }

    return [a, b, c, a]
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

  private formatFactors(a: number, p: number, q: number): string {
    const factor1 = this.formatSingleFactor(a === 1 ? 1 : a, p)
    const factor2 = this.formatSingleFactor(1, q)
    
    if (a === 1) {
      return `(x${this.formatSign(p)})(x${this.formatSign(q)})`
    } else {
      return `${a}(x${this.formatSign(p)})(x${this.formatSign(q)})`
    }
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

  private generateDistractors(correctA: number, correctP: number, correctQ: number): string[] {
    const distractors = new Set<string>()
    const correct = this.formatFactors(correctA, correctP, correctQ)

    // ตัวลวงแบบที่ 1: สลับเครื่องหมาย
    if (correctP > 0 && correctQ > 0) {
      distractors.add(this.formatFactors(correctA, -correctP, correctQ))
      distractors.add(this.formatFactors(correctA, correctP, -correctQ))
    } else if (correctP < 0 && correctQ < 0) {
      distractors.add(this.formatFactors(correctA, -correctP, correctQ))
      distractors.add(this.formatFactors(correctA, correctP, -correctQ))
    } else {
      distractors.add(this.formatFactors(correctA, -correctP, -correctQ))
    }

    // ตัวลวงแบบที่ 2: ใช้ตัวคูณของพจน์หลัง (อัจฉริยะ)
    const c = correctA * correctP * correctQ
    const factors = this.findFactorPairs(Math.abs(c))
    
    for (const [f1, f2] of factors) {
      if (f1 !== Math.abs(correctP) || f2 !== Math.abs(correctQ)) {
        // สร้างตัวลวงด้วยตัวประกอบอื่นๆ ของ c
        const sign1 = Math.random() < 0.5 ? 1 : -1
        const sign2 = c < 0 ? -sign1 : sign1
        distractors.add(this.formatFactors(correctA, sign1 * f1, sign2 * f2))
        
        if (distractors.size >= 3) break
      }
    }

    // ตัวลวงแบบที่ 3: เปลี่ยนค่าสัมประสิทธิ์หน้า x²
    if (distractors.size < 3) {
      const newA = correctA === 1 ? 2 : correctA === 2 ? 3 : 1
      distractors.add(this.formatFactors(newA, correctP, correctQ))
    }

    // ตัวลวงเพิ่มเติมหากยังไม่ครบ
    while (distractors.size < 3) {
      const randomP = Math.floor(Math.random() * 6) + 1
      const randomQ = Math.floor(Math.random() * 6) + 1
      const randomSignP = Math.random() < 0.5 ? 1 : -1
      const randomSignQ = Math.random() < 0.5 ? 1 : -1
      
      const distractor = this.formatFactors(correctA, randomSignP * randomP, randomSignQ * randomQ)
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
  private createAnswerChecker(correctAnswer: string, a: number, p: number, q: number): (answer: string) => boolean {
    const correctOption1 = this.formatFactors(a, p, q) // เช่น (x+6)(x-6)
    const correctOption2 = this.formatFactors(a, q, p) // เช่น (x-6)(x+6)
    
    return (answer: string) => {
      return answer === correctOption1 || answer === correctOption2
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
      case 'polynomial':
      default:
        return this.generatePolynomialQuestion(options)
    }
  }

  private generatePolynomialQuestion(options: GeneratorOptions): Question {
    const [a, b, c] = this.generateFactors(options.difficulty, options.maxConstantTerm)
    
    // คำนวณค่า p และ q จาก ax² + bx + c = a(x + p)(x + q)
    // โดยที่ b = a(p + q) และ c = apq
    const sum = b / a
    const product = c / a
    
    // แก้สมการกำลังสอง t² - sum*t + product = 0
    const discriminant = sum * sum - 4 * product
    if (discriminant < 0) {
      return this.generatePolynomialQuestion(options) // สร้างใหม่หากไม่มีคำตอบจริง
    }
    
    const sqrt = Math.sqrt(discriminant)
    const p = (sum + sqrt) / 2
    const q = (sum - sqrt) / 2
    
    // ตรวจสอบว่า p และ q เป็นจำนวนเต็ม
    if (!Number.isInteger(p) || !Number.isInteger(q)) {
      return this.generatePolynomialQuestion(options) // สร้างใหม่
    }

    const expression = this.formatExpression(a, b, c)
    const correctAnswer = this.formatFactors(a, Math.round(p), Math.round(q))
    const distractors = this.generateDistractors(a, Math.round(p), Math.round(q))
    
    const choices = this.shuffleArray([correctAnswer, ...distractors])

    return {
      expression: `${expression}`,
      correctAnswer,
      choices,
      a,
      b,
      c,
      checkAnswer: this.createAnswerChecker(correctAnswer, a, Math.round(p), Math.round(q))
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