/**
 * Code Analysis Types
 * 
 * Structured JSON output from Grok Code Fast 1 that describes
 * what the candidate is doing, their state, and any issues detected.
 * 
 * This feeds into the voice agent to provide contextual hints.
 */

export interface CandidateAnalysis {
  // Current state assessment
  state: CandidateState;
  
  // What approach they're taking
  approach: ApproachAnalysis;
  
  // Any issues or concerns detected
  issues: Issue[];
  
  // Suggested hint (if any) - voice agent decides whether to say it
  suggestedHint?: SuggestedHint;
  
  // Confidence in the analysis (0-1)
  confidence: number;
  
  // Timestamp
  analyzedAt: string;
}

export type CandidateState = 
  | "thinking"           // No code changes, might be reading/planning
  | "writing"            // Actively typing code
  | "debugging"          // Running tests, making small fixes
  | "stuck"              // Idle after failures, no progress
  | "making_progress"    // Tests improving, good direction
  | "off_track"          // Approach unlikely to work
  | "close_to_solution"  // Almost there, minor issues
  | "completed";         // All tests passing

export interface ApproachAnalysis {
  // What algorithm/pattern they're using
  pattern: string; // e.g., "brute_force", "hashmap", "two_pointer", "recursion"
  
  // Time complexity estimate
  timeComplexity: string; // e.g., "O(n^2)", "O(n)", "O(n log n)"
  
  // Space complexity estimate  
  spaceComplexity: string;
  
  // Is this approach viable for the problem?
  isViable: boolean;
  
  // If not viable, what's the issue?
  viabilityNote?: string;
}

export interface Issue {
  severity: "low" | "medium" | "high";
  type: IssueType;
  description: string;
  lineNumbers?: number[];
}

export type IssueType =
  | "syntax_error"
  | "logic_error"
  | "edge_case_missed"
  | "inefficient_approach"
  | "wrong_approach"
  | "incomplete_solution"
  | "off_by_one"
  | "type_error"
  | "infinite_loop_risk";

export interface SuggestedHint {
  // When to give this hint
  trigger: HintTrigger;
  
  // The hint text (Socratic, not giving answer)
  text: string;
  
  // How direct is this hint (1 = very subtle, 5 = very direct)
  directness: 1 | 2 | 3 | 4 | 5;
  
  // Priority (higher = more important to say)
  priority: number;
}

export type HintTrigger =
  | "immediate"        // Say it now
  | "on_next_failure"  // Wait for next test failure
  | "on_idle"          // Wait for candidate to be idle
  | "on_help_request"  // Only if they ask for help
  | "time_warning";    // Only if running low on time

/**
 * Request payload for code analysis API
 */
export interface CodeAnalysisRequest {
  sessionId: string;
  problemId: string;
  problemTitle: string;
  problemDescription: string;
  constraints: string[];
  
  // Current code
  code: string;
  language: string;
  
  // Recent test results (if any)
  lastTestResult?: {
    passedTests: number;
    totalTests: number;
    failingTests: Array<{
      input: string;
      expected: string;
      actual: string;
    }>;
  };
  
  // Context
  minutesElapsed: number;
  minutesRemaining: number;
  
  // Previous analysis (for continuity)
  previousState?: CandidateState;
}

/**
 * Prompt template for Grok Code Fast 1
 */
export const CODE_ANALYSIS_PROMPT = `You are an expert coding interview analyzer. Analyze the candidate's code and provide a structured assessment.

## Problem
{problemTitle}
{problemDescription}

Constraints: {constraints}

## Candidate's Code ({language})
\`\`\`{language}
{code}
\`\`\`

## Test Results
{testResults}

## Time Context
- Elapsed: {minutesElapsed} min
- Remaining: {minutesRemaining} min

## Previous State
{previousState}

---

Analyze the candidate's current state and approach. Output JSON matching this schema:

{
  "state": "thinking" | "writing" | "debugging" | "stuck" | "making_progress" | "off_track" | "close_to_solution" | "completed",
  "approach": {
    "pattern": "string describing the algorithm pattern",
    "timeComplexity": "O(...)",
    "spaceComplexity": "O(...)",
    "isViable": boolean,
    "viabilityNote": "string if not viable"
  },
  "issues": [
    {
      "severity": "low" | "medium" | "high",
      "type": "syntax_error" | "logic_error" | "edge_case_missed" | "inefficient_approach" | "wrong_approach" | "incomplete_solution" | "off_by_one" | "type_error" | "infinite_loop_risk",
      "description": "string",
      "lineNumbers": [numbers]
    }
  ],
  "suggestedHint": {
    "trigger": "immediate" | "on_next_failure" | "on_idle" | "on_help_request" | "time_warning",
    "text": "Socratic hint that guides without giving answer",
    "directness": 1-5,
    "priority": number
  },
  "confidence": 0.0-1.0
}

Important:
- Be Socratic - hints should guide thinking, not give answers
- Consider the time remaining when assessing urgency
- Detect common patterns: nested loops (O(n²)), hashmap opportunities, edge cases
- If tests are passing, state should be "making_progress" or "completed"
- Only suggest hints when genuinely helpful

Output ONLY valid JSON, no explanation.`;

