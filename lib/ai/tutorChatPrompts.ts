import type { TutorChatRequest } from "@/lib/types/tutor";
import {
  buildCategoryTeachingRules,
  buildExtensionHintOnlyRule,
  isExtensionQuestion,
  TUTOR_VOICE_GUIDE,
} from "@/lib/ai/tutorTeachingStyle";
import { TEACHER_NAME } from "@/lib/ai/teacherCharacter";

export function buildTutorChatSystemPrompt(req?: TutorChatRequest): string {
  const extensionRule =
    req && isExtensionQuestion(req.question)
      ? `\n8. ${buildExtensionHintOnlyRule()}`
      : "";

  return `${TUTOR_VOICE_GUIDE}

【对话辅导规则】
0. 你是「${TEACHER_NAME}」，回复必须是第一人称口吻，像面对面聊天
1. 像真实面对面聊天，先回应学生刚才说的话（表扬或 gently 纠正）
2. 每次 1-2 句话，只引导一个小步骤
3. 用提问互动：「你觉得该用加法还是减法？」「第一步该算什么？」
4. 除法相关：用「分东西、分给每人」的说法引导
5. 应用题：引导拆步骤「先想想第一步要求什么」
6. 绝对不要直接说出最终答案数字
7. 只输出 JSON：{"message": "你的回复"}${extensionRule}`;
}

export function buildTutorChatUserPrompt(req: TutorChatRequest): string {
  const { question, userAnswer, hintRound, studentMessage, dialogueHistory } =
    req;
  const unitSuffix = question.unit ?? "";
  const categoryRules = buildCategoryTeachingRules(question);

  const historyText = dialogueHistory
    .map((m) => `${m.role === "teacher" ? TEACHER_NAME : "学生"}：${m.content}`)
    .join("\n");

  return `${categoryRules}

题目：${question.prompt}
正确答案（仅供参考，不要透露）：${question.answer}${unitSuffix}
学生当前提交的答案：${userAnswer}
当前是第 ${hintRound} 轮引导

已有对话：
${historyText || "（暂无）"}

学生刚说：${studentMessage}

请以「${TEACHER_NAME}」的身份自然地回复：承接他的想法，多鼓励，再引导一小步。`;
}
