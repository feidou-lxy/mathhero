import Link from "next/link";
import { getTaskPracticeHref } from "@/lib/progress/dailyTasks";
import type { DailyTask } from "@/lib/types/dailyTasks";

type DailyTaskCardProps = {
  task: DailyTask;
};

function getStatusLabel(task: DailyTask): string {
  if (task.status === "completed") return "已完成";
  if (task.status === "in_progress") return "进行中";
  return "未完成";
}

function getStatusClass(task: DailyTask): string {
  if (task.status === "completed") {
    return "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200";
  }
  if (task.status === "in_progress") {
    return "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200";
  }
  return "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300";
}

export function DailyTaskCard({ task }: DailyTaskCardProps) {
  const isCompleted = task.status === "completed";
  const href = getTaskPracticeHref(task);

  return (
    <div className="rounded-2xl border border-black/[.08] bg-white px-5 py-4 dark:border-white/[.145] dark:bg-zinc-900">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-black dark:text-zinc-50">
              {task.title}
            </h3>
            {task.required && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                必做
              </span>
            )}
          </div>
          <p className="mt-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            {task.description}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClass(task)}`}
        >
          {getStatusLabel(task)}
        </span>
      </div>

      {!isCompleted && (
        <Link
          href={href}
          className="mt-3 inline-flex w-full items-center justify-center rounded-full bg-foreground py-2.5 text-sm font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
        >
          开始练习
        </Link>
      )}
    </div>
  );
}
