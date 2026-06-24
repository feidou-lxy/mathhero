import type {
  PracticeLevel,
  PracticeSet,
  RawAIQuestionResponse,
} from "@/lib/types/practice";

export function getTodayDateString(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function buildGrade1MockResponse(): RawAIQuestionResponse {
  return {
    questions: [
      {
        type: "basic",
        category: "addition",
        prompt: "3 + 5 = ?",
        answer: 8,
      },
      {
        type: "basic",
        category: "addition",
        prompt: "7 + 4 = ?",
        answer: 11,
      },
      {
        type: "basic",
        category: "subtraction",
        prompt: "12 - 5 = ?",
        answer: 7,
      },
      {
        type: "basic",
        category: "subtraction",
        prompt: "18 - 9 = ?",
        answer: 9,
      },
      {
        type: "basic",
        category: "addition",
        prompt: "6 + 8 = ?",
        answer: 14,
      },
      {
        type: "extension",
        category: "two_step_word",
        prompt: "小明有 5 个苹果，妈妈又给他 3 个，小明现在有几个苹果？",
        answer: 8,
        unit: "个",
      },
      {
        type: "extension",
        category: "two_step_word",
        prompt: "树上有 10 只鸟，飞走了 4 只，还剩几只？",
        answer: 6,
        unit: "只",
      },
    ],
  };
}

/** 二年级完整体系 mock — 5 基础 + 2 拓展 */
function buildGrade2MockResponse(): RawAIQuestionResponse {
  return {
    questions: [
      {
        type: "basic",
        category: "addition",
        prompt: "47 + 38 = ?",
        answer: 85,
      },
      {
        type: "basic",
        category: "subtraction",
        prompt: "72 - 35 = ?",
        answer: 37,
      },
      {
        type: "basic",
        category: "multiplication",
        prompt: "5 × 6 = ?",
        answer: 30,
      },
      {
        type: "basic",
        category: "division",
        prompt: "24 平均分给 4 个小朋友，每人分到几个？",
        answer: 6,
        unit: "个",
      },
      {
        type: "basic",
        category: "two_step_word",
        prompt:
          "小红有 15 元，买了一支铅笔花了 3 元，又买了一块橡皮花了 2 元，还剩多少元？",
        answer: 10,
        unit: "元",
      },
      {
        type: "extension",
        category: "pattern_sequence",
        prompt: "找规律：2，4，6，8，（  ）",
        answer: 10,
      },
      {
        type: "extension",
        category: "multi_step_word",
        prompt:
          "图书角有 3 排书架，每排 5 本书，又新来了 4 本书，现在一共有多少本书？",
        answer: 19,
        unit: "本",
        hint: "先算 3 排共有多少本，再加上新来的",
      },
    ],
  };
}

function buildTransitionMockResponse(): RawAIQuestionResponse {
  return {
    questions: [
      {
        type: "basic",
        level: "transition",
        category: "addition",
        prompt: "36 + 27 = ?",
        answer: 63,
      },
      {
        type: "basic",
        level: "transition",
        category: "subtraction",
        prompt: "52 - 18 = ?",
        answer: 34,
      },
      {
        type: "basic",
        level: "transition",
        category: "addition",
        prompt: "45 + 28 = ?",
        answer: 73,
      },
      {
        type: "basic",
        level: "grade2",
        category: "multiplication",
        prompt: "5 × 7 = ?",
        answer: 35,
      },
      {
        type: "basic",
        level: "grade2",
        category: "division",
        prompt: "30 ÷ 5 = ?",
        answer: 6,
      },
      {
        type: "extension",
        level: "transition",
        category: "two_step_word",
        prompt: "小明有 28 元，买了一本书花了 15 元，还剩多少钱？",
        answer: 13,
        unit: "元",
      },
      {
        type: "extension",
        level: "grade2",
        category: "multi_step_word",
        prompt: "妈妈买了 4 盒鸡蛋，每盒 6 个，一共买了多少个鸡蛋？",
        answer: 24,
        unit: "个",
        hint: "用每盒数量乘以盒数",
      },
    ],
  };
}

export function buildMockRawResponse(
  level: PracticeLevel = 2,
): RawAIQuestionResponse {
  if (level === 1) return buildGrade1MockResponse();
  if (level === 2) return buildGrade2MockResponse();
  return buildTransitionMockResponse();
}

export function buildMockPracticeSet(
  date: string,
  level: PracticeLevel,
): PracticeSet {
  const raw = buildMockRawResponse(level);

  return {
    setId: date,
    date,
    level,
    source: "mock",
    generatedAt: new Date().toISOString(),
    questions: raw.questions.map((question, index) => ({
      id: index + 1,
      type: question.type,
      category: question.category,
      prompt: question.prompt,
      answer: question.answer,
      ...(question.level ? { level: question.level } : {}),
      ...(question.unit ? { unit: question.unit } : {}),
      ...(question.hint ? { hint: question.hint } : {}),
    })),
  };
}
