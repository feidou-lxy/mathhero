import Link from "next/link";
import { getSkillLabel } from "@/lib/types/profile";
import type { MistakeEntry } from "@/lib/types/mistakes";

type MistakeCardProps = {
  mistake: MistakeEntry;
  onDelete: (id: string) => void;
};

function formatTime(iso: string): string {
  try {
    const date = new Date(iso);
    return date.toLocaleString("zh-CN", {
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function MistakeCard({ mistake, onDelete }: MistakeCardProps) {
  const categoryLabel = getSkillLabel(mistake.category);

  return (
    <article className="rounded-2xl border border-black/[.08] bg-white px-5 py-4 dark:border-white/[.145] dark:bg-zinc-900">
      <div className="mb-3 flex items-start justify-between gap-3">
        <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-medium text-rose-800 dark:bg-rose-900/40 dark:text-rose-200">
          {categoryLabel}
        </span>
        <span className="shrink-0 text-xs text-zinc-500 dark:text-zinc-400">
          错 {mistake.wrongCount} 次
        </span>
      </div>

      <p className="text-base leading-relaxed font-medium text-black dark:text-zinc-50">
        {mistake.prompt}
      </p>

      <dl className="mt-3 space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
        <div className="flex gap-2">
          <dt className="shrink-0 text-zinc-500">你的答案</dt>
          <dd className="text-rose-600 dark:text-rose-400">
            {mistake.userAnswer || "—"}
            {mistake.unit ? ` ${mistake.unit}` : ""}
          </dd>
        </div>
        <div className="flex gap-2">
          <dt className="shrink-0 text-zinc-500">正确答案</dt>
          <dd className="font-medium text-green-700 dark:text-green-400">
            {mistake.correctAnswer}
            {mistake.unit ? ` ${mistake.unit}` : ""}
          </dd>
        </div>
        <div className="flex gap-2">
          <dt className="shrink-0 text-zinc-500">最近练习</dt>
          <dd>{formatTime(mistake.lastPracticedAt)}</dd>
        </div>
      </dl>

      <div className="mt-4 flex gap-2">
        <Link
          href={`/practice?mistakeId=${mistake.id}`}
          className="flex flex-1 items-center justify-center rounded-full bg-foreground py-2.5 text-sm font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
        >
          重新练习
        </Link>
        <button
          type="button"
          onClick={() => onDelete(mistake.id)}
          className="rounded-full border border-black/[.08] px-4 py-2.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-white/[.145] dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          删除
        </button>
      </div>
    </article>
  );
}
