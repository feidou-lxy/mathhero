import { MAX_HINT_ROUNDS } from "@/lib/types/tutor";
import {
  TEACHER_NAME,
  TEACHER_REPLYING_MESSAGE,
  TEACHER_THINKING_MESSAGE,
} from "@/lib/ai/teacherCharacter";
import { getStarsForQuestion } from "@/lib/progress/growth";
import { CALC_TIMER_SECONDS } from "@/lib/practice/calcTimer";
import { isChoiceQuestion } from "@/lib/practice/questionPresentation";
import type {
  DialogueMessage,
  Question,
  TutorFeedbackResponse,
} from "@/types/math";
import type { PracticeSource, QuestionMode } from "@/lib/practice/types";

type PracticeAnsweringCardProps = {
  displayQuestion: Question;
  questionMode: QuestionMode;
  practiceSource: PracticeSource;
  progressLabel: string;
  progressPercent: number;
  currentAnswer: string;
  currentDialogue: DialogueMessage[];
  feedback: TutorFeedbackResponse | null;
  inHintDialogue: boolean;
  chatInput: string;
  chatLoading: boolean;
  tutorLoading: boolean;
  reinforcementLoading: boolean;
  nextButtonLabel: string;
  isLastMainQuestion: boolean;
  calcTimerSeconds: number | null;
  onAnswerChange: (value: string) => void;
  onSubmitAnswer: () => void;
  onSendChat: () => void;
  onChatInputChange: (value: string) => void;
  onAdvanceAfterCorrect: () => void;
  onAdvanceAfterReveal: () => void;
  onStartReinforcement: () => void;
};

