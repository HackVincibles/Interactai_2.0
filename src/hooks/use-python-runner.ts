"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { TestCase, TestResult, WorkerMessage, WorkerResponse } from "@/lib/code-execution-types";

interface UsePythonRunnerReturn {
  isLoading: boolean;
  isRunning: boolean;
  runTests: (code: string, tests: TestCase[]) => Promise<TestResult[]>;
  runSingleTest: (code: string, test: TestCase, index: number) => Promise<TestResult>;
}

export function usePythonRunner(): UsePythonRunnerReturn {
  const [isLoading, setIsLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const workerRef = useRef<Worker | null>(null);
  const isReadyRef = useRef(false);
  const callbacksRef = useRef<Map<string, { resolve: (value: any) => void; reject: (error: any) => void }>>(
    new Map()
  );

  // Initialize worker
  useEffect(() => {
    // Create worker from public folder (Next.js compatible)
    const worker = new Worker("/python-worker.js", { type: "classic" });

    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const { id, type, results, result, error } = event.data;

      // Handle initial ready message
      if (type === "ready") {
        if (id === "init") {
          // Worker is loaded (Pyodide will initialize on first use)
          setIsLoading(false);
          isReadyRef.current = true;
        }
        return;
      }

      const callback = callbacksRef.current.get(id);
      if (callback) {
        callbacksRef.current.delete(id);
        if (error) {
          callback.reject(new Error(error));
        } else if (results) {
          callback.resolve(results);
        } else if (result) {
          callback.resolve(result);
        }
      }
    };

    worker.onerror = (error) => {
      console.error("Worker error:", error);
      setIsLoading(false);
      setIsRunning(false);
    };

    workerRef.current = worker;

    return () => {
      // Cleanup: terminate worker and clear callbacks
      callbacksRef.current.clear();
      worker.terminate();
    };
  }, []);

  const runTests = useCallback(
    async (code: string, tests: TestCase[]): Promise<TestResult[]> => {
      if (!workerRef.current) {
        throw new Error("Python runner is not initialized");
      }
      
      // Wait for worker to be ready (Pyodide initializes on first use)
      if (!isReadyRef.current) {
        await new Promise<void>((resolve) => {
          const checkReady = setInterval(() => {
            if (isReadyRef.current) {
              clearInterval(checkReady);
              resolve();
            }
          }, 100);
          // Timeout after 30 seconds
          setTimeout(() => {
            clearInterval(checkReady);
            resolve();
          }, 30000);
        });
      }

      setIsRunning(true);
      const id = `run-tests-${Date.now()}-${Math.random()}`;

      return new Promise<TestResult[]>((resolve, reject) => {
        callbacksRef.current.set(id, { resolve, reject });

        const message: WorkerMessage = {
          id,
          type: "run-tests",
          code,
          tests,
        };

        workerRef.current?.postMessage(message);

        // Timeout after 30 seconds (should be longer than individual test timeout)
        setTimeout(() => {
          if (callbacksRef.current.has(id)) {
            callbacksRef.current.delete(id);
            reject(new Error("Test execution timed out"));
            setIsRunning(false);
          }
        }, 30000);
      })
        .then((results) => {
          setIsRunning(false);
          return results;
        })
        .catch((error) => {
          setIsRunning(false);
          throw error;
        });
    },
    []
  );

  const runSingleTest = useCallback(
    async (code: string, test: TestCase, index: number): Promise<TestResult> => {
      if (!workerRef.current) {
        throw new Error("Python runner is not initialized");
      }
      
      // Wait for worker to be ready (Pyodide initializes on first use)
      if (!isReadyRef.current) {
        await new Promise<void>((resolve) => {
          const checkReady = setInterval(() => {
            if (isReadyRef.current) {
              clearInterval(checkReady);
              resolve();
            }
          }, 100);
          // Timeout after 30 seconds
          setTimeout(() => {
            clearInterval(checkReady);
            resolve();
          }, 30000);
        });
      }

      setIsRunning(true);
      const id = `run-single-${Date.now()}-${Math.random()}`;

      return new Promise<TestResult>((resolve, reject) => {
        callbacksRef.current.set(id, { resolve, reject });

        const message: WorkerMessage = {
          id,
          type: "run-single-test",
          code,
          test,
          testIndex: index,
        };

        workerRef.current?.postMessage(message);

        // Timeout after 10 seconds
        setTimeout(() => {
          if (callbacksRef.current.has(id)) {
            callbacksRef.current.delete(id);
            reject(new Error("Test execution timed out"));
            setIsRunning(false);
          }
        }, 10000);
      })
        .then((result) => {
          setIsRunning(false);
          return result;
        })
        .catch((error) => {
          setIsRunning(false);
          throw error;
        });
    },
    []
  );

  return {
    isLoading,
    isRunning,
    runTests,
    runSingleTest,
  };
}
