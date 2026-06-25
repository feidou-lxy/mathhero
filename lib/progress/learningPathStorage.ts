import {
  buildLearningPathView,
  createInitialLearningPath,
  markPathWeekInProgress,
  normalizeLearningPath,
  recordPathWeekDailyPractice,
  type PathWeekDayResult,
} from "@/lib/progress/learningPath";
import { scheduleStudentDataPush } from "@/lib/progress/studentDataPush";
import type { LearningPathProgress, LearningPathView } from "@/types/math";

const STORAGE_KEY = "mathhero-learning-path";

function readRaw(): unknown {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeRaw(progress: LearningPathProgress, sync = true): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  if (sync) scheduleStudentDataPush();
}

export function loadLearningPathProgress(): LearningPathProgress {
  const stored = readRaw();
  if (!stored) {
    const initial = createInitialLearningPath();
    writeRaw(initial, false);
    return initial;
  }

  const normalized = normalizeLearningPath(stored);
  writeRaw(normalized, false);
  return normalized;
}

export function saveLearningPathProgress(
  progress: LearningPathProgress,
): void {
  writeRaw(progress);
}

export function loadLearningPathView(): LearningPathView {
  return buildLearningPathView(loadLearningPathProgress());
}

export function startPathWeek(weekNumber: number): LearningPathProgress {
  const progress = markPathWeekInProgress(
    loadLearningPathProgress(),
    weekNumber,
  );
  saveLearningPathProgress(progress);
  return progress;
}

export function completePathWeekOnReview(
  weekNumber: number,
  correctCount: number,
  total: number,
  practiceDate: string,
): { progress: LearningPathProgress; result: PathWeekDayResult } | null {
  if (total === 0) return null;

  const accuracy = correctCount / total;
  const before = loadLearningPathProgress();
  const { progress: after, result } = recordPathWeekDailyPractice(
    before,
    weekNumber,
    accuracy,
    practiceDate,
  );

  saveLearningPathProgress(after);
  return { progress: after, result };
}
