"use client";

import { useEffect, useState } from "react";
import { GROWTH_UPDATED_EVENT } from "@/lib/progress/growthEvents";
import { STUDENT_DATA_UPDATED_EVENT } from "@/lib/progress/studentDataEvents";
import { loadLevelProgress } from "@/lib/progress/growthStorage";
import type { LevelProgress } from "@/lib/types/growth";

/** 首页右上角紧凑等级展示 */
export function GrowthBadge() {
  const [levelProgress, setLevelProgress] = useState<LevelProgress | null>(null);

  useEffect(() => {
    const refresh = () => setLevelProgress(loadLevelProgress());
    refresh();
    window.addEventListener(GROWTH_UPDATED_EVENT, refresh);
    window.addEventListener(STUDENT_DATA_UPDATED_EVENT, refresh);
    return () => {
      window.removeEventListener(GROWTH_UPDATED_EVENT, refresh);
      window.removeEventListener(STUDENT_DATA_UPDATED_EVENT, refresh);
    };
  }, []);

  if (!levelProgress) {
    return (
      <div className="h-9 w-24 shrink-0 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800" />
    );
  }

  return (
    <div
      className="flex shrink-0 flex-col items-end gap-0.5 rounded-xl border border-black/[.08] bg-white px-3 py-2 dark:border-white/[.145] dark:bg-zinc-900"
      title={
        levelProgress.isMaxLevel
          ? "已达最高等级"
          : `距 Lv.${levelProgress.level + 1} 还需 ${levelProgress.starsToNextLevel} 星`
      }
    >
      <p className="text-xs font-semibold leading-none text-black dark:text-zinc-50">
        Lv.{levelProgress.level}{" "}
        <span className="font-medium text-zinc-500 dark:text-zinc-400">
          {levelProgress.title}
        </span>
      </p>
      <p className="text-sm font-semibold leading-none text-amber-600 dark:text-amber-400">
        ⭐ {levelProgress.totalStars}
      </p>
    </div>
  );
}
