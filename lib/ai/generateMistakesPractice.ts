import { callAiChat, isMockApiKey } from "@/lib/ai";
import {
  buildMistakesPracticeSystemPrompt,
  buildMistakesPracticeUserPrompt,
  MISTAKE_DRILL_QUESTION_COUNT,
} from "@/lib/ai/mistakesPracticePrompts";
import { getTodayDateString } from "@/lib/ai/mockQuestions";
import { parseRawAIQuestionResponse } from "@/lib/ai/validate";
import type { MistakeEntry } from "@/lib/types/mistakes";
import type {
  PracticeSet,
  Question,
  QuestionCategory,
  RawAIQuestion,
} from "@/lib/types/practice";

export type GenerateMistakesPracticeInput = {
  categories: QuestionCategory[];
  mistakes: MistakeEntry[];
};

function validateDrillQuestions(
  questions: RawAIQuestion[],
  categories: QuestionCategory[],
  count: number,
): string | null {
  if (questions.length !== count) {
    return `Expected ${count} questions, got ${questions.length}`;
  }

  const allowed = new Set(categories);
  for (const q of questions) {
    if (!allowed.has(q.category)) {
      return `Question category ${q.category} not in target categories`;
    }
  }

  return null;
}

function buildMockDrillSet(
  categories: QuestionCategory[],
  mistakes: MistakeEntry[],
): PracticeSet {
  const date = getTodayDateString();
  const templates: RawAIQuestion[] = mistakes.map((m) => ({
    type: m.questionSnapshot.type,
    category: m.category,
    prompt: m.prompt,
    answer: m.correctAnswer,
    ...(m.unit ? { unit: m.unit } : {}),
  }));

  const fallback: RawAIQuestion[] = [
    {
      type: "basic",
      category: categories[0] ?? "addition",
      prompt: "8 + 5 = ?",
      answer: 13,
    },
    {
      type: "basic",
      category: categories[0] ?? "subtraction",
      prompt: "14 - 6 = ?",
      answer: 8,
    },
    {
      type: "basic",
      category: categories[1] ?? categories[0] ?? "addition",
      prompt: "9 + 7 = ?",
      answer: 16,
    },
    {
      type: "basic",
      category: categories[0] ?? "multiplication",
      prompt: "3 × 4 = ?",
      answer: 12,
    },
    {
      type: "extension",
      category: "two_step_word",
      prompt: "小红有 6 支铅笔，又买了 4 支，现在有几支？",
      answer: 10,
      unit: "支",
    },
  ];

  const pool = templates.length > 0 ? templates : fallback;
  const questions: Question[] = Array.from(
    { length: MISTAKE_DRILL_QUESTION_COUNT },
    (_, index) => {
      const source = pool[index % pool.length];
      return {
        id: index + 1,
        type: source.type,
        category: source.category,
        prompt: `[巩固${index + 1}] ${source.prompt}`,
        answer: source.answer,
        ...(source.unit ? { unit: source.unit } : {}),
        ...(source.hint ? { hint: source.hint } : {}),
      };
    },
  );

  return {
    setId: `mistakes-drill-${date}`,
    date,
    level: 2,
    source: "mock",
    generatedAt: new Date().toISOString(),
    questions,
  };
}

function toDrillPracticeSet(raw: RawAIQuestion[]): PracticeSet {
  const date = getTodayDateString();

  return {
    setId: `mistakes-drill-${date}-${Date.now()}`,
    date,
    level: 2,
    source: "ai",
    generatedAt: new Date().toISOString(),
    questions: raw.map((q, index) => ({
      id: index + 1,
      type: q.type,
      category: q.category,
      prompt: q.prompt.trim(),
      answer: q.answer,
      ...(q.level ? { level: q.level } : {}),
      ...(q.unit ? { unit: q.unit } : {}),
      ...(q.hint ? { hint: q.hint } : {}),
    })),
  };
}

export async function generateMistakesPractice(
  input: GenerateMistakesPracticeInput,
): Promise<PracticeSet> {
  const categories =
    input.categories.length > 0 ? input.categories : (["addition"] as QuestionCategory[]);
  const count = MISTAKE_DRILL_QUESTION_COUNT;

  if (isMockApiKey(process.env.DEEPSEEK_API_KEY)) {
    return buildMockDrillSet(categories, input.mistakes);
  }

  const messages = [
    { role: "system" as const, content: buildMistakesPracticeSystemPrompt() },
    {
      role: "user" as const,
      content: buildMistakesPracticeUserPrompt(
        categories,
        input.mistakes,
        count,
      ),
    },
  ];

  let lastError = "Failed to generate mistakes practice";

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const content = await callAiChat(messages, {
        jsonMode: true,
        temperature: 0.7,
      });
      const raw = parseRawAIQuestionResponse(content, 2);

      if (!raw) {
        lastError = "AI response is not valid JSON";
        continue;
      }

      const mixError = validateDrillQuestions(raw.questions, categories, count);
      if (mixError) {
        lastError = mixError;
        continue;
      }

      return toDrillPracticeSet(raw.questions);
    } catch (error) {
      lastError =
        error instanceof Error ? error.message : "Mistakes practice request failed";
    }
  }

  return buildMockDrillSet(categories, input.mistakes);
}
