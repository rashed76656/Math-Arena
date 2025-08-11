export interface Question {
  id: string;
  text: string;
  answer: number;
  difficulty: "easy" | "medium" | "hard";
  type: "addition" | "subtraction" | "multiplication" | "division" | "mixed" | "fractions" | "decimals" | "percentages" | "word_problem" | "algebra" | "geometry";
  timeLimit: number;
  explanation?: string;
  category?: string;
}

export class QuestionGenerator {
  private questionCount = 0;

  generateQuestion(difficulty: "easy" | "medium" | "hard", wave: number): Question {
    this.questionCount++;
    const id = `q_${this.questionCount}_${Date.now()}`;
    
    // Time limits based on difficulty
    const timeLimit = difficulty === "easy" ? 30000 : 
                     difficulty === "medium" ? 20000 : 15000;

    // Adjust difficulty based on wave progression
    const effectiveDifficulty = this.adjustDifficultyForWave(difficulty, wave);
    
    const questionTypes = this.getQuestionTypes(effectiveDifficulty);
    const type = questionTypes[Math.floor(Math.random() * questionTypes.length)];
    
    return this.createQuestion(id, type, effectiveDifficulty, timeLimit);
  }

  private adjustDifficultyForWave(baseDifficulty: string, wave: number): "easy" | "medium" | "hard" {
    // Gradually increase difficulty with waves
    if (wave <= 3) return "easy";
    if (wave <= 6) return baseDifficulty === "easy" ? "easy" : "medium";
    if (wave <= 10) return baseDifficulty === "easy" ? "medium" : "hard";
    return "hard"; // All hard after wave 10
  }

  private getQuestionTypes(difficulty: "easy" | "medium" | "hard"): string[] {
    switch (difficulty) {
      case "easy":
        return ["addition", "subtraction", "multiplication"];
      case "medium":
        return ["addition", "subtraction", "multiplication", "division", "fractions", "decimals", "word_problem"];
      case "hard":
        return ["addition", "subtraction", "multiplication", "division", "mixed", "fractions", "decimals", "percentages", "word_problem", "algebra", "geometry"];
      default:
        return ["addition"];
    }
  }

  private createQuestion(
    id: string, 
    type: string, 
    difficulty: "easy" | "medium" | "hard",
    timeLimit: number
  ): Question {
    switch (type) {
      case "addition":
        return this.createAdditionQuestion(id, difficulty, timeLimit);
      case "subtraction":
        return this.createSubtractionQuestion(id, difficulty, timeLimit);
      case "multiplication":
        return this.createMultiplicationQuestion(id, difficulty, timeLimit);
      case "division":
        return this.createDivisionQuestion(id, difficulty, timeLimit);
      case "mixed":
        return this.createMixedQuestion(id, difficulty, timeLimit);
      case "fractions":
        return this.createFractionsQuestion(id, difficulty, timeLimit);
      case "decimals":
        return this.createDecimalsQuestion(id, difficulty, timeLimit);
      case "percentages":
        return this.createPercentagesQuestion(id, difficulty, timeLimit);
      case "word_problem":
        return this.createWordProblemQuestion(id, difficulty, timeLimit);
      case "algebra":
        return this.createAlgebraQuestion(id, difficulty, timeLimit);
      case "geometry":
        return this.createGeometryQuestion(id, difficulty, timeLimit);
      default:
        return this.createAdditionQuestion(id, difficulty, timeLimit);
    }
  }

  private createAdditionQuestion(id: string, difficulty: "easy" | "medium" | "hard", timeLimit: number): Question {
    let a: number, b: number;
    
    switch (difficulty) {
      case "easy":
        a = Math.floor(Math.random() * 20) + 1; // 1-20
        b = Math.floor(Math.random() * 20) + 1; // 1-20
        break;
      case "medium":
        a = Math.floor(Math.random() * 50) + 10; // 10-59
        b = Math.floor(Math.random() * 50) + 10; // 10-59
        break;
      case "hard":
        a = Math.floor(Math.random() * 100) + 20; // 20-119
        b = Math.floor(Math.random() * 100) + 20; // 20-119
        break;
    }
    
    return {
      id,
      text: `${a} + ${b} = ?`,
      answer: a + b,
      difficulty,
      type: "addition",
      timeLimit,
      category: "arithmetic",
    };
  }

