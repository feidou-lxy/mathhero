import { TEACHER_NAME } from "@/lib/ai/teacherCharacter";
import { THINKING_CATEGORIES } from "@/lib/curriculum/difficultyBalance";
import { SKILL_LABELS } from "@/types/math";
import type { Question, QuestionCategory } from "@/types/math";

const WORD_PROBLEM_CATEGORIES: QuestionCategory[] = [
  "two_step_word",
  "time_money",
  "multi_step_word",
];

/** 浅奥拓展题 */
export function isExtensionQuestion(question: Question): boolean {
  return question.type === "extension";
}

export function isWordProblemCategory(category: QuestionCategory): boolean {
  return WORD_PROBLEM_CATEGORIES.includes(category);
}

export function isDivisionCategory(category: QuestionCategory): boolean {
  return category === "division";
}

export function getCategoryLabel(category: QuestionCategory): string {
  return SKILL_LABELS[category] ?? category;
}

/** 写入 system / user prompt 的题型讲解规则 */
export function buildCategoryTeachingRules(question: Question): string {
  const lines: string[] = [
    `本题类型：${getCategoryLabel(question.category)}（${question.type === "extension" ? "浅奥拓展" : "基础题"}）`,
  ];

  if (isExtensionQuestion(question)) {
    lines.push(
      "【拓展题特别规则】只给思考提示，绝对不直接说出最终答案数字，也不要在讲解末尾报出结果。用提问引导，如「你发现了什么规律？」「下一步该想什么？」",
    );
  }

  if (isDivisionCategory(question.category)) {
    lines.push(
      "【除法讲解规则】必须用「分东西」的生活例子（分苹果、分糖果、分铅笔、分贴纸等），说清「一共几个、分给几人、每人几个」，禁止抽象讲「被除数÷除数」。",
    );
  }

  if (isWordProblemCategory(question.category)) {
    lines.push(
      "【应用题讲解规则】必须拆步骤讲，用「第一步…第二步…（如有第三步…）」，每步一句话，先讲想做什么运算，再讲用哪些数。",
    );
  }

  if (THINKING_CATEGORIES.includes(question.category)) {
    lines.push(
      "【思维题讲解规则】不直接给答案，只引导观察规律或推理方向，多鼓励「再试试看」「你已经发现一部分啦」。",
    );
  }

  return lines.join("\n");
}

export { TUTOR_VOICE_GUIDE } from "@/lib/ai/teacherCharacter";

export function buildExtensionHintOnlyRule(): string {
  return `拓展题（浅奥）在任何情况下都只给提示，不直接说出最终答案数字。即使学生多次答错，也只加强引导，末尾用问句邀请继续思考。`;
}

export function buildCorrectExplanationGuide(question: Question): string {
  if (isExtensionQuestion(question)) {
    return `学生答对了！请：
1. message：一句简短表扬，多鼓励
2. explanation：只回顾「是怎么想的」、用了什么方法，不要重新报一遍答案数字，不要逐步算出最终结果
3. 用 2-3 句短话，像聊天一样`;
  }

  if (isDivisionCategory(question.category)) {
    return `学生答对了！请：
1. message：一句简短表扬
2. explanation：用「分东西」生活例子讲（如分苹果给几个小朋友），分 2-3 步，每步很短
3. 禁止抽象术语，不要只说「用除法算」`;
  }

  if (isWordProblemCategory(question.category)) {
    return `学生答对了！请：
1. message：一句简短表扬
2. explanation：必须拆步骤讲——「第一步…第二步…」每步说明想算什么、用哪些数
3. 3-5 短句，适合二年级，多鼓励`;
  }

  return `学生答对了！请：
1. message：一句简短表扬
2. explanation：用生活例子（苹果、糖果、铅笔等）讲清楚怎么想，2-3 小步，每步很短
3. 适合二年级，多鼓励，不用复杂术语`;
}

export function buildWrongHintGuide(
  question: Question,
  attemptNumber: number,
  maxRounds: number,
): string {
  if (isExtensionQuestion(question)) {
    if (attemptNumber > maxRounds) {
      return `学生拓展题已尝试 ${attemptNumber} 次。仍只给提示、不说答案数字。给一条最接近的引导，用问句结尾，鼓励继续试。`;
    }
    return `学生答错了（拓展题）。只给 1 个小提示，引导观察规律或推理，绝对不说最终答案数字。1-2 句 + 一个短问句。`;
  }

  if (attemptNumber > maxRounds) {
    return `学生已尝试 ${attemptNumber} 次。温柔揭晓正确答案，并用生活化语言分步讲解（适合二年级）。`;
  }

  return `学生答错了。只给 1 个小提示，1-2 句话，不要透露正确答案数字。末尾用一个短问句邀请学生跟${TEACHER_NAME}聊聊。`;
}
