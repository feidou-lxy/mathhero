"use client";

import {
  buildSessionStarBreakdown,
} from "@/app/_components/growth/SessionStarsSummary";
import { loadProfileFromStorage } from "@/lib/profile/clientStorage";
import {
  buildSessionSummary,
  getSessionSkillBreakdown,
} from "@/lib/learning/sessionSummary";
import { parseTaskIdFromParam } from "@/lib/progress/dailyTasks";
import { loadDailyTaskProgress, startDailyTask } from "@/lib/progress/dailyTaskStorage";
import {
  completePathWeekOnReview,
  loadLearningPathProgress,
  startPathWeek,
} from "@/lib/progress/learningPathStorage";
import {
  parsePathWeekParam,
  PATH_WEEK_MIN_ACCURACY,
} from "@/lib/progress/learningPath";
import { getWeekConfig } from "@/lib/curriculum/learningPathConfig";
import type { LearningPathProgress } from "@/types/math";
import { createAndSaveParentReport } from "@/lib/progress/parentReportStorage";
import type { ParentLearningReport } from "@/lib/types/parentReport";
import {
  parseFocusSkillParam,
} from "@/lib/mastery/skillMastery";
import { TEACHER_UNAVAILABLE_MESSAGE } from "@/lib/ai/teacherCharacter";
import { SKILL_LABELS, type ProfileSkill } from "@/types/math";
import { awardQuestionStars, loadLevelProgress } from "@/lib/progress/growthStorage";
import {
  gradeReinforcementRetry,
  persistQuestionResult,
  submitAnswerForGrading,
} from "@/lib/practice/gradingService";
import {
  completeTaskOnReview,
  tryAwardPerfectBonus,
} from "@/lib/practice/progressService";
import {
  loadPractice,
  loadReinforcementQuestions,
} from "@/lib/practice/questionService";
import { fetchTutorChat } from "@/lib/practice/tutorApi";
import {
  getPracticeSubtitle,
  PRACTICE_LEVEL,
  REINFORCEMENT_TOTAL,
  resolvePracticeSource,
} from "@/lib/practice/types";
import type { PracticePhase, PracticeSource, QuestionMode } from "@/lib/practice/types";
import type {
  DailyTaskProgress,
  DialogueMessage,
  PracticeSet,
  Question,
  QuestionAnswerResult,
  StudentProfile,
  TutorFeedbackResponse,
} from "@/types/math";
import type { LevelProgress } from "@/lib/types/growth";
import {
  getNextButtonLabel,
  getProgressLabel,
  getProgressPercent,
} from "@/app/practice/labels";
import { normalizeQuestion, normalizeQuestions } from "@/lib/practice/questionPresentation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

