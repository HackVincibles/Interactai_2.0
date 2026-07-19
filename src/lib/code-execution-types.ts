// Type definitions for Python code execution with Pyodide

export interface TestCase {
  name: string;
  functionName: string; // e.g., "two_sum"
  args: (number | string | any[])[]; // e.g., [[2,7,11,15], 9]
  expected: any; // e.g., [0, 1]
}

export interface TestResult {
  status: "pass" | "fail" | "error" | "timeout";
  actual: any;
  expected: any;
  stdout: string;
  stderr: string;
  error?: string;
  executionTime: number;
}

// Message types for Web Worker communication
export interface WorkerMessage {
  id: string;
  type: "run-tests" | "run-single-test";
  code: string;
  tests?: TestCase[];
  test?: TestCase;
  testIndex?: number;
}

export interface WorkerResponse {
  id: string;
  type: "ready" | "results" | "error";
  results?: TestResult[];
  result?: TestResult;
  error?: string;
}
