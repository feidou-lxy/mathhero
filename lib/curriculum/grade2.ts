import type { QuestionCategory, QuestionType, StudentProfile, RawAIQuestion, RawAIQuestionBatchResponse } from "@/types/math";
import { PROFILE_SKILLS, SKILL_LABELS, type ProfileSkill } from "@/types/math";
import {
  computeDifficultyBalance,
  isSkillWeak,
  THINKING_CATEGORIES,
  type AdvancedDifficultyTier,
  type DifficultyBalance,
} from "@/lib/curriculum/difficultyBalance";

/** 二年级基础题知识点（type: basic） */
export const GRADE2_BASIC_TOPICS: QuestionCategory[] = [
  "addition",
  "subtraction",
  "multiplication",
  "division",
  "two_step_word",
  "time_money",
];

/** 二年级拓展题知识点（type: extension，浅奥） */
export const GRADE2_EXTENSION_TOPICS: QuestionCategory[] = [
  "pattern_sequence",
  "logic_reasoning",
  "shape_pattern",
  "multi_step_word",
  "clever_calc",
];

export const GRADE2_ALL_TOPICS: QuestionCategory[] = [
  ...GRADE2_BASIC_TOPICS,
  ...GRADE2_EXTENSION_TOPICS,
];

export const GRADE2_FIXED_BASIC_COUNT = 5;
export const GRADE2_FIXED_ADVANCED_COUNT = 2;

/** 5 道基础题固定槽位：加减乘除 + 应用/时间钱币（第5道轮换） */
export const GRADE2_BASIC_SLOT_ORDER: QuestionCategory[] = [
  "addition",
  "subtraction",
  "multiplication",
  "division",
];

export const GRADE2_BASIC_FIFTH_OPTIONS: QuestionCategory[] = [
  "two_step_word",
  "time_money",
];

/** 各知识点的出题规范（写入 AI 提示词） */
export const GRADE2_TOPIC_SPECS: Record<QuestionCategory, string> = {
  addition:
    "100以内加法，必须含进位（个位相加满10向十位进1）。两数均在100以内，和≤100。",
  subtraction:
    "100以内减法，必须含退位（个位不够减向十位借1）。被减数≤100，差为非负整数。",
  multiplication:
    "表内乘法，因数仅限 2、5、10（如 2×7、5×6、10×3）。一步乘法，积≤100。",
  division:
    "表内除法，除数仅限 2、5、10。须覆盖「平均分」或「包含除法」情境（如：12÷3=？或 12里面有（ ）个3）。被除数≤100，整除无余数。",
  two_step_word:
    "两步应用题（基础题）。生活情境，需经过两次运算（先…再…）。数字≤50，每步用加减乘除之一，最终答案为整数。",
  time_money:
    "时间或钱币问题（基础题）。时间：整点/半点/几时几分、时长计算；钱币：元角换算、找零、购物合计。数字贴近生活，答案为整数（元或分钟）。",
  pattern_sequence:
    "找规律（数列）。给出 3-5 项数字或图形对应数，找下一项。规律可为等差、倍数、交替等，二年级可理解。",
  logic_reasoning:
    "简单逻辑推理。必须提供 options 选择题；条件须能严格推出唯一答案（排序题需能确定完整顺序或唯一最值，禁止模棱两可）。",
  shape_pattern:
    "图形规律。描述图形排列规律（如 ○△○△… 第10个是什么）。必须提供 options 选项数组（如 [\"○\", \"△\"]），answer 为正确选项下标（从 0 开始）。",
  multi_step_word:
    "多步骤应用题（2-3步，浅奥拓展）。情境略丰富，需 2-3 步推理或运算，数字≤100，答案为整数。",
  clever_calc:
    "巧算（拆分/凑整）。如 25+37+75、99+6、48+52 等，引导凑整或拆分，数字≤100，答案为整数。",
};

export const GRADE2_TOPIC_LABELS: Record<QuestionCategory, string> = {
  addition: "100以内加法（进位）",
  subtraction: "100以内减法（退位）",
  multiplication: "乘法（2/5/10）",
  division: "除法（平均分/包含除法）",
  two_step_word: "两步应用题",
  time_money: "时间与钱币",
  pattern_sequence: "找规律（数列）",
  logic_reasoning: "简单逻辑推理",
  shape_pattern: "图形规律",
  multi_step_word: "多步骤应用题",
  clever_calc: "巧算（拆分/凑整）",
};

