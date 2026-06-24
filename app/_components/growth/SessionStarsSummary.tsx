import type { SessionStarBreakdown } from "@/lib/types/growth";

type SessionStarsSummaryProps = {
  breakdown: SessionStarBreakdown;
};

export function SessionStarsSummary({ breakdown }: SessionStarsSummaryProps) {
  if (breakdown.total <= 0) return null;

  return (
    <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 dark:border-amber-900 dark:bg-amber-950/30">
      <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
        ⭐ 本轮获得 {breakdown.total} 颗星星
      </p>
      <ul className="mt-2 space-y-1 text-sm text-amber-700 dark:text-amber-300">
        {breakdown.questionStars > 0 && (
          <li>答对题目 +{breakdown.questionStars} 星（基础 +1 / 拓展 +3）</li>
        )}
        {breakdown.perfectBonus > 0 && (
          <li>全部答对奖励 +{breakdown.perfectBonus} 星</li>
        )}
      </ul>
    </div>
  );
}

export function buildSessionStarBreakdown(
  questionStars: number,
  perfectBonus: number,
): SessionStarBreakdown {
  return {
    questionStars,
    perfectBonus,
    total: questionStars + perfectBonus,
  };
}
