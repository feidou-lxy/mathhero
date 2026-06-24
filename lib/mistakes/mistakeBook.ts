import type { QuestionCategory } from "@/lib/types/practice";
import { getSkillLabel } from "@/lib/types/profile";
import type {
  MistakeBook,
  MistakeEntry,
  RecordMistakeInput,
} from "@/lib/types/mistakes";

function nowIso(): string {
  return new Date().toISOString();
}

function makePromptKey(prompt: string): string {
  return prompt.trim();
}

export function createEmptyMistakeBook(): MistakeBook {
  return {
    entries: [],
    updatedAt: nowIso(),
  };
}

export function normalizeMistakeBook(data: unknown): MistakeBook {
  const base = createEmptyMistakeBook();
  if (!data || typeof data !== "object") return base;

  const record = data as Partial<MistakeBook>;
  if (!Array.isArray(record.entries)) {
    return { ...base, updatedAt: record.updatedAt ?? base.updatedAt };
  }

  const entries: MistakeEntry[] = [];

  for (const raw of record.entries) {
    if (!raw || typeof raw !== "object") continue;
    const item = raw as Partial<MistakeEntry>;
    if (
      typeof item.id !== "string" ||
      typeof item.prompt !== "string" ||
      typeof item.userAnswer !== "string" ||
      typeof item.correctAnswer !== "number" ||
      typeof item.category !== "string" ||
      typeof item.wrongCount !== "number" ||
      typeof item.lastPracticedAt !== "string" ||
      !item.questionSnapshot
    ) {
      continue;
    }

    entries.push({
      id: item.id,
      prompt: item.prompt,
      userAnswer: item.userAnswer,
      correctAnswer: item.correctAnswer,
      unit: typeof item.unit === "string" ? item.unit : undefined,
      category: item.category as QuestionCategory,
      wrongCount: Math.max(1, Math.floor(item.wrongCount)),
      lastPracticedAt: item.lastPracticedAt,
      questionSnapshot: item.questionSnapshot,
    });
  }

  return {
    entries,
    updatedAt: record.updatedAt ?? nowIso(),
  };
}

function createMistakeId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `mistake_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function recordMistake(
  book: MistakeBook,
  input: RecordMistakeInput,
): MistakeBook {
  const { question, userAnswer } = input;
  const promptKey = makePromptKey(question.prompt);
  const existingIndex = book.entries.findIndex(
    (e) => makePromptKey(e.prompt) === promptKey,
  );
  const timestamp = nowIso();

  if (existingIndex >= 0) {
    const existing = book.entries[existingIndex];
    const updated: MistakeEntry = {
      ...existing,
      userAnswer: userAnswer.trim() || existing.userAnswer,
      correctAnswer: question.answer,
      unit: question.unit ?? existing.unit,
      category: question.category,
      wrongCount: existing.wrongCount + 1,
      lastPracticedAt: timestamp,
      questionSnapshot: question,
    };

    const entries = [...book.entries];
    entries[existingIndex] = updated;

    return { entries, updatedAt: timestamp };
  }

  const entry: MistakeEntry = {
    id: createMistakeId(),
    prompt: question.prompt.trim(),
    userAnswer: userAnswer.trim(),
    correctAnswer: question.answer,
    unit: question.unit,
    category: question.category,
    wrongCount: 1,
    lastPracticedAt: timestamp,
    questionSnapshot: question,
  };

  return {
    entries: [entry, ...book.entries],
    updatedAt: timestamp,
  };
}

export function deleteMistake(book: MistakeBook, id: string): MistakeBook {
  return {
    entries: book.entries.filter((e) => e.id !== id),
    updatedAt: nowIso(),
  };
}

export function touchMistake(book: MistakeBook, id: string): MistakeBook {
  const timestamp = nowIso();
  return {
    entries: book.entries.map((e) =>
      e.id === id ? { ...e, lastPracticedAt: timestamp } : e,
    ),
    updatedAt: timestamp,
  };
}

export function getMistakeById(
  book: MistakeBook,
  id: string,
): MistakeEntry | null {
  return book.entries.find((e) => e.id === id) ?? null;
}

export function sortMistakes(entries: MistakeEntry[]): MistakeEntry[] {
  return [...entries].sort(
    (a, b) =>
      new Date(b.lastPracticedAt).getTime() -
      new Date(a.lastPracticedAt).getTime(),
  );
}

/** 按知识点聚合错误次数，用于专项训练 */
export function getCategoryWeights(
  entries: MistakeEntry[],
): Array<{ category: QuestionCategory; weight: number; label: string }> {
  const map = new Map<QuestionCategory, number>();

  for (const entry of entries) {
    map.set(entry.category, (map.get(entry.category) ?? 0) + entry.wrongCount);
  }

  return [...map.entries()]
    .map(([category, weight]) => ({
      category,
      weight,
      label: getSkillLabel(category),
    }))
    .sort((a, b) => b.weight - a.weight);
}

export function getDrillCategories(entries: MistakeEntry[]): QuestionCategory[] {
  return getCategoryWeights(entries).map((item) => item.category);
}
