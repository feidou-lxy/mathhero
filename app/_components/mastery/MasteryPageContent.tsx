"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SkillAbilityChart } from "@/app/_components/mastery/SkillAbilityChart";
import { WeakSkillRanking } from "@/app/_components/mastery/WeakSkillRanking";
import { buildSkillMasteryView } from "@/lib/mastery/skillMastery";
import { loadProfileFromStorage } from "@/lib/profile/clientStorage";
import type { SkillMasteryView } from "@/lib/types/mastery";

export function MasteryPageContent() {
  const [view, setView] = useState<SkillMasteryView | null>(null);

  useEffect(() => {
    const profile = loadProfileFromStorage();
    setView(buildSkillMasteryView(profile));
  }, []);

  if (!view) {
    return (
      <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
        <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-6 py-12">
          <p className="text-zinc-600 dark:text-zinc-400">加载知识点数据…</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-6 py-12">
        <header className="mb-6">
          <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
            知识点掌握
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            每道题自动绑定知识点，系统持续统计掌握率并指导 AI 出题
          </p>
        </header>

        <div className="mb-6 rounded-2xl border border-black/[.08] bg-white px-5 py-4 dark:border-white/[.145] dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">整体掌握率</span>
            <span className="text-2xl font-semibold text-black dark:text-zinc-50">
              {view.practicedSkillCount > 0 ? `${view.overallMasteryRate}%` : "—"}
            </span>
          </div>
          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
            已练习 {view.practicedSkillCount}/{view.totalSkillCount} 个知识点
          </p>
        </div>

        <section className="mb-8">
          <h2 className="mb-3 text-lg font-semibold text-black dark:text-zinc-50">
            能力图
          </h2>
          <SkillAbilityChart items={view.items} groups={view.groups} />
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-lg font-semibold text-black dark:text-zinc-50">
            薄弱项排序
          </h2>
          <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
            排名越靠前越需要加强，AI 出题会优先覆盖这些知识点
          </p>
          <WeakSkillRanking ranking={view.weakRanking} />
        </section>

        <Link
          href="/"
          className="flex w-full items-center justify-center rounded-full border border-black/[.08] py-3.5 text-base font-medium transition-colors hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a]"
        >
          返回首页
        </Link>
      </main>
    </div>
  );
}
