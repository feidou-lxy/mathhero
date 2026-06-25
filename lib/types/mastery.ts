import type { ProfileSkill, SkillLevel } from "@/lib/types/profile";

/** 单个知识点掌握情况 */
export type SkillMasteryItem = {
  skill: ProfileSkill;
  label: string;
  accuracy: number;
  level: SkillLevel;
  levelLabel: string;
  correct: number;
  total: number;
  practiced: boolean;
  /** 越大越薄弱，用于排序 */
  weaknessScore: number;
  /** 计算题平均答题秒数 */
  avgResponseSeconds?: number | null;
  /** 答题速度评价 */
  speedLabel?: "很快" | "正常" | "偏慢" | null;
};

/** 能力分组（用于能力图） */
export type SkillGroupMastery = {
  id: "calculation" | "application" | "thinking";
  label: string;
  skills: ProfileSkill[];
  accuracy: number;
  practicedCount: number;
  totalCount: number;
};

/** 知识点掌握全景 */
export type SkillMasteryView = {
  items: SkillMasteryItem[];
  /** 薄弱项排序（最薄弱在前） */
  weakRanking: SkillMasteryItem[];
  /** 掌握较好排序 */
  strongRanking: SkillMasteryItem[];
  /** 整体掌握率（按答题量加权） */
  overallMasteryRate: number;
  practicedSkillCount: number;
  totalSkillCount: number;
  groups: SkillGroupMastery[];
};
