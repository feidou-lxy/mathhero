"use client";

import { useEffect, useState } from "react";
import { loadDailyTaskProgress } from "@/lib/progress/dailyTaskStorage";
import type { DailyTaskProgress } from "@/lib/types/dailyTasks";
import { DailyTaskCard } from "./DailyTaskCard";
import { DailyTaskStats } from "./DailyTaskStats";

export function DailyTaskSection() {
  const [progress, setProgress] = useState<DailyTaskProgress | null>(null);

  useEffect(() => {
    setProgress(loadDailyTaskProgress());
  }, []);

  if (!progress) {
    return (
      <div className="rounded-2xl border border-black/[.08] bg-white px-5 py-8 text-center dark:border-white/[.145] dark:bg-zinc-900">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">加载今日任务…</p>
      </div>
    );
  }

  const { plan, completedQuestionCount, totalTaskCount, allCompleted } =
    progress;

  return (
    <section className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-black dark:text-zinc-50">
          今日任务
        </h2>
        <span className="text-sm text-zinc-500 dark:text-zinc-400">
          {plan.date}
        </span>
      </div>

      <DailyTaskStats
        totalTaskCount={totalTaskCount}
        completedQuestionCount={completedQuestionCount}
        streakDays={plan.streakDays}
      />

      {allCompleted && (
        <div className="rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-center dark:border-green-900 dark:bg-green-950/30">
          <p className="text-base font-semibold text-green-800 dark:text-green-200">
            今日已完成 🎉
          </p>
          <p className="mt-1 text-sm text-green-700 dark:text-green-300">
            太棒了！今天的任务都做完啦，明天再来挑战吧～
          </p>
        </div>
      )}

      <div className="space-y-3">
        {plan.tasks.map((task) => (
          <DailyTaskCard key={task.id} task={task} />
        ))}
      </div>
    </section>
  );
}
