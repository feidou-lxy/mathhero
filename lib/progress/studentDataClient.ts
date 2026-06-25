import { loadGrowth } from "@/lib/progress/growthStorage";
import { loadProfileFromStorage } from "@/lib/profile/clientStorage";
import { loadLearningPathProgress } from "@/lib/progress/learningPathStorage";
import { loadMistakeBook } from "@/lib/mistakes/mistakeStorage";
import { loadParentReports } from "@/lib/progress/parentReportStorage";
import type { StoredDailyTasks } from "@/lib/progress/dailyTasks";
import type { StudentDataBundle } from "@/lib/types/studentData";
import { normalizeStudentDataBundle } from "@/lib/progress/studentDataMerge";
import { notifyGrowthUpdated } from "@/lib/progress/growthEvents";
import { notifyStudentDataUpdated } from "@/lib/progress/studentDataEvents";

const PROFILE_KEY = "mathhero-student-profile";
const GROWTH_KEY = "mathhero-student-growth";
const LEARNING_PATH_KEY = "mathhero-learning-path";
const DAILY_TASKS_KEY = "mathhero-daily-tasks";
const PARENT_REPORTS_KEY = "mathhero-parent-reports";
const MISTAKE_BOOK_KEY = "mathhero-mistake-book";

function readDailyTasksRaw(): StoredDailyTasks | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(DAILY_TASKS_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredDailyTasks;
  } catch {
    return null;
  }
}

export function loadLocalStudentDataBundle(): StudentDataBundle {
  return normalizeStudentDataBundle({
    studentId: "default",
    updatedAt: new Date().toISOString(),
    profile: loadProfileFromStorage(),
    growth: loadGrowth(),
    learningPath: loadLearningPathProgress(),
    dailyTasks: readDailyTasksRaw(),
    parentReports: { reports: loadParentReports() },
    mistakeBook: loadMistakeBook(),
  });
}

export function applyStudentDataBundleToLocal(bundle: StudentDataBundle): void {
  if (typeof window === "undefined") return;

  const normalized = normalizeStudentDataBundle(bundle);

  localStorage.setItem(PROFILE_KEY, JSON.stringify(normalized.profile));
  localStorage.setItem(GROWTH_KEY, JSON.stringify(normalized.growth));
  localStorage.setItem(LEARNING_PATH_KEY, JSON.stringify(normalized.learningPath));

  if (normalized.dailyTasks) {
    localStorage.setItem(DAILY_TASKS_KEY, JSON.stringify(normalized.dailyTasks));
  }

  localStorage.setItem(
    PARENT_REPORTS_KEY,
    JSON.stringify(normalized.parentReports),
  );
  localStorage.setItem(MISTAKE_BOOK_KEY, JSON.stringify(normalized.mistakeBook));

  notifyGrowthUpdated();
  notifyStudentDataUpdated();
}
