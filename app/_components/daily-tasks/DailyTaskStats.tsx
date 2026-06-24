type DailyTaskStatsProps = {
  totalTaskCount: number;
  completedQuestionCount: number;
  streakDays: number;
};

export function DailyTaskStats({
  totalTaskCount,
  completedQuestionCount,
  streakDays,
}: DailyTaskStatsProps) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="rounded-xl border border-black/[.08] bg-white px-3 py-3 text-center dark:border-white/[.145] dark:bg-zinc-900">
        <p className="text-2xl font-semibold text-black dark:text-zinc-50">
          {totalTaskCount}
        </p>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          今日任务数
        </p>
      </div>
      <div className="rounded-xl border border-black/[.08] bg-white px-3 py-3 text-center dark:border-white/[.145] dark:bg-zinc-900">
        <p className="text-2xl font-semibold text-black dark:text-zinc-50">
          {completedQuestionCount}
        </p>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          已完成题数
        </p>
      </div>
      <div className="rounded-xl border border-black/[.08] bg-white px-3 py-3 text-center dark:border-white/[.145] dark:bg-zinc-900">
        <p className="text-2xl font-semibold text-black dark:text-zinc-50">
          {streakDays}
        </p>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          连续学习天数
        </p>
      </div>
    </div>
  );
}
