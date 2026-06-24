import { GRADE2_CATEGORY_JSON } from "@/lib/curriculum/grade2";
import type { QuestionCategory } from "@/lib/types/practice";
import { SKILL_LABELS } from "@/lib/types/profile";
import type { MistakeEntry } from "@/lib/types/mistakes";
import { MISTAKE_DRILL_QUESTION_COUNT } from "@/lib/types/mistakes";

export function buildMistakesPracticeSystemPrompt(): string {
  return `你是一位小学二年级数学老师。请根据学生的错题情况，生成一套错题专项巩固练习。
题目须符合二年级完整体系，100以内加减（进位/退位）、2/5/10乘除、两步应用题等，数字适中，情境清晰。
只输出 JSON 对象，不要 markdown，不要额外解释。

JSON 格式：
{
  "questions": [
    {
      "type": "basic" | "extension",
      "category": ${GRADE2_CATEGORY_JSON},
      "prompt": "题干",
      "answer": 整数答案,
      "unit": "可选单位",
      "hint": "拓展题可选提示"
    }
  ]
}`;
}

export function buildMistakesPracticeUserPrompt(
  categories: QuestionCategory[],
  mistakes: MistakeEntry[],
  count: number,
): string {
  const categoryText = categories
    .map((c) => SKILL_LABELS[c])
    .join("、");

  const samples = mistakes
    .slice(0, 5)
    .map(
      (m, i) =>
        `${i + 1}. [${SKILL_LABELS[m.category]}] ${m.prompt}（学生曾答：${m.userAnswer || "未作答"}，正确：${m.correctAnswer}${m.unit ? ` ${m.unit}` : ""}，错 ${m.wrongCount} 次）`,
    )
    .join("\n");

  return `请生成 ${count} 道错题专项巩固题。

重点知识点：${categoryText}

学生近期错题参考（请出同类但不同数字/情境的题，不要原题照搬）：
${samples || "暂无详细错题，请按知识点出基础巩固题"}

要求：
- 共 ${count} 题，至少覆盖 ${Math.min(categories.length, count)} 种薄弱知识点
- 以 basic 计算题为主，最多 1 道 extension 应用题
- 比原错题略简单或同级，帮助建立信心
- 每题 category 必须属于：${categories.join("、")}`;
}

export { MISTAKE_DRILL_QUESTION_COUNT };
