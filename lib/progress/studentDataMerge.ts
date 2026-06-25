import { mergeGrowthRecords, normalizeGrowth, createEmptyGrowth } from "@/lib/progress/growth";
import { normalizeProfile, createEmptyProfile, judgeSkillLevel } from "@/lib/profile/studentProfile";
import { LEVEL_LABELS, PROFILE_SKILLS, type SkillStats } from "@/lib/types/profile";
import { normalizeLearningPath, createInitialLearningPath, getWeekPracticeDates, PATH_WEEK_REQUIRED_DAYS } from "@/lib/progress/learningPath";
import { normalizeMistakeBook, createEmptyMistakeBook } from "@/lib/mistakes/mistakeBook";
import {
  createEmptyStarBankAccount,
  mergeStarBankAccounts,
  normalizeStarBankAccount,
} from "@/lib/progress/starBank";
import type { StoredDailyTasks } from "@/lib/progress/dailyTasks";
import type { StudentDataBundle } from "@/lib/types/studentData";
import type { ParentLearningReport, ParentReportStore } from "@/lib/types/parentReport";
import type { DailyTask } from "@/lib/types/dailyTasks";
import type {
  LearningPathProgress,
  LearningPathWeekRecord,
  LearningPathWeekStatus,
} from "@/types/math";

const STATUS_RANK: Record<LearningPathWeekStatus, number> = {
  locked: 0,
  available: 1,
  in_progress: 2,
  completed: 3,
};

const TASK_STATUS_RANK = {
  pending: 0,
  in_progress: 1,
  completed: 2,
} as const;

function mergeSkillStats(a: SkillStats, b: SkillStats): SkillStats {
  const correct = Math.max(a.correct, b.correct);
  const total = Math.max(a.total, b.total);
  const accuracy = total === 0 ? 0 : Math.round((correct / total) * 100);
  const level = judgeSkillLevel(correct, total);

  return {
    correct,
    total,
    accuracy,
    level,
    levelLabel: LEVEL_LABELS[level],
  };
}

function mergeProfiles(
  a: StudentDataBundle["profile"],
  b: StudentDataBundle["profile"],
): StudentDataBundle["profile"] {
  const left = normalizeProfile(a);
  const right = normalizeProfile(b);
  const skills = { ...left.skills };

  for (const skill of PROFILE_SKILLS) {
    skills[skill] = mergeSkillStats(left.skills[skill], right.skills[skill]);
  }

  const updatedAt =
    new Date(left.updatedAt).getTime() >= new Date(right.updatedAt).getTime()
      ? left.updatedAt
      : right.updatedAt;

  return {
    studentId: left.studentId || right.studentId,
    updatedAt,
    skills,
  };
}

function mergeWeekRecord(
  a: LearningPathWeekRecord,
  b: LearningPathWeekRecord,
): LearningPathWeekRecord {
  const practiceDates = [
    ...new Set([...getWeekPracticeDates(a), ...getWeekPracticeDates(b)]),
  ].sort();
  const status =
    STATUS_RANK[a.status] >= STATUS_RANK[b.status] ? a.status : b.status;
  const bestAccuracy =
    a.bestAccuracy === undefined
      ? b.bestAccuracy
      : b.bestAccuracy === undefined
        ? a.bestAccuracy
        : Math.max(a.bestAccuracy, b.bestAccuracy);
  const completedAt =
    a.completedAt && b.completedAt
      ? new Date(a.completedAt).getTime() >= new Date(b.completedAt).getTime()
        ? a.completedAt
        : b.completedAt
      : a.completedAt ?? b.completedAt;

  const merged: LearningPathWeekRecord = {
    weekNumber: a.weekNumber,
    status,
    bestAccuracy,
    completedAt,
    practiceDates,
  };

  if (
    practiceDates.length >= PATH_WEEK_REQUIRED_DAYS &&
    merged.status !== "completed"
  ) {
    return {
      ...merged,
      status: "completed",
      completedAt: merged.completedAt ?? new Date().toISOString(),
    };
  }

  return merged;
}

function mergeLearningPath(
  a: LearningPathProgress,
  b: LearningPathProgress,
): LearningPathProgress {
  const left = normalizeLearningPath(a);
  const right = normalizeLearningPath(b);
  const weeks = left.weeks.map((week, index) =>
    mergeWeekRecord(week, right.weeks[index]),
  );
  const currentWeek = Math.max(left.currentWeek, right.currentWeek);
  const updatedAt =
    new Date(left.updatedAt).getTime() >= new Date(right.updatedAt).getTime()
      ? left.updatedAt
      : right.updatedAt;
  const startDate =
    new Date(left.startDate).getTime() <= new Date(right.startDate).getTime()
      ? left.startDate
      : right.startDate;

  return {
    studentId: left.studentId || right.studentId,
    currentWeek,
    weeks,
    startDate,
    updatedAt,
  };
}

function mergeDailyTask(a: DailyTask, b: DailyTask): DailyTask {
  const status =
    TASK_STATUS_RANK[a.status] >= TASK_STATUS_RANK[b.status]
      ? a.status
      : b.status;

  return {
    ...a,
    ...b,
    status,
  };
}

