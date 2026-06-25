import {
  buildProfileDifficultySection,
  buildGrade2StructureSection,
  buildTransitionStructureSection,
} from "@/lib/profile/difficultyHints";
import {
  buildGenerationPlan,
  formatSkillList,
  type GenerationPlan,
} from "@/lib/profile/generationPlan";
import { formatProfileSkillSummary } from "@/lib/profile/studentProfile";
import {
  GRADE2_CATEGORY_JSON,
  GRADE2_FIXED_ADVANCED_COUNT,
  GRADE2_FIXED_BASIC_COUNT,
} from "@/lib/curriculum/grade2";
import {
  LOGIC_QUESTION_BAD_EXAMPLE,
  LOGIC_QUESTION_GOOD_EXAMPLE,
  LOGIC_QUESTION_RULES,
} from "@/lib/ai/logicQuestionRules";
import type { PracticeLevel } from "@/lib/types/practice";
import type { StudentProfile } from "@/lib/types/profile";

const QUESTION_ITEM_SCHEMA = `{
      "category": ${GRADE2_CATEGORY_JSON},
      "prompt": "题干（清晰、适合二年级）",
      "answer": "数值题填整数；选择题填 options 中正确项的下标（从 0 开始）",
      "options": "logic_reasoning、shape_pattern 必填，2-4 个选项字符串数组",
      "unit": "可选，如 元、个、分钟（不要用人名充当 unit）",
      "hint": "可选，拓展题建议提供"
    }`;

const CHOICE_QUESTION_RULES = `
【选择题格式 — logic_reasoning、shape_pattern 必须遵守】
1. 必须提供 options 数组（2-4 个选项，每项为简短文字，如人名或图形名）
2. answer 为正确选项在 options 中的下标（从 0 开始）
3. 题干只写题目，不要写 (1=甲 2=乙) 这类编号
4. 不要用 unit 字段表示人名、图形名
${LOGIC_QUESTION_RULES}

【逻辑题示例】
${LOGIC_QUESTION_GOOD_EXAMPLE}

${LOGIC_QUESTION_BAD_EXAMPLE}`;

function buildTransitionPrompt(plan: GenerationPlan, profile?: StudentProfile): string {
  return `你是一位小学数学老师，学生即将从一年级升入二年级。
${buildProfileDifficultySection(profile, plan, "transition")}
${buildTransitionStructureSection(plan)}

每道题必须包含 level 字段（transition 或 grade2）。答案必须是整数。拓展题可含 hint。
只输出 JSON 对象，不要 markdown，不要额外解释。

JSON 格式：
{
  "questions": [
    {
      "type": "basic" | "extension",
      "level": "transition" | "grade2",
      "category": ${GRADE2_CATEGORY_JSON},
      "prompt": "题干",
      "answer": 整数答案,
      "unit": "可选单位",
      "hint": "拓展题可选提示"
    }
  ]
}`;
}

function buildGrade2Prompt(_plan: GenerationPlan, profile?: StudentProfile): string {
  const plan = _plan;

  return `你是一位资深小学二年级数学老师，负责生成「严格二年级标准」的每日练习。

${buildProfileDifficultySection(profile, plan, 2)}
${buildGrade2StructureSection(plan)}

【出题总量 — 固定不可变】
- basic 数组：恰好 ${GRADE2_FIXED_BASIC_COUNT} 道题（严格二年级基础）
- advanced 数组：恰好 ${GRADE2_FIXED_ADVANCED_COUNT} 道题（浅奥拓展，有思维性但不得超纲）

【基础题 basic — 必须遵守】
1. 恰好 5 道，按 basic 槽位顺序与 category 一一对应，不得调换
2. 必须覆盖：加法、减法、乘法、除法（前 4 道固定）
3. 第 5 道为两步应用题（two_step_word）或时间/钱币（time_money），按槽位指定
4. 加减法：100 以内，含进位/退位；乘法因数限 2/5/10；除法整除，含平均分或包含除法
5. 题干简短，一步或两步可算完，数字符合二年级

【拓展题 advanced — 必须遵守】
1. 恰好 2 道，按 advanced 槽位 category 出题
2. 必须具备思维性：找规律、推理、图形规律、多步思考或巧算
3. 严禁超出小学二年级认知：不用分数/小数/方程/超纲符号，数字 ≤100
4. 答案必须是整数；建议写 hint 引导思考，不要直接给解题步骤
${CHOICE_QUESTION_RULES}

【输出格式 — 必须严格遵守】
只输出一个 JSON 对象，不要 markdown 代码块，不要任何解释文字。

{
  "basic": [
    ${QUESTION_ITEM_SCHEMA},
    ...共 ${GRADE2_FIXED_BASIC_COUNT} 项
  ],
  "advanced": [
    ${QUESTION_ITEM_SCHEMA},
    ...共 ${GRADE2_FIXED_ADVANCED_COUNT} 项
  ]
}`;
}

