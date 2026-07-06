import type { SessionStarBreakdown } from "@/lib/types/growth";

type SessionStarsSummaryProps = {
  breakdown: SessionStarBreakdown;
};

export function SessionStarsSummary({ breakdown }: SessionStarsSummaryProps) {
  if (breakdown.dailyReward) {
    const { correctCount, questionTotal, allAnsweredInTime } = breakdown.dailyReward;

    return (
      <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 dark:border-amber-900 dark:bg-amber-950/30">
        <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
          {breakdown.total > 0
            ? `⭐ 今日闯关获得 ${breakdown.total} 颗星星`
            : "⭐ 今日闯关未获得星星"}
        </p>
        <ul className="mt-2 space-y-1 text-sm text-amber-700 dark:text-amber-300">
          <li>
            倒计时内完成 {questionTotal} 题，答对 {correctCount} 题
          </li>
          {!allAnsweredInTime && (
            <li>有计算题超时未答，本轮不计星星奖励</li>
          )}
          {allAnsweredInTime && breakdown.total === 0 && (
            <li>答对 3 题及以上才有星星，继续加油～</li>
          )}
          {allAnsweredInTime && breakdown.total > 0 && (
            <li>
              奖励规则：7 题全对 5 星 · 6 题 4 星 · 5 题 3 星 · 4 题 2 星 · 3 题 1 星
            </li>
          )}
        </ul>
      </div>
    );
  }

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

export function buildDailySessionStarBreakdown(
  stars: number,
  correctCount: number,
  questionTotal: number,
  allAnsweredInTime: boolean,
): SessionStarBreakdown {
  return {
    questionStars: stars,
    perfectBonus: 0,
    total: stars,
    dailyReward: {
      correctCount,
      questionTotal,
      allAnsweredInTime,
    },
  };
}
