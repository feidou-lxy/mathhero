"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { MistakeCard } from "@/app/_components/mistakes/MistakeCard";
import {
  loadMistakes,
  removeMistake,
} from "@/lib/mistakes/mistakeStorage";
import type { MistakeEntry } from "@/lib/types/mistakes";

export function MistakesPageContent() {
  const [mistakes, setMistakes] = useState<MistakeEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setMistakes(loadMistakes());
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  function handleDelete(id: string) {
    setMistakes(removeMistake(id));
  }

  const canDrill = mistakes.length > 0;

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-6 py-12">
        <header className="mb-6">
          <Link
            href="/"
            className="mb-4 inline-block text-sm text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            ← 返回首页
          </Link>
          <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
            错题本
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            做错的题目会自动保存在这里，多练几次就能掌握啦！
          </p>
        </header>

        <div className="mb-6 flex items-center justify-between rounded-xl border border-black/[.08] bg-white px-4 py-3 dark:border-white/[.145] dark:bg-zinc-900">
          <div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">错题数量</p>
            <p className="text-2xl font-semibold text-black dark:text-zinc-50">
              {mistakes.length}
            </p>
          </div>
          {canDrill && (
            <Link
              href="/practice?mode=mistakes_drill"
              className="rounded-full bg-foreground px-4 py-2.5 text-sm font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
            >
              一键错题专项
            </Link>
          )}
        </div>

        {loading && (
          <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
            加载中…
          </p>
        )}

        {!loading && mistakes.length === 0 && (
          <div className="rounded-2xl border border-black/[.08] bg-white px-6 py-12 text-center dark:border-white/[.145] dark:bg-zinc-900">
            <p className="text-lg font-medium text-black dark:text-zinc-50">
              太棒了，暂时没有错题！
            </p>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              继续练习，有做错的题会自动出现在这里。
            </p>
            <Link
              href="/practice?task=daily_main"
              className="mt-6 inline-flex rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background"
            >
              去练习
            </Link>
          </div>
        )}

        <div className="space-y-4">
          {mistakes.map((mistake) => (
            <MistakeCard
              key={mistake.id}
              mistake={mistake}
              onDelete={handleDelete}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
