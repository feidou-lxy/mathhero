import { loadProfileFromStorage } from "@/lib/profile/clientStorage";
import { PERFECT_BONUS_STARS } from "@/lib/progress/growth";
import { PROFILE_SKILLS } from "@/lib/types/profile";
import type { ParentLearningReport } from "@/lib/types/parentReport";
import type { LearningPathProgress } from "@/types/math";

const RECOVERY_FLAG = "mathhero-growth-recovery-v1-applied";
const PROFILE_KEY = "mathhero-student-profile";
const PARENT_REPORTS_KEY = "mathhero-parent-reports";
const LEARNING_PATH_KEY = "mathhero-learning-path";
const DAILY_TASKS_KEY = "mathhero-daily-tasks";

function readJson(key: string): unknown {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function estimateFromProfile(): number {
  const profile = loadProfileFromStorage();
  const totalCorrect = PROFILE_SKILLS.reduce(
    (sum, skill) => sum + (profile.skills[skill]?.correct ?? 0),
    0,
  );

  if (totalCorrect <= 0) return 0;

  // 基础题 +1、拓展题 +3，按约 30% 拓展题估算
  return Math.ceil(totalCorrect * 1.6);
}

function estimateFromParentReports(): number {
  const data = readJson(PARENT_REPORTS_KEY);
  if (!data || typeof data !== "object") return 0;

  const reports = (data as { reports?: ParentLearningReport[] }).reports;
  if (!Array.isArray(reports) || reports.length === 0) return 0;

  let stars = 0;

  for (const report of reports) {
    if (!report || typeof report.correctCount !== "number") continue;

    stars += report.correctCount;
    stars += Math.floor(report.correctCount * 0.3);

    if (
      report.totalCount > 0 &&
      report.correctCount === report.totalCount
    ) {
      stars += PERFECT_BONUS_STARS;
    }
  }

  return stars;
}

function estimateFromLearningPath(): number {
  const data = readJson(LEARNING_PATH_KEY);
  if (!data || typeof data !== "object") return 0;

  const progress = data as Partial<LearningPathProgress>;
  if (!Array.isArray(progress.weeks)) return 0;

  const completedWeeks = progress.weeks.filter(
    (week) => week?.status === "completed",
  ).length;

  if (completedWeeks <= 0) return 0;

  // 每周通关约等于完成一轮 7 题练习
  return completedWeeks * 12;
}

function estimateFromDailyTasks(): number {
  const data = readJson(DAILY_TASKS_KEY);
  if (!data || typeof data !== "object") return 0;

  const streakDays =
    typeof (data as { streakDays?: number }).streakDays === "number"
      ? (data as { streakDays: number }).streakDays
      : 0;

  if (streakDays <= 0) return 0;

  return streakDays * 8;
}

export function estimateStarsFromLocalProgress(): number {
  const estimates = [
    estimateFromProfile(),
    estimateFromParentReports(),
    estimateFromLearningPath(),
    estimateFromDailyTasks(),
  ];

  return Math.max(0, ...estimates);
}

export function hasGrowthRecoveryApplied(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(RECOVERY_FLAG) === "1";
}

export function markGrowthRecoveryApplied(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(RECOVERY_FLAG, "1");
}

export function tryRecoverGrowthFromLocalData(currentStars: number): number {
  if (typeof window === "undefined") return currentStars;
  if (currentStars > 0) return currentStars;
  if (hasGrowthRecoveryApplied()) return currentStars;

  const estimated = estimateStarsFromLocalProgress();
  markGrowthRecoveryApplied();

  return estimated > 0 ? estimated : currentStars;
}
