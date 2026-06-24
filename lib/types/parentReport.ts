import type { PracticeSource } from "@/lib/practice/types";

/** 家长学习报告 */
export type ParentLearningReport = {
  id: string;
  createdAt: string;
  /** 练习日期 YYYY-MM-DD */
  date: string;
  /** 学习时长（秒） */
  durationSeconds: number;
  /** 格式化后的学习时长 */
  durationLabel: string;
  /** 正确率 0–100 */
  accuracyPercent: number;
  correctCount: number;
  totalCount: number;
  /** 错题数量 */
  wrongCount: number;
  /** 掌握的知识点（本轮全对） */
  masteredSkills: string[];
  /** 薄弱知识点（本轮有错题） */
  weakSkills: string[];
  /** 小M老师评语 */
  teacherComment: string;
  /** 评语老师名称 */
  teacherName?: string;
  practiceSource: PracticeSource;
  sessionTitle: string;
  pathWeek?: number;
  pathWeekTitle?: string;
};

export type ParentReportStore = {
  reports: ParentLearningReport[];
};