export function isBasicCategory(category: QuestionCategory): boolean {
  return GRADE2_BASIC_TOPICS.includes(category);
}

export function isExtensionCategory(category: QuestionCategory): boolean {
  return GRADE2_EXTENSION_TOPICS.includes(category);
}

function dateSeed(date: string): number {
  return Number.parseInt(date.replace(/-/g, ""), 10) || 0;
}

export type TopicSlot = {
  type: QuestionType;
  category: QuestionCategory;
};

export function getGrade2FifthBasicCategory(
  profile: StudentProfile,
  date: string,
  balance: DifficultyBalance,
): QuestionCategory {
  const divisionWeak = isSkillWeak(profile, "division");
  const wordWeak = isSkillWeak(profile, "two_step_word");

  if (divisionWeak || wordWeak || balance.focusSkills.includes("two_step_word")) {
    return "two_step_word";
  }

  if (isSkillWeak(profile, "time_money")) {
    return "time_money";
  }

  return dateSeed(date) % 2 === 0 ? "two_step_word" : "time_money";
}

/** 固定 5 道基础题：加减乘除 + 应用/时间钱币（重点练除法与应用） */
export function allocateGrade2BasicSlots(
  profile: StudentProfile,
  date: string,
  balance: DifficultyBalance,
): QuestionCategory[] {
  return [
    ...GRADE2_BASIC_SLOT_ORDER,
    getGrade2FifthBasicCategory(profile, date, balance),
  ];
}

const THINKING_BY_TIER: Record<AdvancedDifficultyTier, QuestionCategory[]> = {
  easy: ["pattern_sequence", "shape_pattern"],
  medium: ["pattern_sequence", "logic_reasoning", "clever_calc"],
  hard: ["logic_reasoning", "clever_calc", "shape_pattern"],
};

function pickThinkingCategory(
  pool: QuestionCategory[],
  profile: StudentProfile,
  date: string,
  exclude?: QuestionCategory,
): QuestionCategory {
  const candidates = pool.filter((c) => c !== exclude);
  const weakThinking = candidates.find(
    (c) =>
      isSkillWeak(profile, c as ProfileSkill) ||
      profile.skills[c as ProfileSkill].total === 0,
  );
  if (weakThinking) return weakThinking;

  return candidates[dateSeed(date) % candidates.length] ?? "pattern_sequence";
}

/** 2 道拓展题：必有思维题；难度随基础题正确率调节 */
export function allocateGrade2AdvancedSlots(
  profile: StudentProfile,
  date: string,
  balance: DifficultyBalance,
): QuestionCategory[] {
  const thinkingPool = THINKING_BY_TIER[balance.advancedTier];
  const thinking = pickThinkingCategory(thinkingPool, profile, date);

  let second: QuestionCategory;

  if (balance.advancedTier === "hard") {
    second = isSkillWeak(profile, "multi_step_word")
      ? pickThinkingCategory(
          ["clever_calc", "logic_reasoning"],
          profile,
          `${date}-2`,
          thinking,
        )
      : "multi_step_word";
  } else if (balance.advancedTier === "easy") {
    second = pickThinkingCategory(
      ["pattern_sequence", "shape_pattern"],
      profile,
      `${date}-2`,
      thinking,
    );
  } else {
    const mediumSecond: QuestionCategory[] = [
      "multi_step_word",
      "clever_calc",
      "pattern_sequence",
    ];
    second =
      mediumSecond[dateSeed(`${date}-adv`) % mediumSecond.length] ?? "clever_calc";
    if (second === thinking) {
      second = "multi_step_word";
    }
  }

  if (!THINKING_CATEGORIES.includes(second)) {
    return [thinking, second];
  }

  return [thinking, second];
}

