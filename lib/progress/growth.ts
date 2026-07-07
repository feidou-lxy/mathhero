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
    lifetimeStars: 0,
    updatedAt: new Date().toISOString(),
  };
}

export function getLifetimeStars(growth: StudentGrowth): number {
  const balance = growth.totalStars;
  if (
    typeof growth.lifetimeStars === "number" &&
    growth.lifetimeStars >= balance
  ) {
    return Math.floor(growth.lifetimeStars);
  }
  return balance;
}

export function getStarsForQuestionType(type: QuestionType): number {
  return type === "extension" ? 3 : 1;
}

export function getStarsForQuestion(question: Question): number {
  return getStarsForQuestionType(question.type);
}

export function addStars(growth: StudentGrowth, amount: number): StudentGrowth {
  if (amount <= 0) return growth;

  const lifetimeStars = getLifetimeStars(growth) + amount;

  return {
    ...growth,
    totalStars: growth.totalStars + amount,
    lifetimeStars,
    updatedAt: new Date().toISOString(),
  };
}

export function spendStars(
  growth: StudentGrowth,
  amount: number,
): StudentGrowth | null {
  if (amount <= 0 || growth.totalStars < amount) return null;

  return {
    ...growth,
    totalStars: growth.totalStars - amount,
    lifetimeStars: Math.max(getLifetimeStars(growth), growth.totalStars),
    updatedAt: new Date().toISOString(),
  };
}

export function getLevelForStars(lifetimeStars: number): LevelDefinition {
  let current = LEVEL_DEFINITIONS[0];

  for (const def of LEVEL_DEFINITIONS) {
    if (lifetimeStars >= def.minStars) {
      current = def;
    }
  }

  return current;
}

export function getLevelProgress(
  lifetimeStars: number,
  balanceStars: number,
): LevelProgress {
  const current = getLevelForStars(lifetimeStars);
  const currentIndex = LEVEL_DEFINITIONS.findIndex((d) => d.level === current.level);
  const next = LEVEL_DEFINITIONS[currentIndex + 1] ?? null;

  if (!next) {
    return {
      level: current.level as GrowthLevel,
      title: current.title,
      lifetimeStars,
      balanceStars,
      currentLevelMinStars: current.minStars,
      nextLevelMinStars: null,
      starsToNextLevel: 0,
      progressPercent: 100,
      isMaxLevel: true,
    };
  }

  const range = next.minStars - current.minStars;
  const progress = lifetimeStars - current.minStars;
  const progressPercent =
    range === 0 ? 100 : Math.min(100, Math.round((progress / range) * 100));

  return {
    level: current.level as GrowthLevel,
    title: current.title,
    lifetimeStars,
    balanceStars,
    currentLevelMinStars: current.minStars,
    nextLevelMinStars: next.minStars,
    starsToNextLevel: Math.max(0, next.minStars - lifetimeStars),
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
  let lifetimeStars =
    typeof record.lifetimeStars === "number" && record.lifetimeStars >= 0
      ? Math.floor(record.lifetimeStars)
      : totalStars;
  lifetimeStars = Math.max(lifetimeStars, totalStars);

  return {
    studentId: record.studentId ?? base.studentId,
    totalStars,
    lifetimeStars,
    updatedAt: record.updatedAt ?? new Date().toISOString(),
  };
}

export function mergeGrowthRecords(
  a: StudentGrowth,
  b: StudentGrowth,
): StudentGrowth {
  const left = normalizeGrowth(a);
  const right = normalizeGrowth(b);
  const leftTime = new Date(left.updatedAt).getTime();
  const rightTime = new Date(right.updatedAt).getTime();
  const lifetimeStars = Math.max(left.lifetimeStars, right.lifetimeStars);

  // 余额由 reconcileGrowthWithRedemptions 结合兑换记录推算；此处仅保留较新的更新时间
  if (leftTime !== rightTime) {
    const newer = leftTime > rightTime ? left : right;
    return {
      studentId: left.studentId || right.studentId,
      totalStars: newer.totalStars,
      lifetimeStars: Math.max(lifetimeStars, newer.lifetimeStars),
      updatedAt: newer.updatedAt,
    };
  }

  const totalStars = Math.max(left.totalStars, right.totalStars);

  return {
    studentId: left.studentId || right.studentId,
    totalStars,
    lifetimeStars: Math.max(lifetimeStars, totalStars),
    updatedAt: left.updatedAt,
  };
}

/** 结合星星银行已兑换数量，推算并修正累计星星与余额 */
export function reconcileGrowthWithRedemptions(
  growth: StudentGrowth,
  totalRedeemedStars: number,
): StudentGrowth {
  const redeemed = Math.max(0, Math.floor(totalRedeemedStars));
  const lifetimeStars = Math.max(getLifetimeStars(growth), growth.totalStars);

  if (redeemed > 0 && lifetimeStars >= redeemed) {
    return {
      ...growth,
      totalStars: lifetimeStars - redeemed,
      lifetimeStars,
    };
  }

  if (redeemed > 0) {
    const inferredLifetime = growth.totalStars + redeemed;
    return {
      ...growth,
      totalStars: growth.totalStars,
      lifetimeStars: Math.max(lifetimeStars, inferredLifetime),
    };
  }

  return {
    ...growth,
    totalStars: growth.totalStars,
    lifetimeStars,
  };
}
