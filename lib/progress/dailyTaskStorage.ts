import { loadProfileFromStorage } from "@/lib/profile/clientStorage";
import {
  getDailyTaskProgress,
  markTaskCompleted,
  markTaskInProgress,
  mergeStoredPlan,
  toDailyTaskPlan,
  type StoredDailyTasks,
} from "@/lib/progress/dailyTasks";
import type { DailyTaskPlan, DailyTaskProgress } from "@/lib/types/dailyTasks";

const STORAGE_KEY = "mathhero-daily-tasks";

function readRaw(): StoredDailyTasks | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredDailyTasks;
  } catch {
    return null;
  }
}

function writeRaw(stored: StoredDailyTasks): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
}

export function loadDailyTaskPlan(): DailyTaskPlan {
  const profile = loadProfileFromStorage();
  const stored = mergeStoredPlan(readRaw(), profile);
  writeRaw(stored);
  return toDailyTaskPlan(stored);
}

export function loadDailyTaskProgress(): DailyTaskProgress {
  const profile = loadProfileFromStorage();
  const stored = mergeStoredPlan(readRaw(), profile);
  writeRaw(stored);
  return getDailyTaskProgress(stored);
}

export function startDailyTask(taskId: string): DailyTaskProgress {
  const profile = loadProfileFromStorage();
  let stored = mergeStoredPlan(readRaw(), profile);
  stored = markTaskInProgress(stored, taskId);
  writeRaw(stored);
  return getDailyTaskProgress(stored);
}

export function completeDailyTask(
  taskId: string,
  accuracy: number,
): DailyTaskProgress {
  const profile = loadProfileFromStorage();
  let stored = mergeStoredPlan(readRaw(), profile);
  stored = markTaskCompleted(stored, taskId, accuracy);
  writeRaw(stored);
  return getDailyTaskProgress(stored);
}
