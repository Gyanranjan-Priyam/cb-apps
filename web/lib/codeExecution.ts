// Simulated code execution - In production, you'd use a real code execution API
export interface TestCase {
  input: string;
  expectedOutput: string;
  isHidden: boolean;
}

export interface TestResult {
  passed: boolean;
  input: string;
  expectedOutput: string;
  actualOutput?: string;
  error?: string;
}

export interface ExecutionResult {
  status: "Accepted" | "Wrong Answer" | "Runtime Error" | "Compilation Error" | "Time Limit Exceeded";
  testResults: TestResult[];
  runtime: number;
  memory: number;
  errorMessage?: string;
}

// Simulate code execution (replace with actual API call)
export async function executeCode(
  code: string,
  language: string,
  testCases: TestCase[],
  isSubmission: boolean = false,
  solution?: Record<string, string | undefined>
): Promise<ExecutionResult> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  const runtime = Math.floor(Math.random() * 150) + 10;
  const memory = Math.floor(Math.random() * 20000) + 5000;

  // Filter test cases based on whether this is a submission
  const casesToRun = isSubmission 
    ? testCases 
    : testCases.filter(tc => !tc.isHidden).slice(0, 3);

  // Check if code is empty or only contains starter code
  const normalizedCode = normalizeCode(code);
  const isEmptyCode = normalizedCode.length < 20 || 
                      !hasActualImplementation(code, language);

  if (isEmptyCode) {
    return {
      status: "Compilation Error",
      testResults: casesToRun.map(tc => ({
        passed: false,
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        actualOutput: undefined,
        error: "No implementation found. Please write your solution code.",
      })),
      runtime: 0,
      memory: 0,
      errorMessage: "Compilation Error: No valid code implementation found. Your function must contain actual logic to solve the problem.",
    };
  }

  // Check if code is similar to solution (basic validation)
  let codeQuality = 0.5; // Default quality
  if (solution && solution[language]) {
    const normalizedSolution = normalizeCode(solution[language] || "");
    
    // Calculate similarity (basic check for key patterns)
    const similarityScore = calculateSimilarity(normalizedCode, normalizedSolution);
    codeQuality = similarityScore;
  }

  // Better code gets better pass rate (minimum 0.3 to allow some failures)
  const basePassRate = Math.max(0.3, Math.min(0.9, codeQuality));

  // Generate test results
  const testResults: TestResult[] = casesToRun.map((testCase, idx) => {
    // Determine if test passes based on code quality
    const randomFactor = Math.random();
    const passed = randomFactor < basePassRate;
    
    if (!passed) {
      return {
        passed: false,
        input: testCase.input,
        expectedOutput: testCase.expectedOutput,
        actualOutput: generateWrongOutput(testCase.expectedOutput),
        error: undefined,
      };
    }
    
    return {
      passed: true,
      input: testCase.input,
      expectedOutput: testCase.expectedOutput,
      actualOutput: testCase.expectedOutput,
      error: undefined,
    };
  });

  const allPassed = testResults.every(r => r.passed);
  const status = allPassed ? "Accepted" : "Wrong Answer";

  return {
    status,
    testResults,
    runtime,
    memory,
  };
}

// Check if code has actual implementation
function hasActualImplementation(code: string, language: string): boolean {
  const normalized = normalizeCode(code);
  
  // Remove common starter code patterns
  const withoutComments = code
    .replace(/\/\/.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/#.*$/gm, '')
    .trim();
  
  // Check for return statements that aren't just "return 0", "return []", etc.
  const hasNonTrivialReturn = 
    /return\s+(?!0|null|undefined|None|false|true|""|\[\]|\{\})/i.test(withoutComments);
  
  // Check for loops or conditional logic
  const hasLogic = 
    /\b(for|while|if|else|switch|map|filter|reduce|forEach)\b/i.test(withoutComments);
  
  // Check for variable assignments or calculations
  const hasCalculations = 
    /[=+\-*/](?!=)/g.test(withoutComments.replace(/==|!=|<=|>=|===|!==/, ''));
  
  // Code must have some logic or meaningful return
  return hasLogic || hasNonTrivialReturn || (hasCalculations && normalized.length > 50);
}

// Normalize code by removing comments and extra whitespace
function normalizeCode(code: string): string {
  return code
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
    .replace(/\/\/.*/g, '') // Remove line comments
    .replace(/#.*/g, '') // Remove Python comments
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
    .toLowerCase();
}

// Calculate similarity between two code strings
function calculateSimilarity(code1: string, code2: string): number {
  if (!code1 || !code2) return 0.5;
  
  // Check for common patterns
  const patterns = [
    'for', 'while', 'if', 'else', 'return', 'function',
    'class', 'public', 'private', 'void', 'int', 'string',
    'const', 'let', 'var', 'def', 'lambda'
  ];
  
  let matchCount = 0;
  for (const pattern of patterns) {
    const inCode1 = code1.includes(pattern);
    const inCode2 = code2.includes(pattern);
    if (inCode1 === inCode2) matchCount++;
  }
  
  // Basic similarity score
  const patternScore = matchCount / patterns.length;
  
  // Length similarity (solutions should be reasonably sized)
  const lengthRatio = Math.min(code1.length, code2.length) / Math.max(code1.length, code2.length);
  
  return (patternScore * 0.6) + (lengthRatio * 0.4);
}

function generateWrongOutput(expected: string): string {
  // Generate a plausible but incorrect output
  const num = parseInt(expected);
  if (!isNaN(num)) {
    return String(num + 1);
  }
  return expected.split('').reverse().join('');
}

// Language configurations
export const SUPPORTED_LANGUAGES = {
  cpp: { id: 54, name: "C++" },
  java: { id: 62, name: "Java" },
  python: { id: 70, name: "Python 2" },
  python3: { id: 71, name: "Python 3" },
  c: { id: 50, name: "C" },
  csharp: { id: 51, name: "C#" },
  javascript: { id: 63, name: "JavaScript (Node.js)" },
  typescript: { id: 74, name: "TypeScript" },
};

// Default starter code templates
export const DEFAULT_STARTER_CODE = {
  cpp: `class Solution {
public:
    int solve(vector<int>& nums) {
        // Write your code here
        return 0;
    }
};`,
  
  java: `class Solution {
    public int solve(int[] nums) {
        // Write your code here
        return 0;
    }
}`,
  
  python: `class Solution(object):
    def solve(self, nums):
        """
        :type nums: List[int]
        :rtype: int
        """
        # Write your code here
        return 0`,
  
  python3: `class Solution:
    def solve(self, nums: List[int]) -> int:
        # Write your code here
        return 0`,
  
  c: `int solve(int* nums, int numsSize) {
    // Write your code here
    return 0;
}`,
  
  csharp: `public class Solution {
    public int Solve(int[] nums) {
        // Write your code here
        return 0;
    }
}`,
  
  javascript: `/**
 * @param {number[]} nums
 * @return {number}
 */
var solve = function(nums) {
    // Write your code here
    return 0;
};`,
  
  typescript: `function solve(nums: number[]): number {
    // Write your code here
    return 0;
}`,
};
