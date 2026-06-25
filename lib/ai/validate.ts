import type { GenerationPlan } from "@/lib/profile/generationPlan";
import { buildGenerationPlan } from "@/lib/profile/generationPlan";
import {
  GRADE2_BASIC_TOPICS,
  GRADE2_EXTENSION_TOPICS,
  GRADE2_FIXED_ADVANCED_COUNT,
  GRADE2_FIXED_BASIC_COUNT,
  isBasicCategory,
  isExtensionCategory,
  flattenBatchResponse,
  validateBasicCoverage,
} from "@/lib/curriculum/grade2";
import { validatePathWeekBasicCoverage } from "@/lib/curriculum/learningPathConfig";
import { validateFocusSkillBasicCoverage } from "@/lib/mastery/weakSkillSlots";
import { validateSessionCoverage } from "@/lib/curriculum/difficultyBalance";
import {
  type PracticeLevel,
  type PracticeSet,
  type QuestionCategory,
  type QuestionLevel,
  type QuestionType,
  type RawAIQuestion,
  type RawAIQuestionBatchResponse,
  type RawAIQuestionItem,
  type RawAIQuestionResponse,
} from "@/lib/types/practice";
import { validateLogicReasoningQuestion } from "@/lib/ai/logicQuestionValidator";
import { normalizeQuestion } from "@/lib/practice/questionPresentation";

const QUESTION_TYPES = new Set<QuestionType>(["basic", "extension"]);
const QUESTION_LEVELS = new Set<QuestionLevel>(["transition", "grade2"]);

