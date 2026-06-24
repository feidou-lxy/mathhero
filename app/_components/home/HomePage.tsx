"use client";

import Link from "next/link";
import { DailyTaskSection } from "@/app/_components/daily-tasks/DailyTaskSection";
import { GrowthBadge } from "@/app/_components/growth/GrowthBadge";
import { LearningPathSection } from "@/app/_components/learning-path/LearningPathSection";

export function HomePage() {
  return (
    <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-6 py-8">
        <header className="mb-6 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
              数学大闯关
            </h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              每天完成小任务，数学越练越棒！
            </p>
          </div>
          <GrowthBadge />
        </header>

        <DailyTaskSection />

        <div className="mt-8">
          <LearningPathSection />
        </div>

        <div className="mt-8 grid grid-cols-3 gap-2">
          <Link
            href="/mastery"
            className="flex items-center justify-center rounded-full border border-black/[.08] px-2 py-3 text-sm font-medium transition-colors hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a]"
          >
            知识掌握
          </Link>
          <Link
            href="/parent-report"
            className="flex items-center justify-center rounded-full border border-black/[.08] px-2 py-3 text-sm font-medium transition-colors hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a]"
          >
            学习报告
          </Link>
          <Link
            href="/mistakes"
            className="flex items-center justify-center rounded-full border border-black/[.08] px-2 py-3 text-sm font-medium transition-colors hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a]"
          >
            错题本
          </Link>
        </div>
      </main>
    </div>
  );
}
