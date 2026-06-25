import type { SkillGroupMastery, SkillMasteryItem } from "@/lib/types/mastery";

type SkillAbilityChartProps = {
  items: SkillMasteryItem[];
  groups: SkillGroupMastery[];
};

function getBarColor(level: SkillMasteryItem["level"]): string {
  if (level === "proficient") return "bg-green-500 dark:bg-green-400";
  if (level === "needs_improvement") return "bg-amber-500 dark:bg-amber-400";
  return "bg-sky-500 dark:bg-sky-400";
}

function getLevelBadgeClass(level: SkillMasteryItem["level"]): string {
  if (level === "proficient") {
    return "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200";
  }
  if (level === "needs_improvement") {
    return "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200";
  }
  return "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200";
}

export function SkillAbilityChart({ items, groups }: SkillAbilityChartProps) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        {groups.map((group) => (
          <div
            key={group.id}
            className="rounded-xl border border-black/[.08] bg-white px-3 py-3 text-center dark:border-white/[.145] dark:bg-zinc-900"
          >
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{group.label}</p>
            <p className="mt-1 text-2xl font-semibold text-black dark:text-zinc-50">
              {group.practicedCount > 0 ? `${group.accuracy}%` : "—"}
            </p>
            <p className="mt-0.5 text-[11px] text-zinc-400 dark:text-zinc-500">
              {group.practicedCount}/{group.totalCount} 项
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-black/[.08] bg-white px-4 py-4 dark:border-white/[.145] dark:bg-zinc-900">
        <p className="mb-4 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          知识点掌握率
        </p>
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.skill}>
              <div className="mb-1 flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="truncate text-sm text-black dark:text-zinc-50">
                    {item.label}
                  </span>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${getLevelBadgeClass(item.level)}`}
                  >
                    {item.practiced ? item.levelLabel : "未练习"}
                  </span>
                </div>
                <span className="shrink-0 text-sm font-medium text-zinc-600 dark:text-zinc-300">
                  {item.practiced ? `${item.accuracy}%` : "—"}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                <div
                  className={`h-full rounded-full transition-all ${getBarColor(item.level)}`}
                  style={{
                    width: `${item.practiced ? item.accuracy : 0}%`,
                  }}
                />
              </div>
              {item.practiced && (
                <p className="mt-1 text-[11px] text-zinc-400 dark:text-zinc-500">
                  答对 {item.correct}/{item.total} 题
                  {item.speedLabel && item.avgResponseSeconds != null && (
                    <>
                      {" · "}
                      平均 {item.avgResponseSeconds}s · {item.speedLabel}
                    </>
                  )}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