export function buildSystemPrompt(
  level: PracticeLevel,
  profile?: StudentProfile,
  plan?: GenerationPlan,
): string {
  const generationPlan = plan ?? buildGenerationPlan(profile, level);

  if (level === "transition") {
    return buildTransitionPrompt(generationPlan, profile);
  }

  if (level === 2) {
    return buildGrade2Prompt(generationPlan, profile);
  }

  return `你是一位小学${level}年级数学老师。
${buildProfileDifficultySection(profile, generationPlan, level)}

请生成 ${generationPlan.total} 道题：${generationPlan.basicCount} 道基础题 + ${generationPlan.wordProblemCount} 道拓展题。
${generationPlan.basicCount} 道基础题 category 只能是 addition 或 subtraction。
${generationPlan.wordProblemCount} 道拓展题 category 必须是 two_step_word。
答案必须是整数。只输出 JSON，不要 markdown。

{
  "basic": [ { "category": "addition"|"subtraction", "prompt": "...", "answer": 0 } ],
  "advanced": [ { "category": "two_step_word", "prompt": "...", "answer": 0 } ]
}`;
}

export function buildUserPrompt(
  date: string,
  level: PracticeLevel,
  profile?: StudentProfile,
  plan?: GenerationPlan,
): string {
  const generationPlan = plan ?? buildGenerationPlan(profile, level, date);

  const historySummary = generationPlan.hasHistory
    ? `历史总正确率 ${generationPlan.overallAccuracy}%，难度档位「${generationPlan.difficultyLabel}」。`
    : "暂无历史记录，按适中难度出题。";

  const skillSummary = profile ? formatProfileSkillSummary(profile) : "";

  const weakStrong =
    generationPlan.weakSkills.length > 0 || generationPlan.strongSkills.length > 0
      ? `薄弱：${formatSkillList(generationPlan.weakSkills)}；强项：${formatSkillList(generationPlan.strongSkills)}。`
      : "";

  if (level === 2) {
    const balanceNote = generationPlan.balance
      ? `基础题正确率 ${generationPlan.balance.basicHasHistory ? `${generationPlan.balance.basicAccuracy}%` : "暂无"}，拓展题思维难度：${generationPlan.balance.advancedTierLabel}。`
      : "";

    if (generationPlan.pathWeekConfig) {
      const wc = generationPlan.pathWeekConfig;
      return `请为 ${date} 生成第 ${wc.weekNumber} 周学习练习。
主题：${wc.title}
本周目标：${wc.goal}
${historySummary}
${skillSummary}
${weakStrong}
${balanceNote}

请严格按 system 提示中的 basic / advanced 槽位顺序输出 JSON。
basic 共 ${GRADE2_FIXED_BASIC_COUNT} 题，advanced 共 ${GRADE2_FIXED_ADVANCED_COUNT} 题，合计 7 题。
必须同时包含：计算题、应用题、思维题。`;
    }

    return `请为 ${date} 生成今日二年级练习。
${historySummary}
${skillSummary}
${weakStrong}
${balanceNote}

请严格按 system 提示中的 basic / advanced 槽位顺序输出 JSON。
basic 共 ${GRADE2_FIXED_BASIC_COUNT} 题，advanced 共 ${GRADE2_FIXED_ADVANCED_COUNT} 题，合计 7 题。
必须同时包含：计算题、应用题、思维题。`;
  }

  const common = `\n${historySummary}\n${skillSummary}\n${weakStrong}\n本次：${generationPlan.basicCount} 道基础题 + ${generationPlan.wordProblemCount} 道拓展题。`;

  if (level === "transition") {
    return `请为 ${date} 生成一套基于该学生历史表现的练习。${common}
结构：${generationPlan.transitionBasic} 过渡基础 + ${generationPlan.grade2Basic} 二年级基础 + ${generationPlan.transitionWordProblem} 过渡应用 + ${generationPlan.grade2WordProblem} 二年级应用。`;
  }

  return `请为 ${date} 生成一套适合小学${level}年级、基于该学生历史表现的今日练习。${common}`;
}

export { buildGenerationPlan };
