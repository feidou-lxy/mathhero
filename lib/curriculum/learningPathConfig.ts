import type { QuestionCategory } from "@/types/math";
import { GRADE2_TOPIC_LABELS } from "@/lib/curriculum/grade2";
import type { TopicSlot } from "@/lib/curriculum/grade2";

export const LEARNING_PATH_TOTAL_WEEKS = 12;

export type LearningPathWeekConfig = {
  weekNumber: number;
  title: string;
  /** 本周学习目标 */
  goal: string;
  /** 重点知识点 */
  focusCategories: QuestionCategory[];
  /** 5 道基础题槽位 */
  basicTraining: QuestionCategory[];
  /** 2 道思维训练槽位 */
  thinkingTraining: QuestionCategory[];
};

/**
 * 二年级数学 · 12 周学习路径配置
 * 修改此文件即可调整整体教学路线，无需改动业务逻辑。
 */
export const LEARNING_PATH_WEEKS: LearningPathWeekConfig[] = [
  {
    weekNumber: 1,
    title: "进位加法",
    goal: "掌握 100 以内进位加法，能正确计算并解决简单实际问题",
    focusCategories: ["addition", "subtraction"],
    basicTraining: [
      "addition",
      "addition",
      "subtraction",
      "multiplication",
      "two_step_word",
    ],
    thinkingTraining: ["pattern_sequence", "shape_pattern"],
  },
  {
    weekNumber: 2,
    title: "退位减法",
    goal: "掌握 100 以内退位减法，理解「借一当十」",
    focusCategories: ["subtraction", "addition"],
    basicTraining: [
      "subtraction",
      "subtraction",
      "addition",
      "multiplication",
      "two_step_word",
    ],
    thinkingTraining: ["pattern_sequence", "logic_reasoning"],
  },
  {
    weekNumber: 3,
    title: "乘法（2 和 5）",
    goal: "熟练 2 和 5 的乘法口诀，理解「几个几」",
    focusCategories: ["multiplication"],
    basicTraining: [
      "multiplication",
      "multiplication",
      "addition",
      "subtraction",
      "two_step_word",
    ],
    thinkingTraining: ["clever_calc", "pattern_sequence"],
  },
  {
    weekNumber: 4,
    title: "除法入门",
    goal: "理解平均分和包含除法，掌握 2、5 的表内除法",
    focusCategories: ["division", "multiplication"],
    basicTraining: [
      "division",
      "division",
      "multiplication",
      "subtraction",
      "two_step_word",
    ],
    thinkingTraining: ["logic_reasoning", "shape_pattern"],
  },
  {
    weekNumber: 5,
    title: "两步应用题",
    goal: "会读题、拆步骤，用两步运算解决生活问题",
    focusCategories: ["two_step_word", "addition", "subtraction"],
    basicTraining: [
      "two_step_word",
      "two_step_word",
      "addition",
      "subtraction",
      "division",
    ],
    thinkingTraining: ["multi_step_word", "pattern_sequence"],
  },
  {
    weekNumber: 6,
    title: "时间与钱币",
    goal: "认识时间，会进行元角换算和简单购物计算",
    focusCategories: ["time_money", "two_step_word"],
    basicTraining: [
      "time_money",
      "time_money",
      "addition",
      "subtraction",
      "two_step_word",
    ],
    thinkingTraining: ["clever_calc", "logic_reasoning"],
  },
  {
    weekNumber: 7,
    title: "乘法（10）与乘除关系",
    goal: "熟练 10 的乘法，理解乘法和除法的关系",
    focusCategories: ["multiplication", "division"],
    basicTraining: [
      "multiplication",
      "division",
      "multiplication",
      "addition",
      "two_step_word",
    ],
    thinkingTraining: ["shape_pattern", "multi_step_word"],
  },
  {
    weekNumber: 8,
    title: "四则综合",
    goal: "加减乘除综合运算，灵活选择方法",
    focusCategories: [
      "addition",
      "subtraction",
      "multiplication",
      "division",
    ],
    basicTraining: [
      "addition",
      "subtraction",
      "multiplication",
      "division",
      "time_money",
    ],
    thinkingTraining: ["clever_calc", "pattern_sequence"],
  },
  {
    weekNumber: 9,
    title: "找规律",
    goal: "发现数列与图形排列规律，培养观察力",
    focusCategories: ["pattern_sequence", "shape_pattern"],
    basicTraining: [
      "addition",
      "subtraction",
      "multiplication",
      "division",
      "two_step_word",
    ],
    thinkingTraining: ["pattern_sequence", "shape_pattern"],
  },
  {
    weekNumber: 10,
    title: "逻辑推理",
    goal: "根据条件排序、排除，进行简单推理",
    focusCategories: ["logic_reasoning", "two_step_word"],
    basicTraining: [
      "two_step_word",
      "division",
      "addition",
      "subtraction",
      "time_money",
    ],
    thinkingTraining: ["logic_reasoning", "multi_step_word"],
  },
  {
    weekNumber: 11,
    title: "巧算与多步思考",
    goal: "运用凑整、拆分等方法巧算，解决多步问题",
    focusCategories: ["clever_calc", "multi_step_word"],
    basicTraining: [
      "addition",
      "subtraction",
      "multiplication",
      "division",
      "two_step_word",
    ],
    thinkingTraining: ["clever_calc", "multi_step_word"],
  },
  {
    weekNumber: 12,
    title: "综合闯关",
    goal: "全面复习二年级核心知识，自信完成闯关",
    focusCategories: [
      "addition",
      "subtraction",
      "multiplication",
      "division",
      "two_step_word",
      "time_money",
    ],
    basicTraining: [
      "addition",
      "subtraction",
      "multiplication",
      "division",
      "two_step_word",
    ],
    thinkingTraining: ["pattern_sequence", "multi_step_word"],
  },
];

