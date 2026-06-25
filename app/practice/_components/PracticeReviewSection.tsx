import Link from "next/link";
import {
  buildTeacherSessionComment,
  TEACHER_NAME,
} from "@/lib/ai/teacherCharacter";
import { PracticeCelebrationHero } from "@/app/practice/_components/PracticeCelebrationHero";
import { formatUserAnswerDisplay } from "@/lib/practice/questionPresentation";
import type { SessionStarBreakdown } from "@/lib/types/growth";
import type { DailyTaskProgress } from "@/lib/types/dailyTasks";
import type {
  DailyTask,
  Question,
  QuestionAnswerResult,
  SessionSummary,
} from "@/types/math";
import type { PathWeekDayResult } from "@/lib/progress/learningPath";
import { formatPathWeekReviewMessage } from "@/lib/progress/learningPath";
import type { LearningPathWeekConfig } from "@/lib/curriculum/learningPathConfig";
import type { LearningPathProgress } from "@/types/math";
import type { ParentLearningReport } from "@/lib/types/parentReport";
import type { PracticeSource } from "@/lib/practice/types";

type SkillBreakdownItem = {
  label: string;
  correct: number;
  total: number;
};

type PracticeReviewSectionProps = {
  practiceSource: PracticeSource;
  mainQuestions: Question[];
  answers: Record<number, string>;
  results: Record<number, QuestionAnswerResult>;
  total: number;
  correctCount: number;
  sessionSummary: SessionSummary | null;
  sessionStarBreakdown: SessionStarBreakdown;
  streakDays: number;
  skillBreakdown: SkillBreakdownItem[];
  activeTaskId: string | null;
  activeTask: DailyTask | null;
  taskProgress: DailyTaskProgress | null;
  pathWeek: number | null;
  pathWeekConfig: LearningPathWeekConfig | null;
  pathWeekPassed: boolean | null;
  pathWeekDayResult: PathWeekDayResult | null;
  pathProgress: LearningPathProgress | null;
  parentReport: ParentLearningReport | null;
  onRestart: () => void;
};

