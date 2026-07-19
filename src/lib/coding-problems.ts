// Coding problems library - Easy problems solvable in ~15 minutes

export interface Example {
  input: string;
  output: string;
  explanation?: string;
}

export interface StructuredTestCase {
  name: string;
  functionName: string;
  args: any[];
  expected: any;
}

export interface CodingProblem {
  id: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  description: string;
  examples: Example[];
  constraints: string[];
  starterCode: {
    python: string;
    javascript: string;
    cpp: string;
  };
  hints: string[];
  testCases: StructuredTestCase[];
}

export const CODING_PROBLEMS: CodingProblem[] = [
  // 1. Two Sum
  {
    id: "two-sum",
    title: "Two Sum",
    difficulty: "Easy",
    description: `Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

You can return the answer in any order.`,
    examples: [
      {
        input: "nums = [2,7,11,15], target = 9",
        output: "[0,1]",
        explanation: "Because nums[0] + nums[1] == 9, we return [0, 1].",
      },
      {
        input: "nums = [3,2,4], target = 6",
        output: "[1,2]",
      },
      {
        input: "nums = [3,3], target = 6",
        output: "[0,1]",
      },
    ],
    constraints: [
      "2 ≤ nums.length ≤ 10⁴",
      "-10⁹ ≤ nums[i] ≤ 10⁹",
      "-10⁹ ≤ target ≤ 10⁹",
      "Only one valid answer exists.",
    ],
    starterCode: {
      python: `def two_sum(nums, target):
    # Your code here
    pass`,
      javascript: `function twoSum(nums, target) {
    // Your code here
}`,
      cpp: `class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        // Your code here
    }
};`,
    },
    hints: [
      "A brute force approach would check all pairs - O(n²) time.",
      "Can you reduce lookup time from O(n) to O(1) using a hash map?",
      "For each element, check if (target - current) exists in the map.",
    ],
    testCases: [
      { name: "Case 1", functionName: "two_sum", args: [[2, 7, 11, 15], 9], expected: [0, 1] },
      { name: "Case 2", functionName: "two_sum", args: [[3, 2, 4], 6], expected: [1, 2] },
      { name: "Case 3", functionName: "two_sum", args: [[3, 3], 6], expected: [0, 1] },
      { name: "Large numbers", functionName: "two_sum", args: [[1000000, 500000, 500000], 1000000], expected: [1, 2] },
    ],
  },

  // 2. Valid Palindrome
  {
    id: "valid-palindrome",
    title: "Valid Palindrome",
    difficulty: "Easy",
    description: `A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward. Alphanumeric characters include letters and numbers.

Given a string s, return true if it is a palindrome, or false otherwise.`,
    examples: [
      {
        input: 's = "A man, a plan, a canal: Panama"',
        output: "true",
        explanation: '"amanaplanacanalpanama" is a palindrome.',
      },
      {
        input: 's = "race a car"',
        output: "false",
        explanation: '"raceacar" is not a palindrome.',
      },
      {
        input: 's = " "',
        output: "true",
        explanation: "After removing non-alphanumeric characters, s is empty. An empty string is a palindrome.",
      },
    ],
    constraints: [
      "1 ≤ s.length ≤ 2 × 10⁵",
      "s consists only of printable ASCII characters.",
    ],
    starterCode: {
      python: `def is_palindrome(s):
    # Your code here
    pass`,
      javascript: `function isPalindrome(s) {
    // Your code here
}`,
      cpp: `class Solution {
public:
    bool isPalindrome(string s) {
        // Your code here
    }
};`,
    },
    hints: [
      "First, clean the string by removing non-alphanumeric characters and converting to lowercase.",
      "Compare the cleaned string with its reverse.",
      "Alternatively, use two pointers from both ends moving inward.",
    ],
    testCases: [
      { name: "Palindrome with spaces", functionName: "is_palindrome", args: ["A man, a plan, a canal: Panama"], expected: true },
      { name: "Not a palindrome", functionName: "is_palindrome", args: ["race a car"], expected: false },
      { name: "Empty/whitespace", functionName: "is_palindrome", args: [" "], expected: true },
      { name: "Single char", functionName: "is_palindrome", args: ["a"], expected: true },
    ],
  },

  // 3. Reverse String
  {
    id: "reverse-string",
    title: "Reverse String",
    difficulty: "Easy",
    description: `Write a function that reverses a string. The input string is given as an array of characters s.

You must do this by modifying the input array in-place with O(1) extra memory.`,
    examples: [
      {
        input: 's = ["h","e","l","l","o"]',
        output: '["o","l","l","e","h"]',
      },
      {
        input: 's = ["H","a","n","n","a","h"]',
        output: '["h","a","n","n","a","H"]',
      },
    ],
    constraints: [
      "1 ≤ s.length ≤ 10⁵",
      "s[i] is a printable ASCII character.",
    ],
    starterCode: {
      python: `def reverse_string(s):
    # Modify s in-place
    pass`,
      javascript: `function reverseString(s) {
    // Modify s in-place
}`,
      cpp: `class Solution {
public:
    void reverseString(vector<char>& s) {
        // Modify s in-place
    }
};`,
    },
    hints: [
      "Use two pointers: one at the start, one at the end.",
      "Swap characters at both pointers, then move them toward the center.",
      "Stop when the pointers meet or cross.",
    ],
    testCases: [
      { name: "Hello", functionName: "reverse_string", args: [["h", "e", "l", "l", "o"]], expected: ["o", "l", "l", "e", "h"] },
      { name: "Hannah", functionName: "reverse_string", args: [["H", "a", "n", "n", "a", "h"]], expected: ["h", "a", "n", "n", "a", "H"] },
      { name: "Single char", functionName: "reverse_string", args: [["a"]], expected: ["a"] },
      { name: "Two chars", functionName: "reverse_string", args: [["a", "b"]], expected: ["b", "a"] },
    ],
  },

  // 4. FizzBuzz
  {
    id: "fizz-buzz",
    title: "FizzBuzz",
    difficulty: "Easy",
    description: `Given an integer n, return a string array answer (1-indexed) where:

• answer[i] == "FizzBuzz" if i is divisible by 3 and 5.
• answer[i] == "Fizz" if i is divisible by 3.
• answer[i] == "Buzz" if i is divisible by 5.
• answer[i] == i (as a string) if none of the above conditions are true.`,
    examples: [
      {
        input: "n = 3",
        output: '["1","2","Fizz"]',
      },
      {
        input: "n = 5",
        output: '["1","2","Fizz","4","Buzz"]',
      },
      {
        input: "n = 15",
        output: '["1","2","Fizz","4","Buzz","Fizz","7","8","Fizz","Buzz","11","Fizz","13","14","FizzBuzz"]',
      },
    ],
    constraints: ["1 ≤ n ≤ 10⁴"],
    starterCode: {
      python: `def fizz_buzz(n):
    # Your code here
    pass`,
      javascript: `function fizzBuzz(n) {
    // Your code here
}`,
      cpp: `class Solution {
public:
    vector<string> fizzBuzz(int n) {
        // Your code here
    }
};`,
    },
    hints: [
      "Iterate from 1 to n.",
      "Check divisibility by 15 first (both 3 and 5), then 3, then 5.",
      "Use the modulo operator (%) to check divisibility.",
    ],
    testCases: [
      { name: "n = 3", functionName: "fizz_buzz", args: [3], expected: ["1", "2", "Fizz"] },
      { name: "n = 5", functionName: "fizz_buzz", args: [5], expected: ["1", "2", "Fizz", "4", "Buzz"] },
      { name: "n = 15", functionName: "fizz_buzz", args: [15], expected: ["1", "2", "Fizz", "4", "Buzz", "Fizz", "7", "8", "Fizz", "Buzz", "11", "Fizz", "13", "14", "FizzBuzz"] },
      { name: "n = 1", functionName: "fizz_buzz", args: [1], expected: ["1"] },
    ],
  },

  // 5. Maximum Subarray (Kadane's Algorithm)
  {
    id: "maximum-subarray",
    title: "Maximum Subarray",
    difficulty: "Easy",
    description: `Given an integer array nums, find the subarray with the largest sum, and return its sum.

A subarray is a contiguous non-empty sequence of elements within an array.`,
    examples: [
      {
        input: "nums = [-2,1,-3,4,-1,2,1,-5,4]",
        output: "6",
        explanation: "The subarray [4,-1,2,1] has the largest sum 6.",
      },
      {
        input: "nums = [1]",
        output: "1",
        explanation: "The subarray [1] has the largest sum 1.",
      },
      {
        input: "nums = [5,4,-1,7,8]",
        output: "23",
        explanation: "The subarray [5,4,-1,7,8] has the largest sum 23.",
      },
    ],
    constraints: [
      "1 ≤ nums.length ≤ 10⁵",
      "-10⁴ ≤ nums[i] ≤ 10⁴",
    ],
    starterCode: {
      python: `def max_subarray(nums):
    # Your code here
    pass`,
      javascript: `function maxSubArray(nums) {
    // Your code here
}`,
      cpp: `class Solution {
public:
    int maxSubArray(vector<int>& nums) {
        // Your code here
    }
};`,
    },
    hints: [
      "This is a classic dynamic programming problem.",
      "At each position, decide: start a new subarray or extend the current one?",
      "Kadane's algorithm: current_sum = max(num, current_sum + num)",
    ],
    testCases: [
      { name: "Mixed array", functionName: "max_subarray", args: [[-2, 1, -3, 4, -1, 2, 1, -5, 4]], expected: 6 },
      { name: "Single element", functionName: "max_subarray", args: [[1]], expected: 1 },
      { name: "All positive", functionName: "max_subarray", args: [[5, 4, -1, 7, 8]], expected: 23 },
      { name: "All negative", functionName: "max_subarray", args: [[-3, -2, -5, -1]], expected: -1 },
    ],
  },

  // 6. Valid Parentheses
  {
    id: "valid-parentheses",
    title: "Valid Parentheses",
    difficulty: "Easy",
    description: `Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.`,
    examples: [
      {
        input: 's = "()"',
        output: "true",
      },
      {
        input: 's = "()[]{}"',
        output: "true",
      },
      {
        input: 's = "(]"',
        output: "false",
      },
    ],
    constraints: [
      "1 ≤ s.length ≤ 10⁴",
      "s consists of parentheses only '()[]{}'.",
    ],
    starterCode: {
      python: `def is_valid(s):
    # Your code here
    pass`,
      javascript: `function isValid(s) {
    // Your code here
}`,
      cpp: `class Solution {
public:
    bool isValid(string s) {
        // Your code here
    }
};`,
    },
    hints: [
      "Use a stack to track opening brackets.",
      "When you see a closing bracket, check if it matches the top of the stack.",
      "At the end, the stack should be empty for a valid string.",
    ],
    testCases: [
      { name: "Simple pair", functionName: "is_valid", args: ["()"], expected: true },
      { name: "Multiple types", functionName: "is_valid", args: ["()[]{}"], expected: true },
      { name: "Mismatched", functionName: "is_valid", args: ["(]"], expected: false },
      { name: "Nested", functionName: "is_valid", args: ["{[()]}"], expected: true },
      { name: "Wrong order", functionName: "is_valid", args: ["([)]"], expected: false },
    ],
  },

  // 7. Merge Two Sorted Lists (return as array for simplicity)
  {
    id: "merge-sorted-arrays",
    title: "Merge Two Sorted Arrays",
    difficulty: "Easy",
    description: `You are given two integer arrays nums1 and nums2, sorted in non-decreasing order.

Merge nums1 and nums2 into a single array sorted in non-decreasing order and return it.`,
    examples: [
      {
        input: "nums1 = [1,2,4], nums2 = [1,3,4]",
        output: "[1,1,2,3,4,4]",
      },
      {
        input: "nums1 = [], nums2 = [0]",
        output: "[0]",
      },
      {
        input: "nums1 = [1], nums2 = []",
        output: "[1]",
      },
    ],
    constraints: [
      "0 ≤ nums1.length, nums2.length ≤ 200",
      "-10⁹ ≤ nums1[i], nums2[j] ≤ 10⁹",
      "nums1 and nums2 are sorted in non-decreasing order.",
    ],
    starterCode: {
      python: `def merge_sorted_arrays(nums1, nums2):
    # Your code here
    pass`,
      javascript: `function mergeSortedArrays(nums1, nums2) {
    // Your code here
}`,
      cpp: `class Solution {
public:
    vector<int> mergeSortedArrays(vector<int>& nums1, vector<int>& nums2) {
        // Your code here
    }
};`,
    },
    hints: [
      "Use two pointers, one for each array.",
      "Compare elements at both pointers, add the smaller one to result.",
      "Don't forget to handle remaining elements when one array is exhausted.",
    ],
    testCases: [
      { name: "Equal length", functionName: "merge_sorted_arrays", args: [[1, 2, 4], [1, 3, 4]], expected: [1, 1, 2, 3, 4, 4] },
      { name: "First empty", functionName: "merge_sorted_arrays", args: [[], [0]], expected: [0] },
      { name: "Second empty", functionName: "merge_sorted_arrays", args: [[1], []], expected: [1] },
      { name: "No overlap", functionName: "merge_sorted_arrays", args: [[1, 2], [3, 4]], expected: [1, 2, 3, 4] },
    ],
  },

  // 8. Contains Duplicate
  {
    id: "contains-duplicate",
    title: "Contains Duplicate",
    difficulty: "Easy",
    description: `Given an integer array nums, return true if any value appears at least twice in the array, and return false if every element is distinct.`,
    examples: [
      {
        input: "nums = [1,2,3,1]",
        output: "true",
      },
      {
        input: "nums = [1,2,3,4]",
        output: "false",
      },
      {
        input: "nums = [1,1,1,3,3,4,3,2,4,2]",
        output: "true",
      },
    ],
    constraints: [
      "1 ≤ nums.length ≤ 10⁵",
      "-10⁹ ≤ nums[i] ≤ 10⁹",
    ],
    starterCode: {
      python: `def contains_duplicate(nums):
    # Your code here
    pass`,
      javascript: `function containsDuplicate(nums) {
    // Your code here
}`,
      cpp: `class Solution {
public:
    bool containsDuplicate(vector<int>& nums) {
        // Your code here
    }
};`,
    },
    hints: [
      "A brute force approach compares every pair - O(n²).",
      "Using a hash set gives O(n) time complexity.",
      "Compare the length of the array with the size of a set created from it.",
    ],
    testCases: [
      { name: "Has duplicate", functionName: "contains_duplicate", args: [[1, 2, 3, 1]], expected: true },
      { name: "All unique", functionName: "contains_duplicate", args: [[1, 2, 3, 4]], expected: false },
      { name: "Multiple duplicates", functionName: "contains_duplicate", args: [[1, 1, 1, 3, 3, 4, 3, 2, 4, 2]], expected: true },
      { name: "Single element", functionName: "contains_duplicate", args: [[1]], expected: false },
    ],
  },

  // 9. Best Time to Buy and Sell Stock
  {
    id: "best-time-to-buy-sell-stock",
    title: "Best Time to Buy and Sell Stock",
    difficulty: "Easy",
    description: `You are given an array prices where prices[i] is the price of a given stock on the iᵗʰ day.

You want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock.

Return the maximum profit you can achieve from this transaction. If you cannot achieve any profit, return 0.`,
    examples: [
      {
        input: "prices = [7,1,5,3,6,4]",
        output: "5",
        explanation: "Buy on day 2 (price = 1) and sell on day 5 (price = 6), profit = 6-1 = 5.",
      },
      {
        input: "prices = [7,6,4,3,1]",
        output: "0",
        explanation: "No transactions are done, max profit = 0.",
      },
    ],
    constraints: [
      "1 ≤ prices.length ≤ 10⁵",
      "0 ≤ prices[i] ≤ 10⁴",
    ],
    starterCode: {
      python: `def max_profit(prices):
    # Your code here
    pass`,
      javascript: `function maxProfit(prices) {
    // Your code here
}`,
      cpp: `class Solution {
public:
    int maxProfit(vector<int>& prices) {
        // Your code here
    }
};`,
    },
    hints: [
      "Track the minimum price seen so far as you iterate.",
      "At each step, calculate profit if you sold at current price.",
      "Keep track of the maximum profit found.",
    ],
    testCases: [
      { name: "Normal case", functionName: "max_profit", args: [[7, 1, 5, 3, 6, 4]], expected: 5 },
      { name: "Decreasing prices", functionName: "max_profit", args: [[7, 6, 4, 3, 1]], expected: 0 },
      { name: "Single day", functionName: "max_profit", args: [[5]], expected: 0 },
      { name: "Two days profit", functionName: "max_profit", args: [[1, 2]], expected: 1 },
    ],
  },

  // 10. Climbing Stairs
  {
    id: "climbing-stairs",
    title: "Climbing Stairs",
    difficulty: "Easy",
    description: `You are climbing a staircase. It takes n steps to reach the top.

Each time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?`,
    examples: [
      {
        input: "n = 2",
        output: "2",
        explanation: "There are two ways: (1+1) and (2).",
      },
      {
        input: "n = 3",
        output: "3",
        explanation: "There are three ways: (1+1+1), (1+2), and (2+1).",
      },
    ],
    constraints: ["1 ≤ n ≤ 45"],
    starterCode: {
      python: `def climb_stairs(n):
    # Your code here
    pass`,
      javascript: `function climbStairs(n) {
    // Your code here
}`,
      cpp: `class Solution {
public:
    int climbStairs(int n) {
        // Your code here
    }
};`,
    },
    hints: [
      "This is a Fibonacci-like problem.",
      "ways(n) = ways(n-1) + ways(n-2)",
      "Base cases: ways(1) = 1, ways(2) = 2",
    ],
    testCases: [
      { name: "n = 2", functionName: "climb_stairs", args: [2], expected: 2 },
      { name: "n = 3", functionName: "climb_stairs", args: [3], expected: 3 },
      { name: "n = 4", functionName: "climb_stairs", args: [4], expected: 5 },
      { name: "n = 5", functionName: "climb_stairs", args: [5], expected: 8 },
      { name: "n = 1", functionName: "climb_stairs", args: [1], expected: 1 },
    ],
  },
];

// Helper to get problem by ID
export function getProblemById(id: string): CodingProblem | undefined {
  return CODING_PROBLEMS.find((p) => p.id === id);
}

// Get a random problem
export function getRandomProblem(): CodingProblem {
  const index = Math.floor(Math.random() * CODING_PROBLEMS.length);
  return CODING_PROBLEMS[index];
}

// Get problems by difficulty
export function getProblemsByDifficulty(difficulty: "Easy" | "Medium" | "Hard"): CodingProblem[] {
  return CODING_PROBLEMS.filter((p) => p.difficulty === difficulty);
}
