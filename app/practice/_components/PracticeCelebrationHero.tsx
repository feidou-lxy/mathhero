import { TEACHER_NAME } from "@/lib/ai/teacherCharacter";
import type { SessionStarBreakdown } from "@/lib/types/growth";

type PracticeCelebrationHeroProps = {
  correctCount: number;
  total: number;
  starBreakdown: SessionStarBreakdown;
  streakDays: number;
  encouragement: string;
};

function getCelebrationTitle(correctCount: number, total: number): string {
  if (total > 0 && correctCount === total) return "太棒了，全部答对！";
  if (total > 0 && correctCount / total >= 0.7) return "闯关成功！";
  return "完成挑战！";
}

export function PracticeCelebrationHero({
  correctCount,
  total,
  starBreakdown,
  streakDays,
  encouragement,
}: PracticeCelebrationHeroProps) {
  const isPerfect = total > 0 && correctCount === total;
  const accuracy =
    total > 0 ? Math.round((correctCount / total) * 100) : 0;

  return (
    <div className="relative mb-6 overflow-hidden rounded-3xl border border-violet-200/80 bg-gradient-to-br from-violet-100 via-amber-50 to-sky-100 px-6 py-8 dark:border-violet-900/50 dark:from-violet-950/60 dark:via-amber-950/20 dark:to-sky-950/40">
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-amber-200/40 blur-2xl dark:bg-amber-500/10"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-10 -left-6 h-28 w-28 rounded-full bg-violet-200/50 blur-2xl dark:bg-violet-500/10"
        aria-hidden
      />

      <div className="relative text-center">
        <p className="text-5xl leading-none" aria-hidden>
          {isPerfect ? "🎉" : "✨"}
        </p>
        <h2 className="mt-3 text-2xl font-bold tracking-tight text-violet-950 dark:text-violet-50">
          {getCelebrationTitle(correctCount, total)}
        </h2>
        <p className="mt-2 text-sm text-violet-800/80 dark:text-violet-200/80">
          {isPerfect
            ? `${TEACHER_NAME}为你感到骄傲，继续保持！`
            : `本轮做对了 ${correctCount} / ${total} 题 · 正确率 ${accuracy}%`}
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-white/70 bg-white/75 px-4 py-4 dark:border-white/10 dark:bg-zinc-900/70">
            <p className="text-3xl font-bold text-amber-500">
              {starBreakdown.total > 0 ? (
                <>
                  +{starBreakdown.total}
                  <span className="ml-1 text-xl">⭐</span>
                </>
              ) : (
                <span className="text-xl text-zinc-400">—</span>
              )}
            </p>
            <p className="mt-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">
              获得星星
            </p>
            {starBreakdown.total > 0 && (
              <p className="mt-1 text-[11px] leading-snug text-zinc-500 dark:text-zinc-500">
                {starBreakdown.dailyReward
                  ? `倒计时内答对 ${starBreakdown.dailyReward.correctCount} 题`
                  : (
                    <>
                      {starBreakdown.questionStars > 0 &&
                        `答对 +${starBreakdown.questionStars}`}
                      {starBreakdown.questionStars > 0 &&
                        starBreakdown.perfectBonus > 0 &&
                        " · "}
                      {starBreakdown.perfectBonus > 0 &&
                        `全对奖励 +${starBreakdown.perfectBonus}`}
                    </>
                  )}
              </p>
            )}
            {starBreakdown.dailyReward && starBreakdown.total === 0 && (
              <p className="mt-1 text-[11px] leading-snug text-zinc-500 dark:text-zinc-500">
                {starBreakdown.dailyReward.allAnsweredInTime
                  ? "需答对 3 题及以上"
                  : "有计算题超时"}
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-white/70 bg-white/75 px-4 py-4 dark:border-white/10 dark:bg-zinc-900/70">
            <p className="text-3xl font-bold text-orange-500">
              {streakDays > 0 ? (
                <>
                  {streakDays}
                  <span className="ml-1 text-xl">🔥</span>
                </>
              ) : (
                <span className="text-xl text-zinc-400">—</span>
              )}
            </p>
            <p className="mt-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">
              连续学习天数
            </p>
            <p className="mt-1 text-[11px] leading-snug text-zinc-500 dark:text-zinc-500">
              {streakDays > 1
                ? "坚持得很棒，明天继续！"
                : streakDays === 1
                  ? "今天也是学习的一天！"
                  : "完成今日闯关可累计天数"}
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-violet-200/60 bg-white/85 px-4 py-4 text-left dark:border-violet-800/40 dark:bg-zinc-900/85">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xl dark:bg-violet-900/50">
              👩‍🏫
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-violet-700 dark:text-violet-300">
                {TEACHER_NAME}鼓励你
              </p>
              <p className="mt-1 text-sm leading-relaxed text-zinc-800 dark:text-zinc-100">
                {encouragement}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
