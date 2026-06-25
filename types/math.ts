/**
 * MathHero 数学练习领域 — 统一类型定义
 *
 * 题目结构 · 答案结构 · 学习记录结构
 */

// =============================================================================
// 题目结构
// =============================================================================

/** 题目类型：基础计算 / 拓展应用 */
export type QuestionType = "basic" | "extension";

/** 过渡题 / 二年级题（transition 模式） */
export type QuestionLevel = "transition" | "grade2";

/** 练习年级档位 */
export type PracticeLevel = 1 | 2 | "transition";

/** 知识点（与画像 skills 一一对应） */
export type QuestionCategory =
  | "addition"
  | "subtraction"
  | "multiplication"
  | "division"
  | "two_step_word"
  | "time_money"
  | "pattern_sequence"
  | "logic_reasoning"
  | "shape_pattern"
  | "multi_step_word"
  | "clever_calc";

/** 标准题目（含运行时 id） */
export type Question = {
  id: number;
  type: QuestionType;
  category: QuestionCategory;
  /** 题干 */
  prompt: string;
  /** 正确答案：数值题填数字；选择题填 options 下标（从 0 开始） */
  answer: number;
  level?: QuestionLevel;
  unit?: string;
  hint?: string;
  /** 选择题选项（logic_reasoning、shape_pattern 等） */
  options?: string[];
};

/** AI 返回的原始题目（无 id） */
export type RawAIQuestion = {
  type: QuestionType;
  category: QuestionCategory;
  prompt: string;
  answer: number;
  level?: QuestionLevel;
  unit?: string;
  hint?: string;
  options?: string[];
};

/** AI 返回的分组题目项（basic / advanced 数组内，无 type） */
export type RawAIQuestionItem = {
  category: QuestionCategory;
  prompt: string;
  answer: number;
  level?: QuestionLevel;
  unit?: string;
  hint?: string;
  options?: string[];
};

/** DeepSeek 结构化输出：5 基础 + 2 拓展 */
export type RawAIQuestionBatchResponse = {
  basic: RawAIQuestionItem[];
  advanced: RawAIQuestionItem[];
};

export type RawAIQuestionResponse = {
  questions: RawAIQuestion[];
};

export type PracticeSetSource = "ai" | "mock";

/** 一套练习题 */
export type PracticeSet = {
  setId: string;
  date: string;
  level: PracticeLevel;
  source: PracticeSetSource;
  questions: Question[];
  generatedAt: string;
};

/** 错题巩固题组 */
export type ReinforcementSet = {
  sourceQuestionId: number;
  questions: Question[];
};

export const QUESTION_RULES = {
  total: 7,
  basic: 5,
  extension: 2,
} as const;

/** 二年级完整体系：6 类基础 + 5 类拓展 */
export const GRADE2_CURRICULUM = {
  basicTopics: 6,
  extensionTopics: 5,
  total: 7,
  defaultBasic: 5,
  defaultExtension: 2,
} as const;

export const TRANSITION_RULES = {
  transitionBasic: 3,
  grade2Basic: 2,
  transitionExtension: 1,
  grade2Extension: 1,
} as const;

export const REINFORCEMENT_COUNT = 2;
export const MISTAKE_DRILL_QUESTION_COUNT = 5;

export type GenerateQuestionsOptions = {
  date?: string;
  level?: PracticeLevel;
  /** @deprecated 使用 level */
  grade?: 1 | 2;
  force?: boolean;
  profile?: StudentProfile;
  /** 学习路径周次（1-12），指定后按该周配置出题 */
  pathWeek?: number;
  /** 薄弱专项：指定后按该知识点加强出题 */
  focusSkill?: ProfileSkill;
};

// =============================================================================
// 答案结构
// =============================================================================

/** 学生单次提交的答案 */
export type StudentAnswer = {
  questionId: number;
  /** 学生输入的原始字符串 */
  value: string;
  submittedAt?: string;
};

/** 单题批改结果（练习页内存态） */
export type QuestionAnswerResult = {
  correct: boolean;
  /** 小M老师主回复 */
  message: string;
  /** 答对时小M老师的思路讲解 */
  explanation?: string;
};

/** 写入能力画像的答题记录 */
export type AnswerRecordInput = {
  category: QuestionCategory;
  isCorrect: boolean;
};

/** @deprecated 使用 AnswerRecordInput */
export type RecordAnswerInput = AnswerRecordInput;

/** 写入错题本的记录 */
export type MistakeRecordInput = {
  question: Question;
  userAnswer: string;
};

export const MAX_HINT_ROUNDS = 3;

export type DialogueMessage = {
  role: "teacher" | "student";
  content: string;
};

/** AI 批改请求 */
export type TutorFeedbackRequest = {
  question: Question;
  userAnswer: string;
  attemptNumber: number;
  previousHints?: string[];
  dialogueHistory?: DialogueMessage[];
};

/** AI 批改响应 */
export type TutorFeedbackResponse = {
  isCorrect: boolean;
  message: string;
  explanation?: string;
  hintRound?: number;
  answerRevealed?: boolean;
  inviteDialogue?: boolean;
};

export type TutorChatRequest = {
  question: Question;
  userAnswer: string;
  hintRound: number;
  studentMessage: string;
  dialogueHistory: DialogueMessage[];
};

export type TutorChatResponse = {
  message: string;
};

export type ReinforcementRequest = {
  question: Question;
};

// =============================================================================
// 学习记录结构
// =============================================================================