export function usePracticeSession() {
  const searchParams = useSearchParams();
  const activeTaskId = parseTaskIdFromParam(searchParams.get("task"));
  const mistakeId = searchParams.get("mistakeId");
  const modeParam = searchParams.get("mode");
  const pathWeekParam = parsePathWeekParam(searchParams.get("pathWeek"));
  const focusSkillParam = parseFocusSkillParam(searchParams.get("skill"));

  const practiceSource: PracticeSource = resolvePracticeSource({
    taskId: activeTaskId,
    mistakeId,
    mode: modeParam,
  });

  const taskCompletedRef = useRef(false);
  const pathWeekCompletedRef = useRef(false);
  const reportSavedRef = useRef(false);
  const sessionStartedAtRef = useRef<number | null>(null);
  const starsAwardedRef = useRef<Set<number>>(new Set());
  const perfectBonusRef = useRef(false);

  const [practiceSet, setPracticeSet] = useState<PracticeSet | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [results, setResults] = useState<Record<number, QuestionAnswerResult>>({});
  const [attemptCounts, setAttemptCounts] = useState<Record<number, number>>({});
  const [hintHistory, setHintHistory] = useState<Record<number, string[]>>({});
  const [dialogues, setDialogues] = useState<Record<number, DialogueMessage[]>>({});
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [questionMode, setQuestionMode] = useState<QuestionMode>("main");
  const [reinforcementQueue, setReinforcementQueue] = useState<Question[]>([]);
  const [reinforcementIndex, setReinforcementIndex] = useState(0);
  const [reinforcementLoading, setReinforcementLoading] = useState(false);
  const [phase, setPhase] = useState<PracticePhase>("answering");
  const [loading, setLoading] = useState(true);
  const [tutorLoading, setTutorLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<TutorFeedbackResponse | null>(null);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [taskProgress, setTaskProgress] = useState<DailyTaskProgress | null>(null);
  const [levelProgress, setLevelProgress] = useState<LevelProgress | null>(null);
  const [sessionQuestionStars, setSessionQuestionStars] = useState(0);
  const [sessionPerfectBonus, setSessionPerfectBonus] = useState(0);
  const [pathWeek, setPathWeek] = useState<number | null>(null);
  const [pathProgress, setPathProgress] = useState<LearningPathProgress | null>(
    null,
  );
  const [pathWeekPassed, setPathWeekPassed] = useState<boolean | null>(null);
  const [focusSkill, setFocusSkill] = useState<ProfileSkill | null>(null);
  const [parentReport, setParentReport] = useState<ParentLearningReport | null>(
    null,
  );

  useEffect(() => {
    setStudentProfile(loadProfileFromStorage());
    setLevelProgress(loadLevelProgress());
    if (activeTaskId) {
      setTaskProgress(startDailyTask(activeTaskId));
    }
  }, [activeTaskId]);

  const resetSession = useCallback(() => {
    setAnswers({});
    setResults({});
    setAttemptCounts({});
    setHintHistory({});
    setDialogues({});
    setChatInput("");
    setCurrentIndex(0);
    setQuestionMode("main");
    setReinforcementQueue([]);
    setReinforcementIndex(0);
    setPhase("answering");
    setFeedback(null);
    setError(null);
    starsAwardedRef.current = new Set();
    perfectBonusRef.current = false;
    reportSavedRef.current = false;
    sessionStartedAtRef.current = null;
    setParentReport(null);
    setSessionQuestionStars(0);
    setSessionPerfectBonus(0);
  }, []);

  const loadQuestions = useCallback(
    async (force = false) => {
      setLoading(true);
      resetSession();

      try {
        let activePathWeek: number | undefined;
        let activeFocusSkill: ProfileSkill | undefined;

        if (practiceSource === "normal") {
          const taskFocusSkill = activeTaskId?.startsWith("weak_skill_")
            ? parseFocusSkillParam(activeTaskId.replace("weak_skill_", ""))
            : null;
          const resolvedFocusSkill = focusSkillParam ?? taskFocusSkill ?? null;

          if (resolvedFocusSkill) {
            setFocusSkill(resolvedFocusSkill);
            setPathWeek(null);
            activeFocusSkill = resolvedFocusSkill;
          } else {
            const progress = loadLearningPathProgress();
            const week = pathWeekParam ?? progress.currentWeek;
            setPathWeek(week);
            setPathProgress(startPathWeek(week));
            setFocusSkill(null);
            activePathWeek = week;
          }
        }

        const { practiceSet: loaded, profile } = await loadPractice({
          source: practiceSource,
          mistakeId,
          force,
          pathWeek: activePathWeek,
          focusSkill: activeFocusSkill,
        });
        setStudentProfile(profile);
        setPracticeSet({
          ...loaded,
          questions: normalizeQuestions(loaded.questions),
        });
        sessionStartedAtRef.current = Date.now();
      } catch (err) {
        setPracticeSet(null);
        setError(err instanceof Error ? err.message : "题目加载失败");
      } finally {
        setLoading(false);
      }
    },
    [resetSession, practiceSource, mistakeId, pathWeekParam, focusSkillParam, activeTaskId],
  );

  useEffect(() => {
    void loadQuestions();
  }, [loadQuestions]);

  const mainQuestions = practiceSet?.questions ?? [];
  const total = mainQuestions.length;
  const mainQuestion = mainQuestions[currentIndex];
  const displayQuestion = useMemo(() => {
    const question =
      questionMode === "main"
        ? mainQuestion
        : reinforcementQueue[reinforcementIndex];
    return question ? normalizeQuestion(question) : undefined;
  }, [questionMode, mainQuestion, reinforcementQueue, reinforcementIndex]);
  const currentAnswer = displayQuestion
    ? (answers[displayQuestion.id] ?? "")
    : "";
  const isLastMainQuestion = currentIndex === total - 1;
  const isLastReinforcement = reinforcementIndex === REINFORCEMENT_TOTAL - 1;

  const currentDialogue = displayQuestion
    ? (dialogues[displayQuestion.id] ?? [])
    : [];
  const inHintDialogue =
    !!feedback?.hintRound && !feedback.isCorrect && !feedback.answerRevealed;

  const appendDialogue = useCallback(
    (questionId: number, messages: DialogueMessage[]) => {
      setDialogues((prev) => ({
        ...prev,
        [questionId]: [...(prev[questionId] ?? []), ...messages],
      }));
    },
    [],
  );

  const awardStarsForCorrect = useCallback((question: Question) => {
    if (starsAwardedRef.current.has(question.id)) return;

    starsAwardedRef.current.add(question.id);
    const result = awardQuestionStars(question);
    setLevelProgress(result.levelProgress);
    setSessionQuestionStars((prev) => prev + result.starsAdded);
  }, []);

  const saveQuestionResult = useCallback(
    (question: Question, isCorrect: boolean) => {
      const { result, profile } = persistQuestionResult({
        question,
        userAnswer: answers[question.id] ?? "",
        isCorrect,
        questionMode,
        feedbackMessage: feedback?.message ?? "",
        feedbackExplanation: feedback?.explanation,
      });

      setResults((prev) => ({ ...prev, [question.id]: result }));
      setStudentProfile(profile);
    },
    [answers, feedback, questionMode],
  );

  const handleAnswerChange = useCallback(
    (value: string) => {
      if (!displayQuestion) return;
      if (feedback?.answerRevealed && questionMode === "main") return;
      setAnswers((prev) => ({ ...prev, [displayQuestion.id]: value }));
      if (feedback?.answerRevealed && questionMode === "reinforcement") {
        setFeedback(null);
      }
    },
    [displayQuestion, feedback, questionMode],
  );

  const handleSendChat = useCallback(async () => {
    if (
      !displayQuestion ||
      !chatInput.trim() ||
      chatLoading ||
      !feedback?.hintRound
    ) {
      return;
    }

    const studentMessage = chatInput.trim();
    const questionId = displayQuestion.id;
    const hintRound = feedback.hintRound;
    const history = [...(dialogues[questionId] ?? []), {
      role: "student" as const,
      content: studentMessage,
    }];

    appendDialogue(questionId, [{ role: "student", content: studentMessage }]);
    setChatInput("");
    setChatLoading(true);
    setError(null);

    try {
      const data = await fetchTutorChat({
        question: displayQuestion,
        userAnswer: currentAnswer,
        hintRound,
        studentMessage,
        dialogueHistory: history,
      });
      appendDialogue(questionId, [{ role: "teacher", content: data.message }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : TEACHER_UNAVAILABLE_MESSAGE);
    } finally {
      setChatLoading(false);
    }
  }, [
    appendDialogue,
    chatInput,
    chatLoading,
    currentAnswer,
    dialogues,
    displayQuestion,
    feedback,
  ]);

  const handleSubmitAnswer = useCallback(async () => {
    if (!displayQuestion || !currentAnswer.trim() || tutorLoading) return;
    if (feedback?.answerRevealed && questionMode === "main") return;

    if (feedback?.answerRevealed && questionMode === "reinforcement") {
      const retryFeedback = gradeReinforcementRetry(
        displayQuestion,
        currentAnswer,
      );
      setFeedback(retryFeedback);
      if (retryFeedback.isCorrect) {
        awardStarsForCorrect(displayQuestion);
      }
      return;
    }

    const attemptNumber = (attemptCounts[displayQuestion.id] ?? 0) + 1;
    setTutorLoading(true);
    setError(null);

    try {
      const data = await submitAnswerForGrading({
        question: displayQuestion,
        userAnswer: currentAnswer,
        attemptNumber,
        previousHints: hintHistory[displayQuestion.id] ?? [],
        dialogueHistory: dialogues[displayQuestion.id] ?? [],
      });

      setFeedback(data);

      if (data.isCorrect) {
        awardStarsForCorrect(displayQuestion);
      }

      setAttemptCounts((prev) => ({
        ...prev,
        [displayQuestion.id]: attemptNumber,
      }));

      if (!data.isCorrect && data.message) {
        appendDialogue(displayQuestion.id, [
          { role: "teacher", content: data.message },
        ]);
        setHintHistory((prev) => ({
          ...prev,
          [displayQuestion.id]: [
            ...(prev[displayQuestion.id] ?? []),
            data.message,
          ],
        }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : TEACHER_UNAVAILABLE_MESSAGE);
    } finally {
      setTutorLoading(false);
    }
  }, [
    appendDialogue,
    attemptCounts,
    awardStarsForCorrect,
    currentAnswer,
    dialogues,
    displayQuestion,
    feedback,
    hintHistory,
    questionMode,
    tutorLoading,
  ]);

  const startReinforcement = useCallback(async () => {
    if (!mainQuestion || !feedback?.answerRevealed) return;

    setReinforcementLoading(true);
    setError(null);
    saveQuestionResult(mainQuestion, false);

    try {
      const questions = await loadReinforcementQuestions(mainQuestion);
      setReinforcementQueue(normalizeQuestions(questions));
      setReinforcementIndex(0);
      setQuestionMode("reinforcement");
      setFeedback(null);
      setChatInput("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "巩固题生成失败");
    } finally {
      setReinforcementLoading(false);
    }
  }, [feedback, mainQuestion, saveQuestionResult]);

  const advanceAfterCorrect = useCallback(() => {
    if (!displayQuestion || !feedback?.isCorrect) return;

    saveQuestionResult(displayQuestion, true);
    setFeedback(null);
    setChatInput("");

    if (questionMode === "reinforcement") {
      if (!isLastReinforcement) {
        setReinforcementIndex((prev) => prev + 1);
        return;
      }

      setQuestionMode("main");
      setReinforcementQueue([]);
      setReinforcementIndex(0);

      if (isLastMainQuestion) {
        setPhase("review");
        return;
      }

      setCurrentIndex((prev) => prev + 1);
      return;
    }

    if (isLastMainQuestion) {
      setPhase("review");
      return;
    }

    setCurrentIndex((prev) => prev + 1);
  }, [
    displayQuestion,
    feedback,
    isLastMainQuestion,
    isLastReinforcement,
    questionMode,
    saveQuestionResult,
  ]);

  const advanceAfterReveal = useCallback(() => {
    if (!displayQuestion || !feedback?.answerRevealed) return;

    saveQuestionResult(displayQuestion, false);
    setFeedback(null);
    setChatInput("");

    if (isLastMainQuestion) {
      setPhase("review");
      return;
    }

    setCurrentIndex((prev) => prev + 1);
  }, [displayQuestion, feedback, isLastMainQuestion, saveQuestionResult]);

  const handleRestart = useCallback(() => {
    taskCompletedRef.current = false;
    pathWeekCompletedRef.current = false;
    setPathWeekPassed(null);
    void loadQuestions(true);
  }, [loadQuestions]);

  const correctCount = mainQuestions.filter(
    (q) => results[q.id]?.correct === true,
  ).length;

  const sessionSummary = useMemo(() => {
    if (phase !== "review" || mainQuestions.length === 0) return null;
    return buildSessionSummary(mainQuestions, results, studentProfile);
  }, [phase, mainQuestions, results, studentProfile]);

  useEffect(() => {
    if (phase !== "review" || !activeTaskId || taskCompletedRef.current) return;
    if (practiceSource !== "normal") return;
    if (total === 0) return;

    const updated = completeTaskOnReview(
      activeTaskId,
      correctCount,
      total,
      practiceSource,
    );
    if (updated) {
      taskCompletedRef.current = true;
      setTaskProgress(updated);
    }
  }, [phase, activeTaskId, correctCount, total, practiceSource]);

  useEffect(() => {
    if (phase !== "review" || !pathWeek || pathWeekCompletedRef.current) return;
    if (practiceSource !== "normal") return;
    if (total === 0) return;

    pathWeekCompletedRef.current = true;
    const accuracy = correctCount / total;
    const updated = completePathWeekOnReview(pathWeek, correctCount, total);
    if (updated) {
      setPathProgress(updated);
    }
    setPathWeekPassed(accuracy >= PATH_WEEK_MIN_ACCURACY);
  }, [phase, pathWeek, correctCount, total, practiceSource]);

  useEffect(() => {
    if (phase !== "review" || reportSavedRef.current || !sessionSummary) return;
    if (mainQuestions.length === 0) return;

    reportSavedRef.current = true;
    const durationSeconds = sessionStartedAtRef.current
      ? Math.round((Date.now() - sessionStartedAtRef.current) / 1000)
      : 0;

    const saved = createAndSaveParentReport({
      questions: mainQuestions,
      results,
      sessionSummary,
      durationSeconds,
      practiceSource,
      pathWeekConfig: pathWeek ? getWeekConfig(pathWeek) : null,
      date: practiceSet?.date,
    });
    setParentReport(saved);
  }, [
    phase,
    mainQuestions,
    results,
    sessionSummary,
    practiceSource,
    pathWeek,
    practiceSet?.date,
  ]);

  useEffect(() => {
    if (phase !== "review" || perfectBonusRef.current || total === 0) return;
    if (correctCount !== total) return;

    perfectBonusRef.current = true;
    const bonus = tryAwardPerfectBonus(correctCount, total);
    if (bonus) {
      setLevelProgress(bonus.levelProgress);
      setSessionPerfectBonus(bonus.starsAdded);
    }
  }, [phase, correctCount, total]);

  const sessionStarBreakdown = useMemo(
    () => buildSessionStarBreakdown(sessionQuestionStars, sessionPerfectBonus),
    [sessionQuestionStars, sessionPerfectBonus],
  );

  const streakDays = useMemo(() => {
    if (taskProgress) return taskProgress.plan.streakDays;
    if (phase === "review") return loadDailyTaskProgress().plan.streakDays;
    return 0;
  }, [taskProgress, phase]);

  const skillBreakdown = useMemo(() => {
    if (phase !== "review" || mainQuestions.length === 0) return [];
    return getSessionSkillBreakdown(mainQuestions, results);
  }, [phase, mainQuestions, results]);

  const activeTask = useMemo(() => {
    if (!activeTaskId || !taskProgress) return null;
    return taskProgress.plan.tasks.find((t) => t.id === activeTaskId) ?? null;
  }, [activeTaskId, taskProgress]);

  const pathWeekConfig = pathWeek ? getWeekConfig(pathWeek) : null;

  const subtitle = pathWeekConfig
    ? `第 ${pathWeekConfig.weekNumber} 周 · ${pathWeekConfig.title} · 二年级学习路径`
    : focusSkill
      ? `薄弱专项 · ${SKILL_LABELS[focusSkill]} · 针对性加练`
      : getPracticeSubtitle(
    practiceSource,
    practiceSet,
    (level) => {
      if (level === 2) return "二年级完整体系";
      if (level === "transition") return "升二年级过渡 + 二年级";
      if (level === 1) return "一年级";
      return "二年级";
    },
  );

  const progressLabel = getProgressLabel(
    questionMode,
    currentIndex,
    total,
    reinforcementIndex,
    REINFORCEMENT_TOTAL,
  );

  const progressPercent = getProgressPercent(
    questionMode,
    currentIndex,
    total,
    reinforcementIndex,
    REINFORCEMENT_TOTAL,
  );

  const nextButtonLabel = getNextButtonLabel(
    questionMode,
    isLastReinforcement,
    isLastMainQuestion,
  );

  return {
    practiceSource,
    practiceSet,
    phase,
    loading,
    error,
    levelProgress,
    subtitle,
    displayQuestion,
    questionMode,
    currentAnswer,
    currentDialogue,
    inHintDialogue,
    feedback,
    chatInput,
    chatLoading,
    tutorLoading,
    reinforcementLoading,
    progressLabel,
    progressPercent,
    nextButtonLabel,
    isLastMainQuestion,
    mainQuestions,
    total,
    correctCount,
    answers,
    results,
    activeTaskId,
    activeTask,
    taskProgress,
    sessionSummary,
    sessionStarBreakdown,
    streakDays,
    skillBreakdown,
    handleAnswerChange,
    handleSubmitAnswer,
    handleSendChat,
    setChatInput,
    advanceAfterCorrect,
    advanceAfterReveal,
    startReinforcement,
    handleRestart,
    pathWeek,
    pathWeekConfig,
    pathWeekPassed,
    pathProgress,
    parentReport,
  };
}
