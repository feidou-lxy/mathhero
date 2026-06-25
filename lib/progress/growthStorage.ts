import {
  addStars,
  createEmptyGrowth,
  getLevelProgress,
  getStarsForQuestion,
  normalizeGrowth,
  PERFECT_BONUS_STARS,
} from "@/lib/progress/growth";
import type { Question } from "@/lib/types/practice";
import { scheduleStudentDataPush } from "@/lib/progress/studentDataPush";
import { notifyGrowthUpdated } from "@/lib/progress/growthEvents";
import type { LevelProgress, StudentGrowth } from "@/lib/types/growth";

const STORAGE_KEY = "mathhero-student-growth";

function readRaw(): StudentGrowth | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return normalizeGrowth(JSON.parse(raw));
  } catch {
    return null;
  }
}

function writeRaw(growth: StudentGrowth): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(growth));
}

export function loadGrowth(): StudentGrowth {
  return readRaw() ?? createEmptyGrowth();
}

export function saveGrowth(growth: StudentGrowth): void {
  writeRaw(growth);
  scheduleStudentDataPush();
  notifyGrowthUpdated();
}

export function loadLevelProgress(): LevelProgress {
  return getLevelProgress(loadGrowth().totalStars);
}

export type AwardQuestionStarsResult = {
  growth: StudentGrowth;
  levelProgress: LevelProgress;
  starsAdded: number;
  leveledUp: boolean;
};

export function awardQuestionStars(question: Question): AwardQuestionStarsResult {
  const before = loadGrowth();
  const beforeLevel = getLevelProgress(before.totalStars).level;
  const starsAdded = getStarsForQuestion(question);
  const growth = addStars(before, starsAdded);
  saveGrowth(growth);
  const levelProgress = getLevelProgress(growth.totalStars);

  return {
    growth,
    levelProgress,
    starsAdded,
    leveledUp: levelProgress.level > beforeLevel,
  };
}

export type AwardPerfectBonusResult = {
  growth: StudentGrowth;
  levelProgress: LevelProgress;
  starsAdded: number;
  leveledUp: boolean;
  awarded: boolean;
};

export function awardPerfectBonus(): AwardPerfectBonusResult {
  const before = loadGrowth();
  const beforeLevel = getLevelProgress(before.totalStars).level;
  const growth = addStars(before, PERFECT_BONUS_STARS);
  saveGrowth(growth);
  const levelProgress = getLevelProgress(growth.totalStars);

  return {
    growth,
    levelProgress,
    starsAdded: PERFECT_BONUS_STARS,
    leveledUp: levelProgress.level > beforeLevel,
    awarded: true,
  };
}
