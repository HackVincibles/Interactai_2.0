// Web Worker for executing Python code using Pyodide
// This runs in a separate thread to avoid blocking the UI

let pyodide = null;
let isInitialized = false;

// Initialize Pyodide on worker startup
async function initializePyodide() {
  if (isInitialized && pyodide) {
    return pyodide;
  }

  // Import Pyodide from CDN
  self.importScripts("https://cdn.jsdelivr.net/pyodide/v0.29.0/full/pyodide.js");

  // Load Pyodide
  pyodide = await self.loadPyodide({
    indexURL: "https://cdn.jsdelivr.net/pyodide/v0.29.0/full/",
  });

  isInitialized = true;
  return pyodide;
}

// Format Python exception traceback
function formatPythonException() {
  try {
    const formatException = pyodide.runPython(`
import traceback
import sys

def format_exception():
    return "".join(traceback.format_exception(
        sys.last_type, sys.last_value, sys.last_traceback
    ))
format_exception
    `);
    return formatException();
  } catch {
    return "Error formatting exception";
  }
}

// Execute a single test case
async function executeTest(code, test, timeoutMs = 5000) {
  const startTime = performance.now();
  let stdout = "";
  let stderr = "";

  // Set up stdout/stderr capture
  pyodide.setStdout({
    batched: (line) => {
      stdout += line + "\n";
    },
    isatty: false,
  });

  pyodide.setStderr({
    batched: (line) => {
      stderr += line + "\n";
    },
    isatty: false,
  });

  let func = null;
  
  try {
    // First, run the user's code to define the function
    pyodide.runPython(code);

    // Get the function from Python globals
    func = pyodide.globals.get(test.functionName);
    if (!func) {
      throw new Error(`Function '${test.functionName}' not defined`);
    }

    // Execute with timeout protection using a Promise wrapper
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Execution timed out after ${timeoutMs}ms`)), timeoutMs);
    });

    // Call the function directly with arguments
    // Pyodide automatically converts JS arrays/values to Python
    const executionPromise = Promise.resolve().then(() => {
      return func(...test.args);
    });

    let result;
    try {
      result = await Promise.race([executionPromise, timeoutPromise]);
    } catch (error) {
      if (error.message && error.message.includes("timed out")) {
        const executionTime = Math.round(performance.now() - startTime);
        return {
          status: "timeout",
          actual: null,
          expected: test.expected,
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          error: error.message,
          executionTime,
        };
      }
      throw error;
    }

    // Convert result to JavaScript
    let jsResult;
    if (result && typeof result.toJs === "function") {
      jsResult = result.toJs({ dict_converter: Object.fromEntries });
      result.destroy();
    } else {
      jsResult = result;
    }

    const executionTime = Math.round(performance.now() - startTime);

    // Compare results (deep equality)
    const actualStr = JSON.stringify(jsResult);
    const expectedStr = JSON.stringify(test.expected);
    const passed = actualStr === expectedStr;

    return {
      status: passed ? "pass" : "fail",
      actual: jsResult,
      expected: test.expected,
      stdout: stdout.trim(),
      stderr: stderr.trim(),
      executionTime,
    };
  } catch (error) {
    const executionTime = Math.round(performance.now() - startTime);
    let errorMessage = error.message || String(error);

    // Try to get Python traceback if available
    try {
      const traceback = formatPythonException();
      if (traceback) {
        errorMessage = traceback;
      }
    } catch {
      // Fall back to JavaScript error message
    }

    return {
      status: "error",
      actual: null,
      expected: test.expected,
      stdout: stdout.trim(),
      stderr: stderr.trim(),
      error: errorMessage,
      executionTime,
    };
  }
}

// Handle messages from main thread
self.onmessage = async (event) => {
  const { id, type, code, tests, test, testIndex } = event.data;

  try {
    // Initialize Pyodide if not already done
    if (!isInitialized) {
      await initializePyodide();
      self.postMessage({ id, type: "ready" });
    }

    if (type === "run-tests" && tests) {
      // Execute all tests
      const results = [];
      for (const testCase of tests) {
        const result = await executeTest(code, testCase);
        results.push(result);
      }

      self.postMessage({
        id,
        type: "results",
        results,
      });
    } else if (type === "run-single-test" && test !== undefined) {
      // Execute single test
      const result = await executeTest(code, test);
      self.postMessage({
        id,
        type: "results",
        result,
      });
    }
  } catch (error) {
    self.postMessage({
      id,
      type: "error",
      error: error.message || String(error),
    });
  }
};

// Send ready message when worker loads
self.postMessage({ id: "init", type: "ready" });
