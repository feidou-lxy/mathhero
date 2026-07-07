"use client";

import { useEffect, useState } from "react";
import { loadLevelProgress } from "@/lib/progress/growthStorage";
import type { LevelProgress } from "@/lib/types/growth";

type GrowthCardProps = {
  /** 外部传入时用于练习页实时刷新 */
  levelProgress?: LevelProgress | null;
  compact?: boolean;
};

export function GrowthCard({ levelProgress: external, compact = false }: GrowthCardProps) {
  const [levelProgress, setLevelProgress] = useState<LevelProgress | null>(
    external ?? null,
  );

  useEffect(() => {
    if (external) {
      setLevelProgress(external);
      return;
    }
    setLevelProgress(loadLevelProgress());
  }, [external]);

  if (!levelProgress) {
    return (
      <div className="rounded-2xl border border-black/[.08] bg-white px-5 py-4 dark:border-white/[.145] dark:bg-zinc-900">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">加载成长数据…</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-black/[.08] bg-white px-5 py-4 dark:border-white/[.145] dark:bg-zinc-900">
      <div className={`flex items-start justify-between gap-4 ${compact ? "" : "mb-4"}`}>
        <div>
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            当前等级
          </p>
          <p className="mt-1 text-xl font-semibold text-black dark:text-zinc-50">
            Lv.{levelProgress.level}{" "}
            <span className="text-base font-medium text-zinc-600 dark:text-zinc-300">
              {levelProgress.title}
            </span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            当前星星
          </p>
          <p className="mt-1 text-xl font-semibold text-amber-600 dark:text-amber-400">
            ⭐ {levelProgress.balanceStars}
          </p>
        </div>
      </div>

      <div className={compact ? "mt-3" : ""}>
        <div className="mb-1.5 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
          <span>升级进度</span>
          <span>
            {levelProgress.isMaxLevel
              ? "已达最高等级"
              : `距 Lv.${levelProgress.level + 1} 还需 ${levelProgress.starsToNextLevel} 星（按累计获得）`}
          </span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
          <div
            className="h-full rounded-full bg-amber-400 transition-all duration-500 dark:bg-amber-500"
            style={{ width: `${levelProgress.progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