export function PracticeAnsweringCard({
  displayQuestion,
  questionMode,
  practiceSource,
  progressLabel,
  progressPercent,
  currentAnswer,
  currentDialogue,
  feedback,
  inHintDialogue,
  chatInput,
  chatLoading,
  tutorLoading,
  reinforcementLoading,
  nextButtonLabel,
  isLastMainQuestion,
  calcTimerSeconds,
  onAnswerChange,
  onSubmitAnswer,
  onSendChat,
  onChatInputChange,
  onAdvanceAfterCorrect,
  onAdvanceAfterReveal,
  onStartReinforcement,
}: PracticeAnsweringCardProps) {
  const choiceQuestion = isChoiceQuestion(displayQuestion);

  return (
    <div className="rounded-2xl border border-black/[.08] bg-white px-6 py-8 dark:border-white/[.145] dark:bg-zinc-900">
      <div className="mb-6 flex items-center justify-between gap-4">
        <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
          {progressLabel}
        </span>
        <div className="flex min-w-0 flex-1 items-center justify-end gap-3">
          {calcTimerSeconds !== null && (
            <div className="flex min-w-0 max-w-40 flex-1 items-center gap-2">
              <span
                className={`shrink-0 text-sm font-semibold tabular-nums ${
                  calcTimerSeconds <= 10
                    ? "text-red-600 dark:text-red-400"
                    : "text-zinc-600 dark:text-zinc-300"
                }`}
              >
                {calcTimerSeconds}s
              </span>
              <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ease-linear ${
                    calcTimerSeconds <= 10
                      ? "bg-red-500 dark:bg-red-400"
                      : "bg-foreground"
                  }`}
                  style={{
                    width: `${(calcTimerSeconds / CALC_TIMER_SECONDS) * 100}%`,
                  }}
                />
              </div>
            </div>
          )}
          <div className="h-2 w-24 shrink-0 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
            <div
              className="h-full rounded-full bg-foreground transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {questionMode === "reinforcement" && (
        <p className="mb-3 text-sm text-rose-600 dark:text-rose-400">
          这道题有点难，我们换两道更简单的同类题练练，答对了再进入下一题～
        </p>
      )}

      <p className="text-2xl leading-relaxed font-medium text-black dark:text-zinc-50">
        {displayQuestion.prompt}
      </p>

      {choiceQuestion ? (
        <div className="mt-8 grid gap-3">
          {displayQuestion.options!.map((option, index) => {
            const selected = currentAnswer === String(index);
            const disabled =
              feedback?.isCorrect === true ||
              (feedback?.answerRevealed === true && questionMode === "main");

            return (
              <button
                key={`${displayQuestion.id}-${option}-${index}`}
                type="button"
                disabled={disabled}
                onClick={() => onAnswerChange(String(index))}
                className={`rounded-xl border px-4 py-4 text-left text-lg font-medium transition-colors ${
                  selected
                    ? "border-foreground bg-foreground text-background"
                    : "border-black/[.08] bg-zinc-50 text-black hover:bg-zinc-100 disabled:opacity-60 dark:border-white/[.145] dark:bg-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-700"
                }`}
              >
                <span className="mr-3 inline-flex h-7 w-7 items-center justify-center rounded-full border text-sm">
                  {String.fromCharCode(65 + index)}
                </span>
                {option}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="mt-8 flex items-center justify-center gap-2">
          <input
            type="number"
            autoFocus
            value={currentAnswer}
            disabled={
              feedback?.isCorrect === true ||
              (feedback?.answerRevealed === true && questionMode === "main")
            }
            onChange={(e) => onAnswerChange(e.target.value)}
            onKeyDown={(e) => {
              if (
                e.key === "Enter" &&
                !feedback?.isCorrect &&
                !(feedback?.answerRevealed && questionMode === "main")
              ) {
                onSubmitAnswer();
              }
            }}
            className="w-32 rounded-xl border border-black/[.08] bg-zinc-50 px-4 py-3 text-center text-2xl disabled:opacity-60 dark:border-white/[.145] dark:bg-zinc-800"
          />
          {displayQuestion.unit && (
            <span className="text-lg text-zinc-500 dark:text-zinc-400">
              {displayQuestion.unit}
            </span>
          )}
        </div>
      )}

      {currentDialogue.length > 0 && (
        <div className="mt-6 max-h-64 space-y-3 overflow-y-auto rounded-xl border border-black/[.08] bg-zinc-50 px-4 py-4 dark:border-white/[.145] dark:bg-zinc-800/50">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            和{TEACHER_NAME}聊聊
          </p>
          {currentDialogue.map((msg, index) => (
            <div
              key={`${msg.role}-${index}`}
              className={`flex ${msg.role === "student" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                  msg.role === "student"
                    ? "bg-foreground text-background"
                    : "bg-white text-amber-900 dark:bg-zinc-900 dark:text-amber-100"
                }`}
              >
                {msg.role === "teacher" && (
                  <span className="mb-0.5 block text-xs opacity-60">
                    {TEACHER_NAME}
                  </span>
                )}
                {msg.content}
              </div>
            </div>
          ))}
          {chatLoading && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {TEACHER_REPLYING_MESSAGE}
            </p>
          )}
        </div>
      )}

      {inHintDialogue && (
        <div className="mt-4 flex gap-2">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => onChatInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSendChat();
            }}
            placeholder={`跟${TEACHER_NAME}说说你的想法…`}
            className="flex-1 rounded-xl border border-black/[.08] bg-zinc-50 px-4 py-2.5 text-sm dark:border-white/[.145] dark:bg-zinc-800"
          />
          <button
            type="button"
            onClick={onSendChat}
            disabled={!chatInput.trim() || chatLoading}
            className="shrink-0 rounded-xl bg-foreground px-4 py-2.5 text-sm font-medium text-background disabled:opacity-50"
          >
            发送
          </button>
        </div>
      )}

      {feedback && !inHintDialogue && (
        <div
          className={`mt-6 rounded-xl px-4 py-4 text-base leading-relaxed ${
            feedback.isCorrect
              ? "bg-green-50 text-green-900 dark:bg-green-950/40 dark:text-green-100"
              : feedback.answerRevealed
                ? "bg-sky-50 text-sky-900 dark:bg-sky-950/40 dark:text-sky-100"
                : "bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-100"
          }`}
        >
          <div className="mb-1 flex items-center gap-2">
            <p className="text-xs font-medium opacity-70">{TEACHER_NAME}</p>
            {feedback.isCorrect && feedback.explanation && (
              <span className="rounded-full bg-green-200/60 px-2 py-0.5 text-xs font-medium dark:bg-green-800/40">
                讲解模式
              </span>
            )}
            {feedback.hintRound && (
              <span className="rounded-full bg-amber-200/60 px-2 py-0.5 text-xs font-medium dark:bg-amber-800/40">
                提示 {feedback.hintRound}/{MAX_HINT_ROUNDS}
              </span>
            )}
          </div>
          <p>{feedback.message}</p>
          {feedback.isCorrect && (
            <p className="mt-2 text-sm font-semibold text-amber-600 dark:text-amber-400">
              +{getStarsForQuestion(displayQuestion)} ⭐
            </p>
          )}
          {feedback.isCorrect && feedback.explanation && (
            <div className="mt-3 rounded-lg bg-white/60 px-3 py-3 dark:bg-black/20">
              <p className="mb-1 text-xs font-medium text-green-800/70 dark:text-green-200/70">
                {TEACHER_NAME}讲解
              </p>
              <p className="text-sm leading-relaxed">{feedback.explanation}</p>
            </div>
          )}
        </div>
      )}

      {feedback && inHintDialogue && (
        <div className="mt-4 flex items-center gap-2">
          <span className="rounded-full bg-amber-200/60 px-2 py-0.5 text-xs font-medium text-amber-900 dark:bg-amber-800/40 dark:text-amber-100">
            提示 {feedback.hintRound}/{MAX_HINT_ROUNDS}
          </span>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            想好了可以修改答案，再点「再试一次」
          </span>
        </div>
      )}

      <div className="mt-8 flex flex-col gap-3">
        {!feedback?.isCorrect &&
          !(feedback?.answerRevealed && questionMode === "main") && (
          <button
            type="button"
            onClick={onSubmitAnswer}
            disabled={!currentAnswer.trim() || tutorLoading}
            className="w-full rounded-full bg-foreground py-3 text-base font-medium text-background transition-colors hover:bg-[#383838] disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-[#ccc]"
          >
            {tutorLoading
              ? TEACHER_THINKING_MESSAGE
              : feedback?.answerRevealed && questionMode === "reinforcement"
                ? "提交正确答案"
                : feedback
                  ? "再试一次"
                  : "提交答案"}
          </button>
        )}

        {feedback?.isCorrect && (
          <button
            type="button"
            onClick={onAdvanceAfterCorrect}
            className="w-full rounded-full bg-foreground py-3 text-base font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
          >
            {nextButtonLabel}
          </button>
        )}

        {questionMode === "main" &&
          feedback?.answerRevealed &&
          practiceSource === "normal" && (
          <button
            type="button"
            onClick={onStartReinforcement}
            disabled={reinforcementLoading}
            className="w-full rounded-full bg-foreground py-3 text-base font-medium text-background transition-colors hover:bg-[#383838] disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-[#ccc]"
          >
            {reinforcementLoading ? "正在生成巩固题…" : "开始巩固练习"}
          </button>
        )}

        {questionMode === "main" &&
          feedback?.answerRevealed &&
          practiceSource !== "normal" && (
          <button
            type="button"
            onClick={onAdvanceAfterReveal}
            className="w-full rounded-full bg-foreground py-3 text-base font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
          >
            {isLastMainQuestion ? "查看结果" : "下一题"}
          </button>
        )}
      </div>
    </div>
  );
}
