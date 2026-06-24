import type { ParentLearningReport } from "@/lib/types/parentReport";
import { TEACHER_NAME } from "@/lib/ai/teacherCharacter";

type ParentReportCardProps = {
  report: ParentLearningReport;
  highlight?: boolean;
};

function formatReportTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;

  return date.toLocaleString("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function SkillTags({
  items,
  variant,
}: {
  items: string[];
  variant: "mastered" | "weak";
}) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        {variant === "mastered" ? "本轮暂无全对知识点" : "本轮没有明显薄弱项"}
      </p>
    );
  }

  const className =
    variant === "mastered"
      ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200"
      : "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200";

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((label) => (
        <span
          key={label}
          className={`rounded-full px-3 py-1 text-xs font-medium ${className}`}
        >
          {label}
        </span>
      ))}
    </div>
  );
}

export function ParentReportCard({ report, highlight = false }: ParentReportCardProps) {
  return (
    <article
      className={`rounded-2xl border px-5 py-5 ${
        highlight
          ? "border-violet-300 bg-violet-50/60 dark:border-violet-800 dark:bg-violet-950/30"
          : "border-black/[.08] bg-white dark:border-white/[.145] dark:bg-zinc-900"
      }`}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-black dark:text-zinc-50">
            {report.sessionTitle}
          </h3>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {formatReportTime(report.createdAt)}
          </p>
        </div>
        {highlight && (
          <span className="shrink-0 rounded-full bg-violet-200 px-2.5 py-1 text-xs font-medium text-violet-900 dark:bg-violet-900/60 dark:text-violet-100">
            最新
          </span>
        )}
      </div>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl bg-white/70 px-3 py-3 dark:bg-zinc-950/40">
          <dt className="text-xs text-zinc-500 dark:text-zinc-400">学习时长</dt>
          <dd className="mt-1 text-lg font-semibold text-black dark:text-zinc-50">
            {report.durationLabel}
          </dd>
        </div>
        <div className="rounded-xl bg-white/70 px-3 py-3 dark:bg-zinc-950/40">
          <dt className="text-xs text-zinc-500 dark:text-zinc-400">正确率</dt>
          <dd className="mt-1 text-lg font-semibold text-black dark:text-zinc-50">
            {report.accuracyPercent}%
          </dd>
        </div>
        <div className="rounded-xl bg-white/70 px-3 py-3 dark:bg-zinc-950/40">
          <dt className="text-xs text-zinc-500 dark:text-zinc-400">答对题数</dt>
          <dd className="mt-1 text-lg font-semibold text-black dark:text-zinc-50">
            {report.correctCount}/{report.totalCount}
          </dd>
        </div>
        <div className="rounded-xl bg-white/70 px-3 py-3 dark:bg-zinc-950/40">
          <dt className="text-xs text-zinc-500 dark:text-zinc-400">错题数量</dt>
          <dd className="mt-1 text-lg font-semibold text-black dark:text-zinc-50">
            {report.wrongCount}
          </dd>
        </div>
      </dl>

      <div className="mt-5 space-y-4">
        <div>
          <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            掌握知识点
          </p>
          <SkillTags items={report.masteredSkills} variant="mastered" />
        </div>
        <div>
          <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            薄弱知识点
          </p>
          <SkillTags items={report.weakSkills} variant="weak" />
        </div>
        <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-4 dark:border-sky-900 dark:bg-sky-950/30">
          <p className="mb-2 text-sm font-medium text-sky-800 dark:text-sky-200">
            {report.teacherName ?? TEACHER_NAME}评语
          </p>
          <p className="text-sm leading-relaxed text-sky-900 dark:text-sky-100">
            {report.teacherComment}
          </p>
        </div>
      </div>
    </article>
  );
}