const QUESTION_CATEGORIES = new Set<QuestionCategory>([
  ...GRADE2_BASIC_TOPICS,
  ...GRADE2_EXTENSION_TOPICS,
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isValidOptions(value: unknown): boolean {
  return (
    value === undefined ||
    (Array.isArray(value) &&
      value.length >= 2 &&
      value.length <= 6 &&
      value.every((option) => typeof option === "string" && option.trim().length > 0))
  );
}

function isValidChoiceAnswer(answer: number, options?: string[]): boolean {
  if (!options || options.length < 2) return true;
  return Number.isInteger(answer) && answer >= 0 && answer < options.length;
}

function isRawQuestionItem(
  value: unknown,
  expectedType: QuestionType,
): value is RawAIQuestionItem {
  if (!isRecord(value)) return false;

  const { category, prompt, answer, unit, hint, level } = value;
  const options = Array.isArray(value.options) ? value.options : undefined;

  if (typeof category !== "string" || !QUESTION_CATEGORIES.has(category as QuestionCategory)) {
    return false;
  }

  if (expectedType === "basic" && !isBasicCategory(category as QuestionCategory)) {
    return false;
  }

  if (expectedType === "extension" && !isExtensionCategory(category as QuestionCategory)) {
    return false;
  }

  return (
    typeof prompt === "string" &&
    prompt.trim().length > 0 &&
    typeof answer === "number" &&
    Number.isFinite(answer) &&
    Number.isInteger(answer) &&
    isValidOptions(options) &&
    isValidChoiceAnswer(answer, options) &&
    (unit === undefined || typeof unit === "string") &&
    (hint === undefined || typeof hint === "string") &&
    (level === undefined ||
      (typeof level === "string" &&
        QUESTION_LEVELS.has(level as QuestionLevel)))
  );
}

function isRawQuestion(value: unknown, level: PracticeLevel): value is RawAIQuestion {
  if (!isRecord(value)) return false;

  const { type, category, prompt, answer, unit, hint } = value;
  const questionLevel = value.level;
  const options = Array.isArray(value.options) ? value.options : undefined;

  if (
    level === "transition" &&
    (typeof questionLevel !== "string" ||
      !QUESTION_LEVELS.has(questionLevel as QuestionLevel))
  ) {
    return false;
  }

  return (
    typeof type === "string" &&
    QUESTION_TYPES.has(type as QuestionType) &&
    typeof category === "string" &&
    QUESTION_CATEGORIES.has(category as QuestionCategory) &&
    typeof prompt === "string" &&
    prompt.trim().length > 0 &&
    typeof answer === "number" &&
    Number.isFinite(answer) &&
    Number.isInteger(answer) &&
    isValidOptions(options) &&
    isValidChoiceAnswer(answer, options) &&
    (unit === undefined || typeof unit === "string") &&
    (hint === undefined || typeof hint === "string") &&
    (questionLevel === undefined ||
      (typeof questionLevel === "string" &&
        QUESTION_LEVELS.has(questionLevel as QuestionLevel)))
  );
}

function extractJsonContent(content: string): string {
  const trimmed = content.trim();
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  return fenceMatch ? fenceMatch[1].trim() : trimmed;
}

function parseBatchResponse(
  parsed: Record<string, unknown>,
): RawAIQuestionBatchResponse | null {
  if (!Array.isArray(parsed.basic) || !Array.isArray(parsed.advanced)) {
    return null;
  }

  const basic = parsed.basic.filter((q) => isRawQuestionItem(q, "basic"));
  const advanced = parsed.advanced.filter((q) => isRawQuestionItem(q, "extension"));

  if (
    basic.length !== parsed.basic.length ||
    advanced.length !== parsed.advanced.length
  ) {
    return null;
  }

  return { basic, advanced };
}

export function parseRawAIQuestionResponse(
  content: string,
  level: PracticeLevel = 2,
): RawAIQuestionResponse | null {
  try {
    const parsed: unknown = JSON.parse(extractJsonContent(content));
    if (!isRecord(parsed)) return null;

    if (Array.isArray(parsed.basic) && Array.isArray(parsed.advanced)) {
      const batch = parseBatchResponse(parsed);
      if (!batch) return null;
      return { questions: flattenBatchResponse(batch) };
    }

    if (!Array.isArray(parsed.questions)) {
      return null;
    }

    const questions = parsed.questions.filter((q) => isRawQuestion(q, level));
    if (questions.length !== parsed.questions.length) {
      return null;
    }

    return { questions };
  } catch {
    return null;
  }
}

export function validateQuestionMix(
  questions: RawAIQuestion[],
  level: PracticeLevel = 2,
  plan?: GenerationPlan,
): string | null {
  const generationPlan = plan ?? buildGenerationPlan(undefined, level);

  if (questions.length !== generationPlan.total) {
    return `Expected ${generationPlan.total} questions, got ${questions.length}`;
  }

  const basicQuestions = questions.filter((q) => q.type === "basic");
  const extensionQuestions = questions.filter((q) => q.type === "extension");

  if (level === 2) {
    if (basicQuestions.length !== GRADE2_FIXED_BASIC_COUNT) {
      return `Expected ${GRADE2_FIXED_BASIC_COUNT} basic questions, got ${basicQuestions.length}`;
    }
    if (extensionQuestions.length !== GRADE2_FIXED_ADVANCED_COUNT) {
      return `Expected ${GRADE2_FIXED_ADVANCED_COUNT} advanced questions, got ${extensionQuestions.length}`;
    }

    const basicCategories = basicQuestions.map((q) => q.category);

    if (generationPlan.pathWeekConfig) {
      const coverageError = validatePathWeekBasicCoverage(
        basicCategories,
        generationPlan.pathWeekConfig,
      );
      if (coverageError) return coverageError;
    } else if (generationPlan.focusSkill) {
      const coverageError = validateFocusSkillBasicCoverage(
        basicCategories,
        generationPlan.focusSkill,
      );
      if (coverageError) return coverageError;
    } else {
      const coverageError = validateBasicCoverage(basicCategories);
      if (coverageError) return coverageError;
    }

    if (generationPlan.topicSlots) {
      const coverageError = validateSessionCoverage(generationPlan.topicSlots);
      if (coverageError) return coverageError;

      for (let i = 0; i < questions.length; i += 1) {
        const expected = generationPlan.topicSlots[i];
        const actual = questions[i];

        if (actual.type !== expected.type) {
          return `Question ${i + 1}: expected type ${expected.type}, got ${actual.type}`;
        }
        if (actual.category !== expected.category) {
          return `Question ${i + 1}: expected category ${expected.category}, got ${actual.category}`;
        }
      }
    }

    return null;
  }

  const basicCount = basicQuestions.length;
  const extensionCount = extensionQuestions.length;

  if (basicCount !== generationPlan.basicCount) {
    return `Expected ${generationPlan.basicCount} basic questions, got ${basicCount}`;
  }

  if (extensionCount !== generationPlan.wordProblemCount) {
    return `Expected ${generationPlan.wordProblemCount} extension questions, got ${extensionCount}`;
  }

  if (level === "transition") {
    const transitionBasic = questions.filter(
      (q) => q.type === "basic" && q.level === "transition",
    ).length;
    const grade2Basic = questions.filter(
      (q) => q.type === "basic" && q.level === "grade2",
    ).length;
    const transitionExtension = questions.filter(
      (q) => q.type === "extension" && q.level === "transition",
    ).length;
    const grade2Extension = questions.filter(
      (q) => q.type === "extension" && q.level === "grade2",
    ).length;

    if (transitionBasic !== generationPlan.transitionBasic) {
      return `Expected ${generationPlan.transitionBasic} transition basic questions, got ${transitionBasic}`;
    }
    if (grade2Basic !== generationPlan.grade2Basic) {
      return `Expected ${generationPlan.grade2Basic} grade2 basic questions, got ${grade2Basic}`;
    }
    if (transitionExtension !== generationPlan.transitionWordProblem) {
      return `Expected ${generationPlan.transitionWordProblem} transition extension questions, got ${transitionExtension}`;
    }
    if (grade2Extension !== generationPlan.grade2WordProblem) {
      return `Expected ${generationPlan.grade2WordProblem} grade2 extension questions, got ${grade2Extension}`;
    }
  }

  for (const question of questions) {
    if (question.type === "basic" && !isBasicCategory(question.category)) {
      return `Basic question must use a basic category, got ${question.category}`;
    }

    if (question.type === "extension" && !isExtensionCategory(question.category)) {
      return `Extension question must use an extension category, got ${question.category}`;
    }

    if (
      level === 1 &&
      question.type === "basic" &&
      question.category !== "addition" &&
      question.category !== "subtraction"
    ) {
      return "Grade 1 basic questions must be addition or subtraction only";
    }

    if (level === "transition" && question.type === "basic") {
      if (
        question.level === "transition" &&
        question.category !== "addition" &&
        question.category !== "subtraction"
      ) {
        return "Transition basic questions should be addition or subtraction";
      }
    }

    if (question.category === "logic_reasoning") {
      const normalized = normalizeQuestion({
        id: 0,
        type: question.type,
        category: question.category,
        prompt: question.prompt,
        answer: question.answer,
        ...(question.level ? { level: question.level } : {}),
        ...(question.unit ? { unit: question.unit } : {}),
        ...(question.hint ? { hint: question.hint } : {}),
        ...(question.options ? { options: question.options } : {}),
      });
      const logicError = validateLogicReasoningQuestion(normalized);
      if (logicError) {
        return logicError;
      }
    }
  }

  return null;
}

export function toPracticeSet(
  raw: RawAIQuestionResponse,
  date: string,
  level: PracticeLevel,
  source: PracticeSet["source"],
): PracticeSet {
  return {
    setId: date,
    date,
    level,
    source,
    generatedAt: new Date().toISOString(),
    questions: raw.questions.map((question, index) =>
      normalizeQuestion({
        id: index + 1,
        type: question.type,
        category: question.category,
        prompt: question.prompt.trim(),
        answer: question.answer,
        ...(question.level ? { level: question.level } : {}),
        ...(question.unit ? { unit: question.unit } : {}),
        ...(question.hint ? { hint: question.hint } : {}),
        ...(question.options ? { options: question.options } : {}),
      }),
    ),
  };
}
