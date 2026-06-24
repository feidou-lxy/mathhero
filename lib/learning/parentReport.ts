import type { LearningPathWeekConfig } from "@/lib/curriculum/learningPathConfig";
import { buildParentReportTeacherComment } from "@/lib/ai/teacherCharacter";
import type { PracticeSource } from "@/lib/practice/types";
import { getSessionSkillBreakdown } from "@/lib/learning/sessionSummary";
import type { ParentLearningReport } from "@/lib/types/parentReport";
import { TEACHER_NAME } from "@/lib/ai/teacherCharacter";
import type { Question, SessionResult, SessionSummary } from "@/types/math";

export function formatDurationLabel(seconds: number): string {
  const safe = Math.max(0, Math.round(seconds));
  if (safe < 60) return `${safe} 秒`;

  const minutes = Math.floor(safe / 60);
  const remainder = safe % 60;
  if (minutes < 60) {
    return remainder > 0 ? `${minutes} 分 ${remainder} 秒` : `${minutes} 分钟`;
  }

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours} 小时 ${mins} 分钟` : `${hours} 小时`;
}

function buildSessionTitle(
  practiceSource: PracticeSource,
  pathWeekConfig?: LearningPathWeekConfig | null,
): string {
  if (practiceSource === "mistake_single") return "错题重新练习";
  if (practiceSource === "mistakes_drill") return "错题专项训练";
  if (pathWeekConfig) {
    return `第 ${pathWeekConfig.weekNumber} 周 · ${pathWeekConfig.title}`;
  }
  return "数学练习";
}

export type BuildParentReportInput = {
  questions: Question[];
  results: Record<number, SessionResult>;
  sessionSummary: SessionSummary;
  durationSeconds: number;
  practiceSource: PracticeSource;
  pathWeekConfig?: LearningPathWeekConfig | null;
  date?: string;
};

export function buildParentReport(input: BuildParentReportInput): ParentLearningReport {
  const {
    questions,
    results,
    sessionSummary,
    durationSeconds,
    practiceSource,
    pathWeekConfig,
    date,
  } = input;

  const skillBreakdown = getSessionSkillBreakdown(questions, results);
  const masteredSkills = skillBreakdown
    .filter((item) => item.total > 0 && item.correct === item.total)
    .map((item) => item.label);
  const weakSkills = skillBreakdown
    .filter((item) => item.total > 0 && item.correct < item.total)
    .map((item) => item.label);

  const wrongCount = sessionSummary.totalCount - sessionSummary.correctCount;
  const accuracyPercent =
    sessionSummary.totalCount > 0
      ? Math.round((sessionSummary.correctCount / sessionSummary.totalCount) * 100)
      : 0;

  const now = new Date();
  const reportDate = date ?? now.toISOString().slice(0, 10);

  return {
    id: `${reportDate}-${now.getTime()}`,
    createdAt: now.toISOString(),
    date: reportDate,
    durationSeconds: Math.max(0, Math.round(durationSeconds)),
    durationLabel: formatDurationLabel(durationSeconds),
    accuracyPercent,
    correctCount: sessionSummary.correctCount,
    totalCount: sessionSummary.totalCount,
    wrongCount,
    masteredSkills,
    weakSkills,
    teacherName: TEACHER_NAME,
    teacherComment: buildParentReportTeacherComment(
      sessionSummary.correctCount,
      sessionSummary.totalCount,
      masteredSkills,
      weakSkills,
    ),
    practiceSource,
    sessionTitle: buildSessionTitle(practiceSource, pathWeekConfig),
    ...(pathWeekConfig
      ? {
          pathWeek: pathWeekConfig.weekNumber,
          pathWeekTitle: pathWeekConfig.title,
        }
      : {}),
  };
}