  private createSubtractionQuestion(id: string, difficulty: "easy" | "medium" | "hard", timeLimit: number): Question {
    let a: number, b: number;
    
    switch (difficulty) {
      case "easy":
        a = Math.floor(Math.random() * 20) + 10; // 10-29
        b = Math.floor(Math.random() * 10) + 1; // 1-10
        break;
      case "medium":
        a = Math.floor(Math.random() * 50) + 25; // 25-74
        b = Math.floor(Math.random() * 25) + 5; // 5-29
        break;
      case "hard":
        a = Math.floor(Math.random() * 100) + 50; // 50-149
        b = Math.floor(Math.random() * 50) + 10; // 10-59
        break;
    }
    
    // Ensure positive result
    if (b > a) [a, b] = [b, a];
    
    return {
      id,
      text: `${a} - ${b} = ?`,
      answer: a - b,
      difficulty,
      type: "subtraction",
      timeLimit,
      category: "arithmetic",
    };
  }

  private createMultiplicationQuestion(id: string, difficulty: "easy" | "medium" | "hard", timeLimit: number): Question {
    let a: number, b: number;
    
    switch (difficulty) {
      case "easy":
        a = Math.floor(Math.random() * 5) + 2; // 2-6
        b = Math.floor(Math.random() * 5) + 2; // 2-6
        break;
      case "medium":
        a = Math.floor(Math.random() * 8) + 3; // 3-10
        b = Math.floor(Math.random() * 8) + 3; // 3-10
        break;
      case "hard":
        a = Math.floor(Math.random() * 10) + 5; // 5-14
        b = Math.floor(Math.random() * 10) + 5; // 5-14
        break;
    }
    
    return {
      id,
      text: `${a} × ${b} = ?`,
      answer: a * b,
      difficulty,
      type: "multiplication",
      timeLimit,
      category: "arithmetic",
    };
  }

  private createDivisionQuestion(id: string, difficulty: "easy" | "medium" | "hard", timeLimit: number): Question {
    let divisor: number, quotient: number;
    
    switch (difficulty) {
      case "easy":
        divisor = Math.floor(Math.random() * 5) + 2; // 2-6
        quotient = Math.floor(Math.random() * 10) + 1; // 1-10
        break;
      case "medium":
        divisor = Math.floor(Math.random() * 8) + 2; // 2-9
        quotient = Math.floor(Math.random() * 15) + 2; // 2-16
        break;
      case "hard":
        divisor = Math.floor(Math.random() * 10) + 3; // 3-12
        quotient = Math.floor(Math.random() * 20) + 5; // 5-24
        break;
    }
    
    const dividend = divisor * quotient; // Ensure exact division
    
    return {
      id,
      text: `${dividend} ÷ ${divisor} = ?`,
      answer: quotient,
      difficulty,
      type: "division",
      timeLimit,
      category: "arithmetic",
    };
  }

  private createMixedQuestion(id: string, difficulty: "easy" | "medium" | "hard", timeLimit: number): Question {
    const operations = ["+", "-", "×"];
    const op1 = operations[Math.floor(Math.random() * operations.length)];
    const op2 = operations[Math.floor(Math.random() * operations.length)];
    
    let a: number, b: number, c: number;
    
    switch (difficulty) {
      case "easy":
        a = Math.floor(Math.random() * 10) + 1; // 1-10
        b = Math.floor(Math.random() * 10) + 1; // 1-10
        c = Math.floor(Math.random() * 10) + 1; // 1-10
        break;
      case "medium":
        a = Math.floor(Math.random() * 15) + 2; // 2-16
        b = Math.floor(Math.random() * 15) + 2; // 2-16
        c = Math.floor(Math.random() * 15) + 2; // 2-16
        break;
      case "hard":
        a = Math.floor(Math.random() * 20) + 5; // 5-24
        b = Math.floor(Math.random() * 20) + 5; // 5-24
        c = Math.floor(Math.random() * 20) + 5; // 5-24
        break;
    }
    
    // Calculate result following order of operations
    let result: number;
    let questionText: string;
    
    if (op1 === "×" || op2 === "×") {
      // Handle multiplication first (order of operations)
      if (op1 === "×") {
        const temp = a * b;
        result = op2 === "+" ? temp + c : temp - c;
        questionText = `${a} × ${b} ${op2} ${c} = ?`;
      } else {
        const temp = b * c;
        result = op1 === "+" ? a + temp : a - temp;
        questionText = `${a} ${op1} ${b} × ${c} = ?`;
      }
    } else {
      // Only addition and subtraction, left to right
      const temp = op1 === "+" ? a + b : a - b;
      result = op2 === "+" ? temp + c : temp - c;
      questionText = `${a} ${op1} ${b} ${op2} ${c} = ?`;
    }
    
    // Ensure positive result for easier gameplay
    if (result < 0) {
      return this.createAdditionQuestion(id, difficulty, timeLimit);
    }
    
    return {
      id,
      text: questionText,
      answer: result,
      difficulty,
      type: "mixed",
      timeLimit,
      category: "arithmetic",
    };
  }

