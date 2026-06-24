import type { LearningPathWeekConfig } from "@/lib/curriculum/learningPathConfig";
import { formatWeekTrainingSummary } from "@/lib/curriculum/learningPathConfig";
import type { LearningPathWeekRecord } from "@/types/math";

type LearningPathWeekCardProps = {
  config: LearningPathWeekConfig;
  record: LearningPathWeekRecord;
  isCurrent: boolean;
  compact?: boolean;
};

function getStatusLabel(status: LearningPathWeekRecord["status"]): string {
  if (status === "completed") return "已完成";
  if (status === "in_progress") return "进行中";
  if (status === "available") return "可练习";
  return "未解锁";
}

function getStatusClass(status: LearningPathWeekRecord["status"]): string {
  if (status === "completed") {
    return "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200";
  }
  if (status === "in_progress") {
    return "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200";
  }
  if (status === "available") {
    return "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200";
  }
  return "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400";
}

export function LearningPathWeekCard({
  config,
  record,
  isCurrent,
  compact = false,
}: LearningPathWeekCardProps) {
  const { focusLabels, basicLabels, thinkingLabels } =
    formatWeekTrainingSummary(config);

  return (
    <div
      className={`rounded-2xl border px-5 py-4 ${
        isCurrent
          ? "border-sky-300 bg-sky-50/80 dark:border-sky-800 dark:bg-sky-950/30"
          : "border-black/[.08] bg-white dark:border-white/[.145] dark:bg-zinc-900"
      }`}
    >
      <div className="mb-2 flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              第 {config.weekNumber} 周
            </span>
            <h3 className="text-base font-semibold text-black dark:text-zinc-50">
              {config.title}
            </h3>
            {isCurrent && (
              <span className="rounded-full bg-sky-200 px-2 py-0.5 text-xs font-medium text-sky-900 dark:bg-sky-900/60 dark:text-sky-100">
                当前
              </span>
            )}
          </div>
          {!compact && (
            <p className="mt-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              {config.goal}
            </p>
          )}
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClass(record.status)}`}
        >
          {getStatusLabel(record.status)}
        </span>
      </div>

      {!compact && (
        <dl className="mt-3 space-y-2 text-sm">
          <div>
            <dt className="font-medium text-zinc-700 dark:text-zinc-300">
              重点知识点
            </dt>
            <dd className="mt-0.5 text-zinc-600 dark:text-zinc-400">
              {focusLabels}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-zinc-700 dark:text-zinc-300">
              基础训练
            </dt>
            <dd className="mt-0.5 text-zinc-600 dark:text-zinc-400">
              {basicLabels}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-zinc-700 dark:text-zinc-300">
              思维训练
            </dt>
            <dd className="mt-0.5 text-zinc-600 dark:text-zinc-400">
              {thinkingLabels}
            </dd>
          </div>
        </dl>
      )}

      {record.bestAccuracy !== undefined && (
        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
          最佳正确率 {record.bestAccuracy}%
        </p>
      )}
    </div>
  );
}
