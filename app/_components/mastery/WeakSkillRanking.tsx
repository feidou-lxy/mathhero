import Link from "next/link";
import type { SkillMasteryItem } from "@/lib/types/mastery";

type WeakSkillRankingProps = {
  ranking: SkillMasteryItem[];
};

function getRankBadge(index: number): string {
  if (index === 0) return "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200";
  if (index === 1) return "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200";
  if (index === 2) return "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200";
  return "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300";
}

export function WeakSkillRanking({ ranking }: WeakSkillRankingProps) {
  const topWeak = ranking.slice(0, 5);

  if (topWeak.length === 0) {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 px-5 py-4 dark:border-green-900 dark:bg-green-950/30">
        <p className="text-sm font-medium text-green-800 dark:text-green-200">
          暂无薄弱项
        </p>
        <p className="mt-1 text-sm text-green-700 dark:text-green-300">
          各知识点表现均衡，继续保持！
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {topWeak.map((item, index) => (
        <div
          key={item.skill}
          className="rounded-2xl border border-black/[.08] bg-white px-4 py-4 dark:border-white/[.145] dark:bg-zinc-900"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${getRankBadge(index)}`}
              >
                {index + 1}
              </span>
              <div>
                <p className="text-base font-semibold text-black dark:text-zinc-50">
                  {item.label}
                </p>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  {item.practiced
                    ? `掌握率 ${item.accuracy}% · ${item.levelLabel} · 答对 ${item.correct}/${item.total} 题`
                    : "尚未练习，建议优先体验"}
                </p>
              </div>
            </div>
          </div>
          <Link
            href={`/practice?skill=${item.skill}`}
            className="mt-3 inline-flex w-full items-center justify-center rounded-full border border-black/[.08] py-2 text-sm font-medium transition-colors hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a]"
          >
            专项加练
          </Link>
        </div>
      ))}
    </div>
  );
}