  private createFractionsQuestion(id: string, difficulty: "easy" | "medium" | "hard", timeLimit: number): Question {
    let num1: number, den1: number, num2: number, den2: number;
    
    switch (difficulty) {
      case "easy":
        // Simple fractions with same denominator
        den1 = den2 = Math.floor(Math.random() * 8) + 2; // 2-9
        num1 = Math.floor(Math.random() * (den1 - 1)) + 1; // 1 to den1-1
        num2 = Math.floor(Math.random() * (den1 - num1)) + 1; // Ensure result < 1
        break;
      case "medium":
        // Different denominators, simpler
        den1 = [2, 3, 4, 5, 6][Math.floor(Math.random() * 5)];
        den2 = [2, 3, 4, 5, 6][Math.floor(Math.random() * 5)];
        num1 = Math.floor(Math.random() * den1) + 1;
        num2 = Math.floor(Math.random() * den2) + 1;
        break;
      case "hard":
        // Complex fractions
        den1 = Math.floor(Math.random() * 10) + 2; // 2-11
        den2 = Math.floor(Math.random() * 10) + 2; // 2-11
        num1 = Math.floor(Math.random() * den1) + 1;
        num2 = Math.floor(Math.random() * den2) + 1;
        break;
    }

    // Calculate result and convert to decimal for answer
    const result1 = num1 / den1;
    const result2 = num2 / den2;
    const sum = result1 + result2;
    
    // Convert back to simplest fraction form for answer (as integer for simplicity)
    const answerDecimal = Math.round(sum * 100) / 100; // Round to 2 decimals
    const answer = Math.round(answerDecimal * 100); // Convert to integer for easier input
    
    return {
      id,
      text: `${num1}/${den1} + ${num2}/${den2} = ? (as decimal × 100)`,
      answer,
      difficulty,
      type: "fractions",
      timeLimit,
      category: "fractions",
      explanation: `${num1}/${den1} + ${num2}/${den2} = ${answerDecimal}`,
    };
  }

  private createDecimalsQuestion(id: string, difficulty: "easy" | "medium" | "hard", timeLimit: number): Question {
    let a: number, b: number;
    
    switch (difficulty) {
      case "easy":
        a = Math.round((Math.random() * 10 + 1) * 10) / 10; // 0.1 to 10.0
        b = Math.round((Math.random() * 10 + 1) * 10) / 10;
        break;
      case "medium":
        a = Math.round((Math.random() * 50 + 1) * 100) / 100; // 0.01 to 50.00
        b = Math.round((Math.random() * 50 + 1) * 100) / 100;
        break;
      case "hard":
        a = Math.round((Math.random() * 100 + 1) * 1000) / 1000; // 0.001 to 100.000
        b = Math.round((Math.random() * 100 + 1) * 1000) / 1000;
        break;
    }
    
    const result = Math.round((a + b) * 1000) / 1000;
    const answer = Math.round(result * 1000); // Convert to integer
    
    return {
      id,
      text: `${a} + ${b} = ? (×1000)`,
      answer,
      difficulty,
      type: "decimals",
      timeLimit,
      category: "decimals",
      explanation: `${a} + ${b} = ${result}`,
    };
  }

