import type { StudentGrowth } from "@/lib/types/growth";
import type { ParentReportStore } from "@/lib/types/parentReport";
import type { StudentProfile } from "@/lib/types/profile";
import type { StarBankAccount } from "@/lib/types/starBank";
import type { MistakeBook } from "@/lib/types/mistakes";
import type { LearningPathProgress } from "@/types/math";
import type { StoredDailyTasks } from "@/lib/progress/dailyTasks";

/** 服务端统一存储的学生数据包（多设备同步） */
export type StudentDataBundle = {
  studentId: string;
  updatedAt: string;
  profile: StudentProfile;
  growth: StudentGrowth;
  learningPath: LearningPathProgress;
  dailyTasks: StoredDailyTasks | null;
  parentReports: ParentReportStore;
  mistakeBook: MistakeBook;
  starBank: StarBankAccount;
};
