import type { Question, QuestionType } from "@/lib/types/practice";
import type {
  GrowthLevel,
  LevelDefinition,
  LevelProgress,
  StudentGrowth,
} from "@/lib/types/growth";

export const PERFECT_BONUS_STARS = 5;

export const LEVEL_DEFINITIONS: LevelDefinition[] = [
  { level: 1, minStars: 0, title: "数学小苗" },
  { level: 2, minStars: 20, title: "计算新手" },
  { level: 3, minStars: 50, title: "闯关能手" },
  { level: 4, minStars: 100, title: "思维达人" },
];

const DEFAULT_STUDENT_ID = "default";

export function createEmptyGrowth(studentId = DEFAULT_STUDENT_ID): StudentGrowth {
  return {
    studentId,
    totalStars: 0,
    updatedAt: new Date().toISOString(),
  };
}

export function getStarsForQuestionType(type: QuestionType): number {
  return type === "extension" ? 3 : 1;
}

export function getStarsForQuestion(question: Question): number {
  return getStarsForQuestionType(question.type);
}

export function addStars(growth: StudentGrowth, amount: number): StudentGrowth {
  if (amount <= 0) return growth;

  return {
    ...growth,
    totalStars: growth.totalStars + amount,
    updatedAt: new Date().toISOString(),
  };
}

export function getLevelForStars(totalStars: number): LevelDefinition {
  let current = LEVEL_DEFINITIONS[0];

  for (const def of LEVEL_DEFINITIONS) {
    if (totalStars >= def.minStars) {
      current = def;
    }
  }

  return current;
}

export function getLevelProgress(totalStars: number): LevelProgress {
  const current = getLevelForStars(totalStars);
  const currentIndex = LEVEL_DEFINITIONS.findIndex((d) => d.level === current.level);
  const next = LEVEL_DEFINITIONS[currentIndex + 1] ?? null;

  if (!next) {
    return {
      level: current.level as GrowthLevel,
      title: current.title,
      totalStars,
      currentLevelMinStars: current.minStars,
      nextLevelMinStars: null,
      starsToNextLevel: 0,
      progressPercent: 100,
      isMaxLevel: true,
    };
  }

  const range = next.minStars - current.minStars;
  const progress = totalStars - current.minStars;
  const progressPercent =
    range === 0 ? 100 : Math.min(100, Math.round((progress / range) * 100));

  return {
    level: current.level as GrowthLevel,
    title: current.title,
    totalStars,
    currentLevelMinStars: current.minStars,
    nextLevelMinStars: next.minStars,
    starsToNextLevel: Math.max(0, next.minStars - totalStars),
    progressPercent,
    isMaxLevel: false,
  };
}

export function normalizeGrowth(data: unknown): StudentGrowth {
  const base = createEmptyGrowth();

  if (!data || typeof data !== "object") return base;

  const record = data as Partial<StudentGrowth>;
  const totalStars =
    typeof record.totalStars === "number" && record.totalStars >= 0
      ? Math.floor(record.totalStars)
      : 0;

  return {
    studentId: record.studentId ?? base.studentId,
    totalStars,
    updatedAt: record.updatedAt ?? new Date().toISOString(),
  };
}