/** 与 QuestionCategory 一一对应的知识点 */
export type ProfileSkill = QuestionCategory;

export type SkillLevel = "proficient" | "average" | "needs_improvement";

export type SkillLevelLabel = "很熟练" | "一般" | "需要加强";

export type SkillStats = {
  correct: number;
  total: number;
  /** 正确率 0-100 */
  accuracy: number;
  level: SkillLevel;
  levelLabel: SkillLevelLabel;
};

/** 学生能力画像（长期累积） */
export type StudentProfile = {
  studentId: string;
  updatedAt: string;
  skills: Record<ProfileSkill, SkillStats>;
};

/** 单轮练习中某题的结果 */
export type SessionResult = {
  correct: boolean;
};

/** 单轮练习总结 */
export type SessionSummary = {
  correctCount: number;
  totalCount: number;
  wrongCategoryLabels: string[];
  weakCategoriesText: string;
  recommendation: string;
  comment: string;
};

/** 错题本条目 */
export type MistakeEntry = {
  id: string;
  prompt: string;
  userAnswer: string;
  correctAnswer: number;
  unit?: string;
  category: QuestionCategory;
  wrongCount: number;
  lastPracticedAt: string;
  questionSnapshot: Question;
};

export type MistakeBook = {
  entries: MistakeEntry[];
  updatedAt: string;
};

/** 星星 / 等级成长 */
export type GrowthLevel = 1 | 2 | 3 | 4;

export type StudentGrowth = {
  studentId: string;
  totalStars: number;
  updatedAt: string;
};

export type LevelDefinition = {
  level: GrowthLevel;
  minStars: number;
  title: string;
};

export type LevelProgress = {
  level: GrowthLevel;
  title: string;
  totalStars: number;
  currentLevelMinStars: number;
  nextLevelMinStars: number | null;
  starsToNextLevel: number;
  progressPercent: number;
  isMaxLevel: boolean;
};

export type SessionStarBreakdown = {
  questionStars: number;
  perfectBonus: number;
  total: number;
};

/** 今日任务 */
export type DailyTaskType = "daily_main" | "weak_skill";

export type DailyTaskStatus = "pending" | "in_progress" | "completed";

export type DailyTask = {
  id: string;
  type: DailyTaskType;
  title: string;
  description: string;
  required: boolean;
  status: DailyTaskStatus;
  targetSkill?: QuestionCategory;
};

export type DailyTaskPlan = {
  date: string;
  tasks: DailyTask[];
  streakDays: number;
};

export type DailyTaskProgress = {
  plan: DailyTaskPlan;
  completedTaskCount: number;
  totalTaskCount: number;
  completedQuestionCount: number;
  allCompleted: boolean;
};

/** 学习路径 · 单周状态 */
export type LearningPathWeekStatus =
  | "locked"
  | "available"
  | "in_progress"
  | "completed";

export type LearningPathWeekRecord = {
  weekNumber: number;
  status: LearningPathWeekStatus;
  completedAt?: string;
  bestAccuracy?: number;
};

/** 学习路径 · 学生进度 */
export type LearningPathProgress = {
  studentId: string;
  currentWeek: number;
  weeks: LearningPathWeekRecord[];
  startDate: string;
  updatedAt: string;
};

export type LearningPathView = {
  progress: LearningPathProgress;
  completedWeekCount: number;
  totalWeeks: number;
  currentWeekConfig: {
    weekNumber: number;
    title: string;
    goal: string;
    focusLabels: string;
    basicLabels: string;
    thinkingLabels: string;
  } | null;
  isPathComplete: boolean;
};

// =============================================================================
// 常量与工具
// =============================================================================

export const PROFILE_SKILLS: ProfileSkill[] = [
  "addition",
  "subtraction",
  "multiplication",
  "division",
  "two_step_word",
  "time_money",
  "pattern_sequence",
  "logic_reasoning",
  "shape_pattern",
  "multi_step_word",
  "clever_calc",
];

export const SKILL_LABELS: Record<ProfileSkill, string> = {
  addition: "加法（进位）",
  subtraction: "减法（退位）",
  multiplication: "乘法（2/5/10）",
  division: "除法",
  two_step_word: "两步应用题",
  time_money: "时间钱币",
  pattern_sequence: "找规律",
  logic_reasoning: "逻辑推理",
  shape_pattern: "图形规律",
  multi_step_word: "多步应用题",
  clever_calc: "巧算",
};

export const LEVEL_LABELS: Record<SkillLevel, SkillLevelLabel> = {
  proficient: "很熟练",
  average: "一般",
  needs_improvement: "需要加强",
};

export function getSkillLabel(category: QuestionCategory): string {
  return SKILL_LABELS[category];
}

export function validateReinforcementCategory(
  original: QuestionCategory,
  category: QuestionCategory,
): boolean {
  return original === category;
}

/** 从 Question 构建标准答案结构 */
export function toCorrectAnswer(question: Question): {
  value: number;
  unit?: string;
} {
  return {
    value: question.answer,
    ...(question.unit ? { unit: question.unit } : {}),
  };
}

/** 判断学生字符串答案是否与题目正确 */
export function isAnswerCorrect(question: Question, userAnswer: string): boolean {
  if (Array.isArray(question.options) && question.options.length >= 2) {
    const selected = Number(userAnswer);
    return Number.isInteger(selected) && selected === question.answer;
  }

  const parsed = Number(userAnswer);
  return Number.isFinite(parsed) && parsed === question.answer;
}
