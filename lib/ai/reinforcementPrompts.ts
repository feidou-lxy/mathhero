import type { Question } from "@/lib/types/practice";
import { GRADE2_CATEGORY_JSON } from "@/lib/curriculum/grade2";

export function buildReinforcementSystemPrompt(): string {
  return `你是一位小学二年级数学老师。请根据学生做错的题目，生成 2 道「同类型但更简单」的巩固练习题。
要求：
1. category 必须与原题完全相同
2. 数字比原题更小、更容易
3. 加减法：50 以内；乘法：2/5 的口诀；除法：被除数≤20
4. 应用题一步或简单两步，情境直观
5. 答案必须是整数
6. 只输出 JSON，不要 markdown

JSON 格式：
{
  "questions": [
    {
      "type": "basic" | "extension",
      "category": ${GRADE2_CATEGORY_JSON},
      "prompt": "题干",
      "answer": 整数,
      "unit": "可选"
    }
  ]
}`;
}

export function buildReinforcementUserPrompt(question: Question): string {
  return `学生做错了这道题：
题目：${question.prompt}
类型：${question.category}
难度标签：${question.type}${question.level ? ` / ${question.level}` : ""}
正确答案：${question.answer}${question.unit ?? ""}

请生成 2 道同类型（${question.category}）但更简单的巩固题，帮助打好基础。`;
}

export function buildMockReinforcement(question: Question): Question[] {
  const baseId = question.id * 100;

  const templates: Record<string, [Question, Question]> = {
    addition: [
      {
        id: baseId + 1,
        type: "basic",
        category: "addition",
        prompt: "23 + 18 = ?",
        answer: 41,
      },
      {
        id: baseId + 2,
        type: "basic",
        category: "addition",
        prompt: "35 + 27 = ?",
        answer: 62,
      },
    ],
    subtraction: [
      {
        id: baseId + 1,
        type: "basic",
        category: "subtraction",
        prompt: "45 - 18 = ?",
        answer: 27,
      },
      {
        id: baseId + 2,
        type: "basic",
        category: "subtraction",
        prompt: "52 - 24 = ?",
        answer: 28,
      },
    ],
    multiplication: [
      {
        id: baseId + 1,
        type: "basic",
        category: "multiplication",
        prompt: "2 × 5 = ?",
        answer: 10,
      },
      {
        id: baseId + 2,
        type: "basic",
        category: "multiplication",
        prompt: "5 × 3 = ?",
        answer: 15,
      },
    ],
    division: [
      {
        id: baseId + 1,
        type: "basic",
        category: "division",
        prompt: "10 ÷ 2 = ?",
        answer: 5,
      },
      {
        id: baseId + 2,
        type: "basic",
        category: "division",
        prompt: "15 ÷ 5 = ?",
        answer: 3,
      },
    ],
    two_step_word: [
      {
        id: baseId + 1,
        type: "basic",
        category: "two_step_word",
        prompt: "小明有 10 元，买铅笔花了 3 元，还剩多少元？",
        answer: 7,
        unit: "元",
      },
      {
        id: baseId + 2,
        type: "basic",
        category: "two_step_word",
        prompt: "小红有 8 个苹果，又买了 5 个，一共有几个？",
        answer: 13,
        unit: "个",
      },
    ],
    time_money: [
      {
        id: baseId + 1,
        type: "basic",
        category: "time_money",
        prompt: "一支铅笔 2 元，买 3 支要多少元？",
        answer: 6,
        unit: "元",
      },
      {
        id: baseId + 2,
        type: "basic",
        category: "time_money",
        prompt: "从 8 时到 10 时，经过了几个小时？",
        answer: 2,
        unit: "小时",
      },
    ],
    pattern_sequence: [
      {
        id: baseId + 1,
        type: "extension",
        category: "pattern_sequence",
        prompt: "找规律：1，3，5，7，（  ）",
        answer: 9,
      },
      {
        id: baseId + 2,
        type: "extension",
        category: "pattern_sequence",
        prompt: "找规律：2，4，6，8，（  ）",
        answer: 10,
      },
    ],
    logic_reasoning: [
      {
        id: baseId + 1,
        type: "extension",
        category: "logic_reasoning",
        prompt: "小明比小红高，小红比小华高，三人中最矮的是谁？（1=小华 2=小红 3=小明）",
        answer: 1,
      },
      {
        id: baseId + 2,
        type: "extension",
        category: "logic_reasoning",
        prompt: "甲、乙、丙三人，甲不是最高，乙比丙矮，最高的是谁？（1=甲 2=乙 3=丙）",
        answer: 3,
      },
    ],
    shape_pattern: [
      {
        id: baseId + 1,
        type: "extension",
        category: "shape_pattern",
        prompt: "按 ○△○△… 排列，第 6 个图形是 ○ 还是 △？（1=○ 2=△）",
        answer: 2,
      },
      {
        id: baseId + 2,
        type: "extension",
        category: "shape_pattern",
        prompt: "按 □○□○… 排列，第 5 个图形是 □ 还是 ○？（1=□ 2=○）",
        answer: 1,
      },
    ],
    multi_step_word: [
      {
        id: baseId + 1,
        type: "extension",
        category: "multi_step_word",
        prompt: "小明有 2 盒铅笔，每盒 5 支，又买了 3 支，一共有多少支？",
        answer: 13,
        unit: "支",
      },
      {
        id: baseId + 2,
        type: "extension",
        category: "multi_step_word",
        prompt: "图书角有 3 排书，每排 4 本，借走了 2 本，还剩多少本？",
        answer: 10,
        unit: "本",
      },
    ],
    clever_calc: [
      {
        id: baseId + 1,
        type: "extension",
        category: "clever_calc",
        prompt: "25 + 37 + 75 = ?",
        answer: 137,
      },
      {
        id: baseId + 2,
        type: "extension",
        category: "clever_calc",
        prompt: "99 + 6 = ?",
        answer: 105,
      },
    ],
  };

  return templates[question.category] ?? templates.addition;
}
