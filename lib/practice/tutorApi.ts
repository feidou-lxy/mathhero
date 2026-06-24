import { TEACHER_UNAVAILABLE_MESSAGE } from "@/lib/ai/teacherCharacter";
import type {
  MistakeEntry,
  PracticeLevel,
  PracticeSet,
  ProfileSkill,
  Question,
  QuestionCategory,
  ReinforcementSet,
  StudentProfile,
  TutorChatRequest,
  TutorFeedbackRequest,
  TutorFeedbackResponse,
} from "@/types/math";

async function parseApiError(
  response: Response,
  fallback: string,
): Promise<string> {
  const data = (await response.json().catch(() => null)) as {
    error?: string;
  } | null;
  return data?.error ?? fallback;
}

export async function fetchGenerateQuestions(input: {
  level: PracticeLevel;
  force?: boolean;
  profile: StudentProfile;
  pathWeek?: number;
  focusSkill?: ProfileSkill;
}): Promise<PracticeSet> {
  const response = await fetch("/api/generate-questions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response, "题目加载失败"));
  }

  return (await response.json()) as PracticeSet;
}

export async function fetchMistakesPractice(input: {
  categories: QuestionCategory[];
  mistakes: MistakeEntry[];
}): Promise<PracticeSet> {
  const response = await fetch("/api/generate-mistakes-practice", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response, "错题专项生成失败"));
  }

  return (await response.json()) as PracticeSet;
}

export async function fetchReinforcementQuestions(
  question: Question,
): Promise<ReinforcementSet> {
  const response = await fetch("/api/generate-reinforcement", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response, "巩固题生成失败"));
  }

  return (await response.json()) as ReinforcementSet;
}

export async function fetchTutorFeedback(
  input: TutorFeedbackRequest,
): Promise<TutorFeedbackResponse> {
  const response = await fetch("/api/tutor-feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response, TEACHER_UNAVAILABLE_MESSAGE));
  }

  return (await response.json()) as TutorFeedbackResponse;
}

export async function fetchTutorChat(
  input: TutorChatRequest,
): Promise<{ message: string }> {
  const response = await fetch("/api/tutor-chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response, TEACHER_UNAVAILABLE_MESSAGE));
  }

  return (await response.json()) as { message: string };
}

export async function syncStudentProfile(profile: StudentProfile): Promise<void> {
  await fetch("/api/student-profile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ profile }),
  }).catch(() => {});
}