export function getWeekConfig(weekNumber: number): LearningPathWeekConfig | null {
  return LEARNING_PATH_WEEKS.find((w) => w.weekNumber === weekNumber) ?? null;
}

export function allocatePathWeekTopicSlots(
  weekNumber: number,
): TopicSlot[] | null {
  const config = getWeekConfig(weekNumber);
  if (!config) return null;

  if (
    config.basicTraining.length !== 5 ||
    config.thinkingTraining.length !== 2
  ) {
    return null;
  }

  return [
    ...config.basicTraining.map((category) => ({
      type: "basic" as const,
      category,
    })),
    ...config.thinkingTraining.map((category) => ({
      type: "extension" as const,
      category,
    })),
  ];
}

export function formatFocusLabels(categories: QuestionCategory[]): string {
  return categories.map((c) => GRADE2_TOPIC_LABELS[c]).join("、");
}

export function formatWeekTrainingSummary(config: LearningPathWeekConfig): {
  basicLabels: string;
  thinkingLabels: string;
  focusLabels: string;
} {
  return {
    focusLabels: formatFocusLabels(config.focusCategories),
    basicLabels: formatFocusLabels(config.basicTraining),
    thinkingLabels: formatFocusLabels(config.thinkingTraining),
  };
}

/** 学习路径模式：按当周配置校验基础题，不强制四则运算齐全 */
export function validatePathWeekBasicCoverage(
  categories: QuestionCategory[],
  config: LearningPathWeekConfig,
): string | null {
  if (categories.length !== config.basicTraining.length) {
    return `Week ${config.weekNumber} expects ${config.basicTraining.length} basic questions, got ${categories.length}`;
  }

  for (const focus of config.focusCategories) {
    if (!categories.includes(focus)) {
      return `Week ${config.weekNumber} basic questions must include focus topic: ${GRADE2_TOPIC_LABELS[focus]} (${focus})`;
    }
  }

  return null;
}
