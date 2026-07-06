"use client";

import { Suspense } from "react";
import { PracticeAnsweringCard } from "@/app/practice/_components/PracticeAnsweringCard";
import { PracticeReviewSection } from "@/app/practice/_components/PracticeReviewSection";
import { usePracticeSession } from "@/lib/practice/usePracticeSession";

function PracticePageInner() {
  const session = usePracticeSession();

  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 px-6 py-16 dark:bg-black">
      <main className="w-full max-w-lg">
        {session.phase !== "review" && (
          <>
            <h1 className="mb-2 text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
              数学大闯关
            </h1>
            <p className="mb-4 text-zinc-600 dark:text-zinc-400">{session.subtitle}</p>
          </>
        )}

        {session.error && (
          <p className="mb-4 text-red-500 dark:text-red-400">{session.error}</p>
        )}

        {session.loading && (
          <div className="rounded-2xl border border-black/[.08] bg-white px-6 py-16 text-center dark:border-white/[.145] dark:bg-zinc-900">
            <p className="text-zinc-600 dark:text-zinc-400">题目加载中…</p>
          </div>
        )}

        {!session.loading &&
          session.phase === "answering" &&
          session.displayQuestion && (
          <PracticeAnsweringCard
            displayQuestion={session.displayQuestion}
            questionMode={session.questionMode}
            practiceSource={session.practiceSource}
            progressLabel={session.progressLabel}
            progressPercent={session.progressPercent}
            currentAnswer={session.currentAnswer}
            currentDialogue={session.currentDialogue}
            feedback={session.feedback}
            inHintDialogue={session.inHintDialogue}
            chatInput={session.chatInput}
            chatLoading={session.chatLoading}
            tutorLoading={session.tutorLoading}
            reinforcementLoading={session.reinforcementLoading}
            nextButtonLabel={session.nextButtonLabel}
            isLastMainQuestion={session.isLastMainQuestion}
            calcTimerSeconds={session.calcTimerSeconds}
            hidePerQuestionStars={session.isDailyMain}
            onAnswerChange={session.handleAnswerChange}
            onSubmitAnswer={() => void session.handleSubmitAnswer()}
            onSendChat={() => void session.handleSendChat()}
            onChatInputChange={session.setChatInput}
            onAdvanceAfterCorrect={session.advanceAfterCorrect}
            onAdvanceAfterReveal={session.advanceAfterReveal}
            onStartReinforcement={() => void session.startReinforcement()}
          />
        )}

        {!session.loading &&
          session.phase === "review" &&
          session.mainQuestions.length > 0 && (
          <PracticeReviewSection
            practiceSource={session.practiceSource}
            mainQuestions={session.mainQuestions}
            answers={session.answers}
            results={session.results}
            total={session.total}
            correctCount={session.correctCount}
            sessionSummary={session.sessionSummary}
            sessionStarBreakdown={session.sessionStarBreakdown}
            streakDays={session.streakDays}
            skillBreakdown={session.skillBreakdown}
            activeTaskId={session.activeTaskId}
            activeTask={session.activeTask}
            taskProgress={session.taskProgress}
            pathWeek={session.pathWeek}
            pathWeekConfig={session.pathWeekConfig}
            pathWeekPassed={session.pathWeekPassed}
            pathWeekDayResult={session.pathWeekDayResult}
            pathProgress={session.pathProgress}
            parentReport={session.parentReport}
            onRestart={session.handleRestart}
          />
        )}
      </main>
    </div>
  );
}

function PracticePageFallback() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-6 py-16 dark:bg-black">
      <p className="text-zinc-600 dark:text-zinc-400">练习加载中…</p>
    </div>
  );
}

export default function PracticePage() {
  return (
    <Suspense fallback={<PracticePageFallback />}>
      <PracticePageInner />
    </Suspense>
  );
}