function mergeDailyTasks(
  a: StoredDailyTasks | null,
  b: StoredDailyTasks | null,
): StoredDailyTasks | null {
  if (!a) return b;
  if (!b) return a;

  const primary = a.date >= b.date ? a : b;
  const secondary = primary === a ? b : a;

  if (primary.date !== secondary.date) {
    return {
      ...primary,
      streakDays: Math.max(a.streakDays, b.streakDays),
      lastStreakDate: pickLatestDate(a.lastStreakDate, b.lastStreakDate),
    };
  }

  const taskMap = new Map<string, DailyTask>();
  for (const task of secondary.tasks) {
    taskMap.set(task.id, task);
  }
  for (const task of primary.tasks) {
    const existing = taskMap.get(task.id);
    taskMap.set(task.id, existing ? mergeDailyTask(task, existing) : task);
  }

  return {
    date: primary.date,
    tasks: Array.from(taskMap.values()),
    streakDays: Math.max(a.streakDays, b.streakDays),
    lastStreakDate: pickLatestDate(a.lastStreakDate, b.lastStreakDate),
  };
}

function pickLatestDate(a: string | null, b: string | null): string | null {
  if (!a) return b;
  if (!b) return a;
  return a >= b ? a : b;
}

function mergeParentReports(
  a: ParentReportStore,
  b: ParentReportStore,
): ParentReportStore {
  const map = new Map<string, ParentLearningReport>();

  for (const report of [...a.reports, ...b.reports]) {
    const existing = map.get(report.id);
    if (!existing) {
      map.set(report.id, report);
      continue;
    }
    map.set(
      report.id,
      new Date(report.createdAt).getTime() >= new Date(existing.createdAt).getTime()
        ? report
        : existing,
    );
  }

  const reports = Array.from(map.values()).sort(
    (x, y) => new Date(y.createdAt).getTime() - new Date(x.createdAt).getTime(),
  );

  return { reports: reports.slice(0, 50) };
}

function mergeMistakeBooks(
  a: StudentDataBundle["mistakeBook"],
  b: StudentDataBundle["mistakeBook"],
): StudentDataBundle["mistakeBook"] {
  const left = normalizeMistakeBook(a);
  const right = normalizeMistakeBook(b);
  const map = new Map<string, (typeof left.entries)[number]>();

  for (const entry of [...left.entries, ...right.entries]) {
    const existing = map.get(entry.id);
    if (!existing) {
      map.set(entry.id, entry);
      continue;
    }

    map.set(entry.id, {
      ...existing,
      wrongCount: Math.max(existing.wrongCount, entry.wrongCount),
      lastPracticedAt:
        new Date(existing.lastPracticedAt).getTime() >=
        new Date(entry.lastPracticedAt).getTime()
          ? existing.lastPracticedAt
          : entry.lastPracticedAt,
    });
  }

  const updatedAt =
    new Date(left.updatedAt).getTime() >= new Date(right.updatedAt).getTime()
      ? left.updatedAt
      : right.updatedAt;

  return {
    entries: Array.from(map.values()),
    updatedAt,
  };
}

export function mergeStudentDataBundles(
  a: StudentDataBundle,
  b: StudentDataBundle,
): StudentDataBundle {
  const left = normalizeStudentDataBundle(a);
  const right = normalizeStudentDataBundle(b);

  const updatedAt =
    new Date(left.updatedAt).getTime() >= new Date(right.updatedAt).getTime()
      ? left.updatedAt
      : right.updatedAt;

  return {
    studentId: left.studentId || right.studentId,
    updatedAt,
    profile: mergeProfiles(left.profile, right.profile),
    growth: mergeGrowthRecords(left.growth, right.growth),
    learningPath: mergeLearningPath(left.learningPath, right.learningPath),
    dailyTasks: mergeDailyTasks(left.dailyTasks, right.dailyTasks),
    parentReports: mergeParentReports(left.parentReports, right.parentReports),
    mistakeBook: mergeMistakeBooks(left.mistakeBook, right.mistakeBook),
    starBank: mergeStarBankAccounts(left.starBank, right.starBank),
  };
}

export function normalizeStudentDataBundle(data: unknown): StudentDataBundle {
  const now = new Date().toISOString();

  if (!data || typeof data !== "object") {
    return createEmptyStudentDataBundle();
  }

  const record = data as Partial<StudentDataBundle>;

  return {
    studentId: record.studentId ?? "default",
    updatedAt: record.updatedAt ?? now,
    profile: normalizeProfile(record.profile),
    growth: normalizeGrowth(record.growth),
    learningPath: normalizeLearningPath(record.learningPath),
    dailyTasks:
      record.dailyTasks && typeof record.dailyTasks === "object"
        ? (record.dailyTasks as StoredDailyTasks)
        : null,
    parentReports:
      record.parentReports && typeof record.parentReports === "object"
        ? mergeParentReports({ reports: [] }, record.parentReports as ParentReportStore)
        : { reports: [] },
    mistakeBook: normalizeMistakeBook(record.mistakeBook),
    starBank: normalizeStarBankAccount(record.starBank),
  };
}

export function createEmptyStudentDataBundle(
  studentId = "default",
): StudentDataBundle {
  return {
    studentId,
    updatedAt: new Date().toISOString(),
    profile: createEmptyProfile(studentId),
    growth: createEmptyGrowth(studentId),
    learningPath: createInitialLearningPath(studentId),
    dailyTasks: null,
    parentReports: { reports: [] },
    mistakeBook: createEmptyMistakeBook(),
    starBank: createEmptyStarBankAccount(),
  };
}