  private createPercentagesQuestion(id: string, difficulty: "easy" | "medium" | "hard", timeLimit: number): Question {
    let base: number, percentage: number;
    
    switch (difficulty) {
      case "easy":
        base = [10, 20, 25, 50, 100][Math.floor(Math.random() * 5)];
        percentage = [10, 20, 25, 50][Math.floor(Math.random() * 4)];
        break;
      case "medium":
        base = Math.floor(Math.random() * 200) + 50; // 50-249
        percentage = [15, 25, 30, 40, 60, 75][Math.floor(Math.random() * 6)];
        break;
      case "hard":
        base = Math.floor(Math.random() * 1000) + 100; // 100-1099
        percentage = Math.floor(Math.random() * 95) + 5; // 5-99%
        break;
    }
    
    const answer = Math.round((base * percentage) / 100);
    
    return {
      id,
      text: `What is ${percentage}% of ${base}?`,
      answer,
      difficulty,
      type: "percentages",
      timeLimit,
      category: "percentages",
      explanation: `${percentage}% of ${base} = ${base} × ${percentage}/100 = ${answer}`,
    };
  }

  private createWordProblemQuestion(id: string, difficulty: "easy" | "medium" | "hard", timeLimit: number): Question {
    const problems = {
      easy: [
        {
          text: "Sarah has 15 apples. She gives away 6 apples. How many apples does she have left?",
          answer: 9,
          explanation: "15 - 6 = 9"
        },
        {
          text: "A box contains 8 red balls and 12 blue balls. How many balls are there in total?",
          answer: 20,
          explanation: "8 + 12 = 20"
        },
        {
          text: "Tom buys 4 packs of pencils. Each pack has 5 pencils. How many pencils does Tom have?",
          answer: 20,
          explanation: "4 × 5 = 20"
        },
      ],
      medium: [
        {
          text: "A store sells 45 books on Monday and 38 books on Tuesday. If each book costs $12, how many books were sold in total?",
          answer: 83,
          explanation: "45 + 38 = 83 books"
        },
        {
          text: "Lisa has $150. She spends $45 on food and $25 on clothes. How much money does she have left?",
          answer: 80,
          explanation: "150 - 45 - 25 = 80"
        },
        {
          text: "A recipe calls for 3/4 cup of sugar. If you want to make 4 batches, how many cups of sugar do you need? (Answer as decimal × 10)",
          answer: 30,
          explanation: "3/4 × 4 = 3 cups = 30 (×10)"
        },
      ],
      hard: [
        {
          text: "A train travels 420 miles in 6 hours. At this rate, how many miles will it travel in 9 hours?",
          answer: 630,
          explanation: "420 ÷ 6 = 70 mph, 70 × 9 = 630 miles"
        },
        {
          text: "The price of a jacket increased by 25% from $80. What is the new price?",
          answer: 100,
          explanation: "80 × 1.25 = $100"
        },
        {
          text: "A rectangular garden is 15 meters long and 8 meters wide. What is its area in square meters?",
          answer: 120,
          explanation: "15 × 8 = 120 square meters"
        },
      ],
    };

    const problemSet = problems[difficulty];
    const selectedProblem = problemSet[Math.floor(Math.random() * problemSet.length)];
    
    return {
      id,
      text: selectedProblem.text,
      answer: selectedProblem.answer,
      difficulty,
      type: "word_problem",
      timeLimit,
      category: "word_problems",
      explanation: selectedProblem.explanation,
    };
  }

  private createAlgebraQuestion(id: string, difficulty: "easy" | "medium" | "hard", timeLimit: number): Question {
    let a: number, b: number, x: number;
    
    switch (difficulty) {
      case "easy":
        x = Math.floor(Math.random() * 10) + 1; // 1-10
        a = Math.floor(Math.random() * 5) + 1; // 1-5
        b = a * x;
        break;
      case "medium":
        x = Math.floor(Math.random() * 15) + 1; // 1-15
        a = Math.floor(Math.random() * 10) + 1; // 1-10
        b = Math.floor(Math.random() * 20) + 1; // 1-20
        x = Math.floor((b / a));
        break;
      case "hard":
        x = Math.floor(Math.random() * 20) + 1; // 1-20
        a = Math.floor(Math.random() * 15) + 2; // 2-16
        const c = Math.floor(Math.random() * 10) + 1; // 1-10
        b = a * x + c;
        x = Math.floor((b - c) / a);
        break;
    }
    
    return {
      id,
      text: difficulty === "hard" 
        ? `Solve for x: ${a}x + ${Math.floor(Math.random() * 10) + 1} = ${b}`
        : `Solve for x: ${a}x = ${b}`,
      answer: x,
      difficulty,
      type: "algebra",
      timeLimit,
      category: "algebra",
      explanation: `x = ${x}`,
    };
  }

