import {
  getWeekConfig,
  LEARNING_PATH_TOTAL_WEEKS,
  LEARNING_PATH_WEEKS,
  formatWeekTrainingSummary,
} from "@/lib/curriculum/learningPathConfig";
import type {
  LearningPathProgress,
  LearningPathView,
  LearningPathWeekRecord,
  LearningPathWeekStatus,
} from "@/types/math";

const DEFAULT_STUDENT_ID = "default";
export const PATH_WEEK_MIN_ACCURACY = 0.6;

export function parsePathWeekParam(param: string | null): number | null {
  if (!param) return null;
  const n = Number.parseInt(param, 10);
  if (!Number.isFinite(n) || n < 1 || n > LEARNING_PATH_TOTAL_WEEKS) {
    return null;
  }
  return n;
}

export function createInitialLearningPath(
  studentId = DEFAULT_STUDENT_ID,
): LearningPathProgress {
  const today = new Date().toISOString().slice(0, 10);

  const weeks: LearningPathWeekRecord[] = LEARNING_PATH_WEEKS.map((w) => ({
    weekNumber: w.weekNumber,
    status: w.weekNumber === 1 ? "in_progress" : "locked",
  }));

  return {
    studentId,
    currentWeek: 1,
    weeks,
    startDate: today,
    updatedAt: new Date().toISOString(),
  };
}

export function normalizeLearningPath(data: unknown): LearningPathProgress {
  const base = createInitialLearningPath();

  if (!data || typeof data !== "object") return base;

  const record = data as Partial<LearningPathProgress>;
  const weeksRaw = record.weeks;

  if (Array.isArray(weeksRaw)) {
    for (const item of weeksRaw) {
      if (!item || typeof item !== "object") continue;
      const w = item as Partial<LearningPathWeekRecord>;
      const weekNumber =
        typeof w.weekNumber === "number" ? w.weekNumber : null;
      if (!weekNumber || weekNumber < 1 || weekNumber > LEARNING_PATH_TOTAL_WEEKS) {
        continue;
      }
      const idx = weekNumber - 1;
      const status = isValidStatus(w.status) ? w.status : base.weeks[idx].status;
      base.weeks[idx] = {
        weekNumber,
        status,
        completedAt:
          typeof w.completedAt === "string" ? w.completedAt : undefined,
        bestAccuracy:
          typeof w.bestAccuracy === "number" ? w.bestAccuracy : undefined,
      };
    }
  }

  const currentWeek =
    typeof record.currentWeek === "number" &&
    record.currentWeek >= 1 &&
    record.currentWeek <= LEARNING_PATH_TOTAL_WEEKS
      ? record.currentWeek
      : base.currentWeek;

  return {
    studentId:
      typeof record.studentId === "string" ? record.studentId : base.studentId,
    currentWeek,
    weeks: base.weeks,
    startDate:
      typeof record.startDate === "string" ? record.startDate : base.startDate,
    updatedAt: new Date().toISOString(),
  };
}

function isValidStatus(value: unknown): value is LearningPathWeekStatus {
  return (
    value === "locked" ||
    value === "available" ||
    value === "in_progress" ||
    value === "completed"
  );
}

export function getWeekRecord(
  progress: LearningPathProgress,
  weekNumber: number,
): LearningPathWeekRecord {
  return progress.weeks[weekNumber - 1];
}

export function canPracticeWeek(
  progress: LearningPathProgress,
  weekNumber: number,
): boolean {
  const record = getWeekRecord(progress, weekNumber);
  return (
    record.status === "in_progress" ||
    record.status === "available" ||
    record.status === "completed"
  );
}

export function markPathWeekInProgress(
  progress: LearningPathProgress,
  weekNumber: number,
): LearningPathProgress {
  if (!canPracticeWeek(progress, weekNumber)) return progress;

  const weeks = progress.weeks.map((w) => {
    if (w.weekNumber !== weekNumber) return w;
    if (w.status === "completed") return w;
    return { ...w, status: "in_progress" as const };
  });

  return {
    ...progress,
    currentWeek: weekNumber,
    weeks,
    updatedAt: new Date().toISOString(),
  };
}

export function completePathWeek(
  progress: LearningPathProgress,
  weekNumber: number,
  accuracy: number,
): LearningPathProgress {
  if (!canPracticeWeek(progress, weekNumber)) return progress;
  if (accuracy < PATH_WEEK_MIN_ACCURACY) return progress;

  const now = new Date().toISOString();
  const weeks = progress.weeks.map((w) => {
    if (w.weekNumber !== weekNumber) return w;
    const bestAccuracy =
      w.bestAccuracy === undefined
        ? Math.round(accuracy * 100)
        : Math.max(w.bestAccuracy, Math.round(accuracy * 100));
    return {
      ...w,
      status: "completed" as const,
      completedAt: now,
      bestAccuracy,
    };
  });

  let currentWeek = progress.currentWeek;
  if (weekNumber === currentWeek && weekNumber < LEARNING_PATH_TOTAL_WEEKS) {
    const nextWeek = weekNumber + 1;
    weeks[nextWeek - 1] = {
      ...weeks[nextWeek - 1],
      status: "in_progress",
    };
    currentWeek = nextWeek;
  }

  return {
    ...progress,
    currentWeek,
    weeks,
    updatedAt: now,
  };
}

export function buildLearningPathView(
  progress: LearningPathProgress,
): LearningPathView {
  const completedWeekCount = progress.weeks.filter(
    (w) => w.status === "completed",
  ).length;

  const config = getWeekConfig(progress.currentWeek);
  const currentWeekConfig = config
    ? {
        weekNumber: config.weekNumber,
        title: config.title,
        goal: config.goal,
        ...formatWeekTrainingSummary(config),
      }
    : null;

  return {
    progress,
    completedWeekCount,
    totalWeeks: LEARNING_PATH_TOTAL_WEEKS,
    currentWeekConfig,
    isPathComplete: completedWeekCount >= LEARNING_PATH_TOTAL_WEEKS,
  };
}

export function getPathWeekPracticeHref(weekNumber: number): string {
  return `/practice?pathWeek=${weekNumber}`;
}

export function getCurrentPathPracticeHref(
  progress: LearningPathProgress,
): string {
  return getPathWeekPracticeHref(progress.currentWeek);
}
