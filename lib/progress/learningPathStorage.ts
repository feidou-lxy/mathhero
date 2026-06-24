import {
  buildLearningPathView,
  completePathWeek,
  createInitialLearningPath,
  markPathWeekInProgress,
  normalizeLearningPath,
} from "@/lib/progress/learningPath";
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

function writeRaw(progress: LearningPathProgress): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export function loadLearningPathProgress(): LearningPathProgress {
  const stored = readRaw();
  if (!stored) {
    const initial = createInitialLearningPath();
    writeRaw(initial);
    return initial;
  }

  const normalized = normalizeLearningPath(stored);
  writeRaw(normalized);
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
): LearningPathProgress | null {
  if (total === 0) return null;

  const accuracy = correctCount / total;
  const before = loadLearningPathProgress();
  const after = completePathWeek(before, weekNumber, accuracy);

  if (after === before) return null;

  saveLearningPathProgress(after);
  return after;
}
