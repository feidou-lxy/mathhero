"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LEARNING_PATH_WEEKS } from "@/lib/curriculum/learningPathConfig";
import { getWeekRecord } from "@/lib/progress/learningPath";
import { loadLearningPathView } from "@/lib/progress/learningPathStorage";
import type { LearningPathView } from "@/types/math";
import { LearningPathWeekCard } from "./LearningPathWeekCard";

export function LearningPathSection() {
  const [view, setView] = useState<LearningPathView | null>(null);
  const [activeWeekIndex, setActiveWeekIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const loaded = loadLearningPathView();
    setView(loaded);
    setActiveWeekIndex(loaded.progress.currentWeek - 1);
  }, []);

  useEffect(() => {
    if (!view || !scrollRef.current) return;

    const target = slideRefs.current[view.progress.currentWeek - 1];
    if (!target) return;

    target.scrollIntoView({
      behavior: "instant",
      inline: "center",
      block: "nearest",
    });
  }, [view]);

  const updateActiveIndex = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;

    const containerCenter = container.scrollLeft + container.clientWidth / 2;
    let closestIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;

    slideRefs.current.forEach((slide, index) => {
      if (!slide) return;
      const slideCenter = slide.offsetLeft + slide.offsetWidth / 2;
      const distance = Math.abs(slideCenter - containerCenter);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    setActiveWeekIndex(closestIndex);
  }, []);

  if (!view) {
    return (
      <div className="rounded-2xl border border-black/[.08] bg-white px-5 py-8 text-center dark:border-white/[.145] dark:bg-zinc-900">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">加载学习路径…</p>
      </div>
    );
  }

  const { progress, completedWeekCount, totalWeeks, isPathComplete } = view;
  const currentWeek = progress.currentWeek;
  const progressPercent = Math.round((completedWeekCount / totalWeeks) * 100);
  const activeWeek = LEARNING_PATH_WEEKS[activeWeekIndex];

  return (
    <section className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-black dark:text-zinc-50">
          学习路径
        </h2>
        <span className="text-sm text-zinc-500 dark:text-zinc-400">
          {completedWeekCount}/{totalWeeks} 周 · {progressPercent}%
        </span>
      </div>

      {isPathComplete && (
        <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-center dark:border-green-900 dark:bg-green-950/30">
          <p className="text-sm font-semibold text-green-800 dark:text-green-200">
            12 周全部完成 🎉
          </p>
        </div>
      )}

      <div
        ref={scrollRef}
        onScroll={updateActiveIndex}
        className="-mx-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {LEARNING_PATH_WEEKS.map((config, index) => (
          <div
            key={config.weekNumber}
            ref={(el) => {
              slideRefs.current[index] = el;
            }}
            className="w-[calc(100%-0.5rem)] shrink-0 snap-center"
          >
            <LearningPathWeekCard
              config={config}
              record={getWeekRecord(progress, config.weekNumber)}
              isCurrent={config.weekNumber === currentWeek}
            />
          </div>
        ))}
      </div>

      <div className="flex items-center justify-center gap-1.5">
        {LEARNING_PATH_WEEKS.map((week, index) => {
          const record = getWeekRecord(progress, week.weekNumber);
          const isActive = index === activeWeekIndex;
          const dotClass =
            record.status === "completed"
              ? "bg-green-500 dark:bg-green-400"
              : record.status === "in_progress"
                ? "bg-sky-500 dark:bg-sky-400"
                : record.status === "available"
                  ? "bg-violet-400 dark:bg-violet-500"
                  : "bg-zinc-300 dark:bg-zinc-600";

          return (
            <button
              key={week.weekNumber}
              type="button"
              aria-label={`第 ${week.weekNumber} 周 ${week.title}`}
              onClick={() => {
                slideRefs.current[index]?.scrollIntoView({
                  behavior: "smooth",
                  inline: "center",
                  block: "nearest",
                });
                setActiveWeekIndex(index);
              }}
              className={`rounded-full transition-all ${dotClass} ${
                isActive ? "h-2 w-5" : "h-2 w-2 opacity-60"
              }`}
            />
          );
        })}
      </div>

      <p className="text-center text-xs text-zinc-500 dark:text-zinc-400">
        左右滑动查看每周内容 · 第 {activeWeek?.weekNumber ?? activeWeekIndex + 1} 周
        {activeWeek ? ` · ${activeWeek.title}` : ""}
      </p>
    </section>
  );
}
