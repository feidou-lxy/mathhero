import { recordAndSaveAnswer } from "@/lib/profile/clientStorage";
import { saveMistakeRecord } from "@/lib/mistakes/mistakeStorage";
import type {
  DialogueMessage,
  Question,
  QuestionAnswerResult,
  StudentProfile,
  TutorFeedbackRequest,
  TutorFeedbackResponse,
} from "@/types/math";
import { isAnswerCorrect } from "@/types/math";
import { fetchTutorFeedback, syncStudentProfile } from "@/lib/practice/tutorApi";
import type { QuestionMode } from "@/lib/practice/types";

export function buildReinforcementRetryFeedback(
  isCorrect: boolean,
): TutorFeedbackResponse {
  if (isCorrect) {
    return {
      isCorrect: true,
      message: "这次对了！巩固成功！🎉",
      explanation: "你看，换成更简单的题就能算出来啦，说明你已经掌握方法了！",
    };
  }

  return {
    isCorrect: false,
    message: "还差一点点，看看老师刚才说的答案，再试一次吧～",
  };
}

export type SubmitAnswerInput = {
  question: Question;
  userAnswer: string;
  attemptNumber: number;
  previousHints: string[];
  dialogueHistory: DialogueMessage[];
};

export async function submitAnswerForGrading(
  input: SubmitAnswerInput,
): Promise<TutorFeedbackResponse> {
  const request: TutorFeedbackRequest = {
    question: input.question,
    userAnswer: input.userAnswer,
    attemptNumber: input.attemptNumber,
    previousHints: input.previousHints,
    dialogueHistory: input.dialogueHistory,
  };

  return fetchTutorFeedback(request);
}

export function gradeReinforcementRetry(
  question: Question,
  userAnswer: string,
): TutorFeedbackResponse {
  const correct = isAnswerCorrect(question, userAnswer);
  return buildReinforcementRetryFeedback(correct);
}

export type PersistQuestionResultInput = {
  question: Question;
  userAnswer: string;
  isCorrect: boolean;
  questionMode: QuestionMode;
  feedbackMessage: string;
  feedbackExplanation?: string;
};

export type PersistQuestionResultOutput = {
  result: QuestionAnswerResult;
  profile: StudentProfile;
};

export function persistQuestionResult(
  input: PersistQuestionResultInput,
): PersistQuestionResultOutput {
  const result: QuestionAnswerResult = {
    correct: input.isCorrect,
    message: input.feedbackMessage,
    explanation: input.feedbackExplanation,
  };

  if (!input.isCorrect && input.questionMode === "main") {
    saveMistakeRecord({
      question: input.question,
      userAnswer: input.userAnswer,
    });
  }

  const profile = recordAndSaveAnswer({
    category: input.question.category,
    isCorrect: input.isCorrect,
  });

  void syncStudentProfile(profile);

  return { result, profile };
}
