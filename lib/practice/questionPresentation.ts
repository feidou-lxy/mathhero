import type { Question } from "@/types/math";

const CHOICE_CATEGORIES = new Set<Question["category"]>([
  "logic_reasoning",
  "shape_pattern",
]);

const MEASUREMENT_UNITS = new Set([
  "元",
  "角",
  "分",
  "个",
  "只",
  "本",
  "支",
  "盒",
  "瓶",
  "张",
  "块",
  "页",
  "分钟",
  "小时",
  "天",
  "岁",
  "米",
  "厘米",
  "分米",
  "kg",
  "克",
  "千克",
]);

function isMeasurementUnit(unit: string): boolean {
  return MEASUREMENT_UNITS.has(unit);
}

function clampAnswerIndex(answer: number, optionCount: number): number {
  if (answer >= 1 && answer <= optionCount) return answer - 1;
  if (answer >= 0 && answer < optionCount) return answer;
  return Math.max(0, Math.min(answer, optionCount - 1));
}

function parseLegacyChoicePrompt(
  prompt: string,
): { prompt: string; options: string[] } | null {
  const match = prompt.match(/[（(](\d+=[^）)]+(?:\s+\d+=[^）)]+)+)[）)]/);
  if (!match) return null;

  const options = match[1]
    .split(/\s+/)
    .map((part) => part.replace(/^\d+=/, "").trim())
    .filter(Boolean);

  if (options.length < 2) return null;

  const cleanedPrompt = prompt.replace(/[（(]\d+=[^）)]+[）)]/, "").trim();
  return { prompt: cleanedPrompt, options };
}

function extractPersonNames(prompt: string): string[] | null {
  const tripleMatch = prompt.match(
    /([\u4e00-\u9fa5]{2,4})、([\u4e00-\u9fa5]{2,4})和([\u4e00-\u9fa5]{2,4})(?=三个人|两人|四人|五人|比|，|。|\?|\？)/,
  );
  if (tripleMatch) {
    return [tripleMatch[1], tripleMatch[2], tripleMatch[3]];
  }

  const match = prompt.match(
    /([^，。?？！!]+(?:、[^，。?？！!]+)+和[^，。?？！!]+)/,
  );
  if (!match) return null;

  const names = match[1]
    .split(/[、和]/)
    .map((name) =>
      name
        .replace(/(三个人|两人|四个人|五个人|比身高|比个子).*$/g, "")
        .trim(),
    )
    .filter((name) => name.length >= 2 && name.length <= 4);

  return names.length >= 2 && names.length <= 5 ? names : null;
}

function extractShapeOptions(prompt: string): string[] | null {
  const symbols = [...prompt.matchAll(/[○△□◇☆★]/gu)].map((item) => item[0]);
  const unique = [...new Set(symbols)];
  return unique.length >= 2 ? unique : null;
}

export function isChoiceQuestion(question: Question): boolean {
  return Array.isArray(question.options) && question.options.length >= 2;
}

export function formatQuestionAnswer(question: Question): string {
  if (isChoiceQuestion(question)) {
    return question.options![question.answer] ?? String(question.answer);
  }

  return `${question.answer}${question.unit ? ` ${question.unit}` : ""}`;
}

export function formatUserAnswerDisplay(
  question: Question,
  userAnswer: string,
): string {
  if (isChoiceQuestion(question)) {
    const selected = Number(userAnswer);
    if (Number.isInteger(selected) && question.options![selected]) {
      return question.options![selected];
    }
  }

  return `${userAnswer}${question.unit ? ` ${question.unit}` : ""}`;
}

export function normalizeQuestion(question: Question): Question {
  if (question.options && question.options.length >= 2) {
    return {
      ...question,
      options: question.options.map((option) => option.trim()),
      answer: clampAnswerIndex(question.answer, question.options.length),
    };
  }

  if (!CHOICE_CATEGORIES.has(question.category)) {
    return question;
  }

  const legacy = parseLegacyChoicePrompt(question.prompt);
  if (legacy) {
    return {
      ...question,
      prompt: legacy.prompt,
      options: legacy.options,
      answer: clampAnswerIndex(question.answer, legacy.options.length),
      unit: undefined,
    };
  }

  const personNames = extractPersonNames(question.prompt);
  if (personNames) {
    if (question.unit && !isMeasurementUnit(question.unit)) {
      const answerIndex = personNames.indexOf(question.unit);
      if (answerIndex >= 0) {
        return {
          ...question,
          options: personNames,
          answer: answerIndex,
          unit: undefined,
        };
      }
    }

    return {
      ...question,
      options: personNames,
      answer: clampAnswerIndex(question.answer, personNames.length),
      unit: undefined,
    };
  }

  if (question.category === "shape_pattern") {
    const shapeOptions = extractShapeOptions(question.prompt);
    if (shapeOptions) {
      return {
        ...question,
        options: shapeOptions,
        answer: clampAnswerIndex(question.answer, shapeOptions.length),
        unit: undefined,
      };
    }
  }

  return question;
}

export function normalizeQuestions(questions: Question[]): Question[] {
  return questions.map(normalizeQuestion);
}