  private createGeometryQuestion(id: string, difficulty: "easy" | "medium" | "hard", timeLimit: number): Question {
    const shapes = {
      easy: [
        {
          type: "rectangle",
          generate: () => {
            const length = Math.floor(Math.random() * 10) + 3; // 3-12
            const width = Math.floor(Math.random() * 8) + 2; // 2-9
            return {
              text: `Find the area of a rectangle with length ${length} and width ${width}.`,
              answer: length * width,
              explanation: `Area = length × width = ${length} × ${width} = ${length * width}`
            };
          }
        },
        {
          type: "square",
          generate: () => {
            const side = Math.floor(Math.random() * 8) + 3; // 3-10
            return {
              text: `Find the perimeter of a square with side length ${side}.`,
              answer: side * 4,
              explanation: `Perimeter = 4 × side = 4 × ${side} = ${side * 4}`
            };
          }
        }
      ],
      medium: [
        {
          type: "triangle",
          generate: () => {
            const base = Math.floor(Math.random() * 12) + 4; // 4-15
            const height = Math.floor(Math.random() * 10) + 3; // 3-12
            const area = Math.floor((base * height) / 2);
            return {
              text: `Find the area of a triangle with base ${base} and height ${height}.`,
              answer: area,
              explanation: `Area = (base × height) ÷ 2 = (${base} × ${height}) ÷ 2 = ${area}`
            };
          }
        },
        {
          type: "circle",
          generate: () => {
            const radius = Math.floor(Math.random() * 8) + 2; // 2-9
            const circumference = Math.round(2 * Math.PI * radius * 10) / 10; // Round to 1 decimal
            return {
              text: `Find the circumference of a circle with radius ${radius}. (Use π ≈ 3.14, round to nearest whole number)`,
              answer: Math.round(circumference),
              explanation: `Circumference = 2πr = 2 × 3.14 × ${radius} = ${circumference}`
            };
          }
        }
      ],
      hard: [
        {
          type: "cylinder",
          generate: () => {
            const radius = Math.floor(Math.random() * 6) + 2; // 2-7
            const height = Math.floor(Math.random() * 10) + 3; // 3-12
            const volume = Math.round(Math.PI * radius * radius * height);
            return {
              text: `Find the volume of a cylinder with radius ${radius} and height ${height}. (Use π ≈ 3.14)`,
              answer: volume,
              explanation: `Volume = πr²h = 3.14 × ${radius}² × ${height} = ${volume}`
            };
          }
        }
      ]
    };

    const shapeSet = shapes[difficulty];
    const selectedShape = shapeSet[Math.floor(Math.random() * shapeSet.length)];
    const problem = selectedShape.generate();
    
    return {
      id,
      text: problem.text,
      answer: problem.answer,
      difficulty,
      type: "geometry",
      timeLimit,
      category: "geometry",
      explanation: problem.explanation,
    };
  }

  // Generate a batch of questions for testing or caching
  generateQuestionBatch(count: number, difficulty: "easy" | "medium" | "hard", wave: number): Question[] {
    const questions: Question[] = [];
    for (let i = 0; i < count; i++) {
      questions.push(this.generateQuestion(difficulty, wave));
    }
    return questions;
  }

  // Get question statistics
  getQuestionStats(questions: Question[]) {
    const stats = {
      total: questions.length,
      byType: {} as Record<string, number>,
      byDifficulty: {} as Record<string, number>,
      averageAnswer: 0,
    };

    questions.forEach(q => {
      stats.byType[q.type] = (stats.byType[q.type] || 0) + 1;
      stats.byDifficulty[q.difficulty] = (stats.byDifficulty[q.difficulty] || 0) + 1;
      stats.averageAnswer += q.answer;
    });

    stats.averageAnswer = Math.round(stats.averageAnswer / questions.length);
    return stats;
  }
}

export const questionGenerator = new QuestionGenerator();