export function PracticeReviewSection({
  practiceSource,
  mainQuestions,
  answers,
  results,
  total,
  correctCount,
  sessionSummary,
  sessionStarBreakdown,
  streakDays,
  skillBreakdown,
  activeTaskId,
  activeTask,
  taskProgress,
  pathWeek,
  pathWeekConfig,
  pathWeekPassed,
  pathWeekDayResult,
  pathProgress,
  parentReport,
  onRestart,
}: PracticeReviewSectionProps) {
  const backHref =
    practiceSource === "mistake_single" || practiceSource === "mistakes_drill"
      ? "/mistakes"
      : "/";
  const backLabel =
    practiceSource === "mistake_single" || practiceSource === "mistakes_drill"
      ? "返回错题本"
      : "返回首页";

  const encouragement =
    parentReport?.teacherComment ??
    sessionSummary?.comment ??
    buildTeacherSessionComment(correctCount, total);

  const pathWeekReview =
    pathWeek && pathWeekConfig
      ? formatPathWeekReviewMessage(pathWeekDayResult, pathWeek, pathProgress)
      : null;

  return (
    <div>
      <PracticeCelebrationHero
        correctCount={sessionSummary?.correctCount ?? correctCount}
        total={total}
        starBreakdown={sessionStarBreakdown}
        streakDays={streakDays}
        encouragement={encouragement}
      />

      <button
        type="button"
        onClick={onRestart}
        className="mb-3 w-full rounded-full bg-foreground py-3.5 text-base font-semibold text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
      >
        继续挑战
      </button>

      <Link
        href={backHref}
        className="mb-6 flex w-full items-center justify-center rounded-full border border-solid border-black/[.08] py-3 text-base font-medium transition-colors hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a]"
      >
        {backLabel}
      </Link>

      {pathWeek && pathWeekConfig && practiceSource === "normal" && pathWeekReview && (
        <div
          className={`mb-6 rounded-2xl border px-5 py-4 ${
            pathWeekReview.tone === "success"
              ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30"
              : "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30"
          }`}
        >
          <p
            className={`text-sm font-medium ${
              pathWeekReview.tone === "success"
                ? "text-green-800 dark:text-green-200"
                : "text-amber-800 dark:text-amber-200"
            }`}
          >
            学习路径 · 第 {pathWeek} 周 · {pathWeekConfig.title}
          </p>
          <p
            className={`mt-1 text-sm ${
              pathWeekReview.tone === "success"
                ? "text-green-700 dark:text-green-300"
                : "text-amber-700 dark:text-amber-300"
            }`}
          >
            {pathWeekReview.message}
          </p>
        </div>
      )}

      {activeTaskId && activeTask && (
        <div
          className={`mb-6 rounded-2xl border px-5 py-4 ${
            activeTask.status === "completed"
              ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30"
              : "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30"
          }`}
        >
          <p
            className={`text-sm font-medium ${
              activeTask.status === "completed"
                ? "text-green-800 dark:text-green-200"
                : "text-amber-800 dark:text-amber-200"
            }`}
          >
            今日任务：{activeTask.title}
          </p>
          <p
            className={`mt-1 text-sm ${
              activeTask.status === "completed"
                ? "text-green-700 dark:text-green-300"
                : "text-amber-700 dark:text-amber-300"
            }`}
          >
            {activeTask.status === "completed"
              ? taskProgress?.allCompleted
                ? "今日已完成 🎉 所有任务都做完啦！"
                : "这个任务完成啦！回首页看看还有什么任务吧～"
              : "这次还没达标哦，正确率需要 ≥ 60%，再练一次吧！"}
          </p>
        </div>
      )}

      {parentReport && (
        <Link
          href={`/parent-report?id=${encodeURIComponent(parentReport.id)}`}
          className="mb-6 flex w-full items-center justify-center rounded-2xl border border-violet-200 bg-violet-50 px-5 py-4 text-sm font-medium text-violet-900 transition-colors hover:bg-violet-100 dark:border-violet-900 dark:bg-violet-950/30 dark:text-violet-100 dark:hover:bg-violet-950/50"
        >
          查看家长学习报告 · 正确率 {parentReport.accuracyPercent}% · 用时{" "}
          {parentReport.durationLabel}
        </Link>
      )}

      {sessionSummary && (
        <div className="mb-6 rounded-2xl border border-black/[.08] bg-white px-6 py-5 dark:border-white/[.145] dark:bg-zinc-900">
          <p className="mb-4 text-sm font-medium text-zinc-700 dark:text-zinc-200">
            学习总结
          </p>

          <div className="space-y-4 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
            <div>
              <p className="mb-1 font-medium text-zinc-800 dark:text-zinc-200">
                容易错的类型
              </p>
              <p>
                {sessionSummary.wrongCategoryLabels.length > 0
                  ? sessionSummary.weakCategoriesText
                  : "本轮各类型都做得不错 👍"}
              </p>
            </div>

            <div>
              <p className="mb-1 font-medium text-zinc-800 dark:text-zinc-200">
                建议练习方向
              </p>
              <p>{sessionSummary.recommendation}</p>
            </div>
          </div>

          {skillBreakdown.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2 border-t border-black/[.06] pt-4 dark:border-white/[.08]">
              <p className="mb-1 w-full text-xs font-medium text-zinc-500 dark:text-zinc-400">
                各知识点表现
              </p>
              {skillBreakdown.map((item) => (
                <span
                  key={item.label}
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    item.correct === item.total
                      ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200"
                      : item.correct === 0
                        ? "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200"
                        : "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200"
                  }`}
                >
                  {item.label} {item.correct}/{item.total}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      <p className="mb-3 text-sm font-medium text-zinc-500 dark:text-zinc-400">
        题目回顾
      </p>
      <ol className="space-y-4">
        {mainQuestions.map((q, index) => {
          const result = results[q.id];
          const isCorrect = result?.correct ?? false;

          return (
            <li
              key={q.id}
              className="rounded-xl border border-black/[.08] bg-white px-5 py-4 dark:border-white/[.145] dark:bg-zinc-900"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  第 {index + 1} 题
                </span>
                <span
                  className={
                    isCorrect
                      ? "font-medium text-green-600 dark:text-green-400"
                      : "font-medium text-amber-600 dark:text-amber-400"
                  }
                >
                  {isCorrect ? "对了" : "再想想"}
                </span>
              </div>
              <p className="text-base leading-relaxed text-black dark:text-zinc-50">
                {q.prompt}
              </p>
              <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                你的答案：{formatUserAnswerDisplay(q, answers[q.id] ?? "")}
              </p>
              {result?.message && (
                <p
                  className={`mt-2 text-sm leading-relaxed ${
                    isCorrect
                      ? "text-green-700 dark:text-green-300"
                      : "text-amber-700 dark:text-amber-300"
                  }`}
                >
                  {TEACHER_NAME}：{result.message}
                </p>
              )}
              {result?.explanation && (
                <p className="mt-2 rounded-lg bg-green-50 px-3 py-2 text-sm leading-relaxed text-green-800 dark:bg-green-950/30 dark:text-green-200">
                  {TEACHER_NAME}讲解：{result.explanation}
                </p>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