/** 合并为完整 topicSlots（5 basic + 2 extension） */
export function allocateGrade2TopicSlots(
  profile: StudentProfile,
  _basicCount: number,
  _extensionCount: number,
  date: string,
  balance?: DifficultyBalance,
): TopicSlot[] {
  const resolvedBalance = balance ?? computeDifficultyBalance(profile);
  const basicCategories = allocateGrade2BasicSlots(
    profile,
    date,
    resolvedBalance,
  );
  const advancedCategories = allocateGrade2AdvancedSlots(
    profile,
    date,
    resolvedBalance,
  );

  return [
    ...basicCategories.map((category) => ({
      type: "basic" as const,
      category,
    })),
    ...advancedCategories.map((category) => ({
      type: "extension" as const,
      category,
    })),
  ];
}

export function flattenBatchResponse(
  batch: RawAIQuestionBatchResponse,
): RawAIQuestion[] {
  return [
    ...batch.basic.map((item) => ({ ...item, type: "basic" as const })),
    ...batch.advanced.map((item) => ({ ...item, type: "extension" as const })),
  ];
}

export function validateBasicCoverage(categories: QuestionCategory[]): string | null {
  const required = new Set<QuestionCategory>([
    "addition",
    "subtraction",
    "multiplication",
    "division",
  ]);

  for (const cat of categories) {
    required.delete(cat);
  }

  if (required.size > 0) {
    return `Basic questions must cover addition, subtraction, multiplication, division; missing: ${[...required].join(", ")}`;
  }

  const hasContext =
    categories.includes("two_step_word") || categories.includes("time_money");

  if (!hasContext) {
    return "Basic questions must include two_step_word or time_money";
  }

  return null;
}

export function formatTopicSlotList(slots: TopicSlot[]): string {
  return slots
    .map((slot, index) => {
      const label = GRADE2_TOPIC_LABELS[slot.category];
      const spec = GRADE2_TOPIC_SPECS[slot.category];
      return `${index + 1}. type: ${slot.type}，category: ${slot.category}（${label}）— ${spec}`;
    })
    .join("\n");
}

export function formatBasicTopicOverview(): string {
  return GRADE2_BASIC_TOPICS.map(
    (c, i) => `${i + 1}. ${GRADE2_TOPIC_LABELS[c]}（category: ${c}）`,
  ).join("\n");
}

export function formatExtensionTopicOverview(): string {
  return GRADE2_EXTENSION_TOPICS.map(
    (c, i) => `${i + 1}. ${GRADE2_TOPIC_LABELS[c]}（category: ${c}）`,
  ).join("\n");
}

/** 旧版知识点迁移到新体系 */
export const LEGACY_SKILL_MIGRATION: Record<string, ProfileSkill> = {
  mixed_calc: "clever_calc",
  word_problem: "two_step_word",
};

export function migrateLegacySkillStats(
  skills: Record<
    string,
    {
      correct: number;
      total: number;
      responseTimeMs?: number;
      responseTimeCount?: number;
    }
  >,
): Partial<
  Record<
    ProfileSkill,
    {
      correct: number;
      total: number;
      responseTimeMs?: number;
      responseTimeCount?: number;
    }
  >
> {
  const merged: Partial<
    Record<
      ProfileSkill,
      {
        correct: number;
        total: number;
        responseTimeMs?: number;
        responseTimeCount?: number;
      }
    >
  > = {};

  for (const [key, stats] of Object.entries(skills)) {
    const target =
      (LEGACY_SKILL_MIGRATION[key] as ProfileSkill | undefined) ??
      (PROFILE_SKILLS.includes(key as ProfileSkill)
        ? (key as ProfileSkill)
        : null);

    if (!target) continue;

    const existing = merged[target] ?? {
      correct: 0,
      total: 0,
      responseTimeMs: 0,
      responseTimeCount: 0,
    };
    merged[target] = {
      correct: existing.correct + stats.correct,
      total: existing.total + stats.total,
      responseTimeMs:
        (existing.responseTimeMs ?? 0) + (stats.responseTimeMs ?? 0),
      responseTimeCount:
        (existing.responseTimeCount ?? 0) + (stats.responseTimeCount ?? 0),
    };
  }

  return merged;
}

export const GRADE2_CATEGORY_JSON =
  '"addition" | "subtraction" | "multiplication" | "division" | "two_step_word" | "time_money" | "pattern_sequence" | "logic_reasoning" | "shape_pattern" | "multi_step_word" | "clever_calc"';
