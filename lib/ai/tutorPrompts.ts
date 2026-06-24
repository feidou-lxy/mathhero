import { MAX_HINT_ROUNDS } from "@/lib/types/tutor";
import type { TutorFeedbackRequest } from "@/lib/types/tutor";
import type { Question } from "@/types/math";
import {
  buildCategoryTeachingRules,
  buildCorrectExplanationGuide,
  buildExtensionHintOnlyRule,
  buildWrongHintGuide,
  isExtensionQuestion,
  TUTOR_VOICE_GUIDE,
} from "@/lib/ai/tutorTeachingStyle";
import { TEACHER_NAME } from "@/lib/ai/teacherCharacter";

export function buildTutorSystemPrompt(question?: Question): string {
  const extensionRule = question && isExtensionQuestion(question)
    ? `\n8. ${buildExtensionHintOnlyRule()}`
    : "";

  return `${TUTOR_VOICE_GUIDE}

【辅导规则】
0. 所有 message、explanation 都是「${TEACHER_NAME}」在跟孩子说话，保持第一人称口吻
1. 答错时：每次只给一个小提示，1-2 句话；前 ${MAX_HINT_ROUNDS} 次不要说出最终数字答案
2. 第 ${MAX_HINT_ROUNDS + 1} 次仍答错：
   - 基础题：温柔揭晓正确答案，用生活例子分步讲解
   - 拓展题（浅奥）：仍只给提示，不直接说答案数字
3. 答对时：
   - message：一句简短表扬（多鼓励）
   - explanation：按题型规则讲解（见下方）
4. 除法题：讲解必须用「分东西」例子（分苹果、糖果、铅笔等）
5. 应用题：讲解必须拆步骤（第一步…第二步…）
6. 输出 JSON：
   - 答错：{"message": "提示内容", "inviteDialogue": true}
   - 答对：{"message": "表扬", "explanation": "讲解内容"}${extensionRule}`;
}

export function buildTutorUserPrompt(
  req: TutorFeedbackRequest,
  isCorrect: boolean,
): string {
  const { question, userAnswer, attemptNumber, previousHints, dialogueHistory } = req;
  const unitSuffix = question.unit ? question.unit : "";
  const categoryRules = buildCategoryTeachingRules(question);

  const context = [
    categoryRules,
    `题目：${question.prompt}`,
    `正确答案（仅供你参考，不要轻易透露）：${question.answer}${unitSuffix}`,
    `学生答案：${userAnswer}`,
    `第 ${attemptNumber} 次作答`,
    previousHints?.length
      ? `已给过的提示（不要重复）：\n${previousHints.map((h, i) => `${i + 1}. ${h}`).join("\n")}`
      : null,
    dialogueHistory?.length
      ? `本轮已有对话：\n${dialogueHistory.map((m) => `${m.role === "teacher" ? TEACHER_NAME : "学生"}：${m.content}`).join("\n")}`
      : null,
  ]
    .filter(Boolean)
    .join("\n");

  if (isCorrect) {
    return `${context}

${buildCorrectExplanationGuide(question)}`;
  }

  return `${context}

${buildWrongHintGuide(question, attemptNumber, MAX_HINT_ROUNDS)}
记住：不要透露正确答案 ${question.answer}。`;
}
