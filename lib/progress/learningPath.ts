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
/** 每周需完成的天数（每天 1 次练习） */
export const PATH_WEEK_REQUIRED_DAYS = 5;

export type PathWeekDayResult = {
  accuracyPassed: boolean;
  todayAlreadyRecorded: boolean;
  daysCompleted: number;
  daysRequired: number;
  weekCompleted: boolean;
  weekUnlocked: boolean;
};

export function parsePathWeekParam(param: string | null): number | null {
  if (!param) return null;
  const n = Number.parseInt(param, 10);
  if (!Number.isFinite(n) || n < 1 || n > LEARNING_PATH_TOTAL_WEEKS) {
    return null;
  }
  return n;
}

function isValidStatus(value: unknown): value is LearningPathWeekStatus {
  return (
    value === "locked" ||
    value === "available" ||
    value === "in_progress" ||
    value === "completed"
  );
}

function isValidPracticeDate(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function getWeekPracticeDates(record: LearningPathWeekRecord): string[] {
  if (!Array.isArray(record.practiceDates)) return [];
  return [...new Set(record.practiceDates.filter(isValidPracticeDate))].sort();
}

export function getWeekDaysCompleted(record: LearningPathWeekRecord): number {
  const dates = getWeekPracticeDates(record);
  if (dates.length > 0) return dates.length;
  if (record.status === "completed") return PATH_WEEK_REQUIRED_DAYS;
  return 0;
}

export function hasPracticedWeekOnDate(
  record: LearningPathWeekRecord,
  practiceDate: string,
): boolean {
  return getWeekPracticeDates(record).includes(practiceDate);
}

function reconcileWeekRecord(
  record: LearningPathWeekRecord,
): LearningPathWeekRecord {
  const practiceDates = getWeekPracticeDates(record);
  const daysCompleted = practiceDates.length;

  if (record.status === "completed") {
    return {
      ...record,
      practiceDates,
      completedAt: record.completedAt,
    };
  }

  if (daysCompleted >= PATH_WEEK_REQUIRED_DAYS) {
    return {
      ...record,
      practiceDates,
      status: "completed",
      completedAt: record.completedAt ?? new Date().toISOString(),
    };
  }

  return {
    ...record,
    practiceDates,
  };
}

export function createInitialLearningPath(
  studentId = DEFAULT_STUDENT_ID,
): LearningPathProgress {
  const today = new Date().toISOString().slice(0, 10);

  const weeks: LearningPathWeekRecord[] = LEARNING_PATH_WEEKS.map((w) => ({
    weekNumber: w.weekNumber,
    status: w.weekNumber === 1 ? "in_progress" : "locked",
    practiceDates: [],
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
      base.weeks[idx] = reconcileWeekRecord({
        weekNumber,
        status,
        completedAt:
          typeof w.completedAt === "string" ? w.completedAt : undefined,
        bestAccuracy:
          typeof w.bestAccuracy === "number" ? w.bestAccuracy : undefined,
        practiceDates: Array.isArray(w.practiceDates)
          ? w.practiceDates.filter(isValidPracticeDate)
          : [],
      });
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

function updateWeekBestAccuracy(
  progress: LearningPathProgress,
  weekNumber: number,
  accuracy: number,
): LearningPathProgress {
  const weeks = progress.weeks.map((w) => {
    if (w.weekNumber !== weekNumber) return w;
    const bestAccuracy =
      w.bestAccuracy === undefined
        ? Math.round(accuracy * 100)
        : Math.max(w.bestAccuracy, Math.round(accuracy * 100));
    return { ...w, bestAccuracy };
  });

  return {
    ...progress,
    weeks,
    updatedAt: new Date().toISOString(),
  };
}

export function recordPathWeekDailyPractice(
  progress: LearningPathProgress,
  weekNumber: number,
  accuracy: number,
  practiceDate: string,
): { progress: LearningPathProgress; result: PathWeekDayResult } {
  const record = getWeekRecord(progress, weekNumber);
  const baseResult: PathWeekDayResult = {
    accuracyPassed: accuracy >= PATH_WEEK_MIN_ACCURACY,
    todayAlreadyRecorded: false,
    daysCompleted: getWeekDaysCompleted(record),
    daysRequired: PATH_WEEK_REQUIRED_DAYS,
    weekCompleted: record.status === "completed",
    weekUnlocked: false,
  };

  if (!canPracticeWeek(progress, weekNumber)) {
    return { progress, result: baseResult };
  }

  if (!baseResult.accuracyPassed) {
    return {
      progress: updateWeekBestAccuracy(progress, weekNumber, accuracy),
      result: baseResult,
    };
  }

  const dates = getWeekPracticeDates(record);
  if (dates.includes(practiceDate)) {
    return {
      progress: updateWeekBestAccuracy(progress, weekNumber, accuracy),
      result: {
        ...baseResult,
        todayAlreadyRecorded: true,
        daysCompleted: dates.length,
      },
    };
  }

  const nextDates = [...dates, practiceDate].sort();
  const now = new Date().toISOString();
  const willCompleteWeek = nextDates.length >= PATH_WEEK_REQUIRED_DAYS;

  let currentWeek = progress.currentWeek;
  let weekUnlocked = false;

  const weeks = progress.weeks.map((w) => {
    if (w.weekNumber !== weekNumber) return w;

    const bestAccuracy =
      w.bestAccuracy === undefined
        ? Math.round(accuracy * 100)
        : Math.max(w.bestAccuracy, Math.round(accuracy * 100));

    if (willCompleteWeek) {
      return reconcileWeekRecord({
        ...w,
        practiceDates: nextDates,
        bestAccuracy,
        status: "completed",
        completedAt: w.completedAt ?? now,
      });
    }

    return reconcileWeekRecord({
      ...w,
      practiceDates: nextDates,
      bestAccuracy,
      status: w.status === "locked" ? "in_progress" : w.status,
    });
  });

  if (
    willCompleteWeek &&
    weekNumber === currentWeek &&
    weekNumber < LEARNING_PATH_TOTAL_WEEKS
  ) {
    const nextWeek = weekNumber + 1;
    weeks[nextWeek - 1] = {
      ...weeks[nextWeek - 1],
      status: "in_progress",
    };
    currentWeek = nextWeek;
    weekUnlocked = true;
  }

  const updated: LearningPathProgress = {
    ...progress,
    currentWeek,
    weeks,
    updatedAt: now,
  };

  return {
    progress: updated,
    result: {
      accuracyPassed: true,
      todayAlreadyRecorded: false,
      daysCompleted: nextDates.length,
      daysRequired: PATH_WEEK_REQUIRED_DAYS,
      weekCompleted: willCompleteWeek,
      weekUnlocked,
    },
  };
}

/** @deprecated 使用 recordPathWeekDailyPractice */
export function completePathWeek(
  progress: LearningPathProgress,
  weekNumber: number,
  accuracy: number,
): LearningPathProgress {
  const today = new Date().toISOString().slice(0, 10);
  return recordPathWeekDailyPractice(progress, weekNumber, accuracy, today)
    .progress;
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

export function formatPathWeekReviewMessage(
  result: PathWeekDayResult | null,
  pathWeek: number,
  pathProgress: LearningPathProgress | null,
): { tone: "success" | "warning"; message: string } {
  if (!result) {
    return {
      tone: "warning",
      message: "正确率需要 ≥ 60% 才能计入本周打卡，再练一次吧！",
    };
  }

  if (!result.accuracyPassed) {
    return {
      tone: "warning",
      message: "正确率需要 ≥ 60% 才能计入本周打卡，再练一次吧！",
    };
  }

  if (result.todayAlreadyRecorded) {
    return {
      tone: "success",
      message: `今日打卡已完成（${result.daysCompleted}/${result.daysRequired} 天），明天再来吧～`,
    };
  }

  if (result.weekCompleted) {
    if (pathProgress && pathProgress.currentWeek > pathWeek) {
      return {
        tone: "success",
        message: `本周 ${result.daysRequired} 天全部完成！已解锁第 ${pathProgress.currentWeek} 周 🎉`,
      };
    }
    return {
      tone: "success",
      message: `本周 ${result.daysRequired} 天全部完成！回首页继续下一周吧 🎉`,
    };
  }

  return {
    tone: "success",
    message: `今日打卡成功！本周进度 ${result.daysCompleted}/${result.daysRequired} 天，继续加油 💪`,
  };
}
