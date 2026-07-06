import { getTodayDateString } from "@/lib/ai/mockQuestions";
import type { StudentProfile } from "@/lib/types/profile";
import { PROFILE_SKILLS, SKILL_LABELS } from "@/lib/types/profile";
import type {
  DailyTask,
  DailyTaskPlan,
  DailyTaskProgress,
  DailyTaskType,
} from "@/lib/types/dailyTasks";

export type StoredDailyTasks = {
  date: string;
  tasks: DailyTask[];
  streakDays: number;
  lastStreakDate: string | null;
};

function findWeakestSkill(profile: StudentProfile) {
  const candidates = PROFILE_SKILLS.filter(
    (skill) =>
      profile.skills[skill].level === "needs_improvement" &&
      profile.skills[skill].total >= 2,
  );

  if (candidates.length === 0) return null;

  return candidates.sort(
    (a, b) => profile.skills[a].accuracy - profile.skills[b].accuracy,
  )[0];
}

function createDailyMainTask(): DailyTask {
  return {
    id: "daily_main",
    type: "daily_main",
    title: "今日闯关",
    description: "7 道题，倒计时内完成；按答对题数获得 0–5 颗星星",
    required: true,
    status: "pending",
  };
}

function createWeakSkillTask(skill: (typeof PROFILE_SKILLS)[number]): DailyTask {
  const label = SKILL_LABELS[skill];
  return {
    id: `weak_skill_${skill}`,
    type: "weak_skill",
    title: "薄弱专项",
    description: `加强练习「${label}」，完成 7 题且正确率 ≥ 60%`,
    required: false,
    status: "pending",
    targetSkill: skill,
  };
}

export function buildDailyTasks(profile: StudentProfile): DailyTask[] {
  const tasks: DailyTask[] = [createDailyMainTask()];

  const weakest = findWeakestSkill(profile);
  if (weakest) {
    tasks.push(createWeakSkillTask(weakest));
  }

  return tasks;
}

function computeStreak(
  streakDays: number,
  lastStreakDate: string | null,
  today: string,
): { streakDays: number; lastStreakDate: string } {
  if (lastStreakDate === today) {
    return { streakDays, lastStreakDate: today };
  }

  if (!lastStreakDate) {
    return { streakDays: 1, lastStreakDate: today };
  }

  const last = new Date(`${lastStreakDate}T12:00:00`);
  const current = new Date(`${today}T12:00:00`);
  const diffDays = Math.round(
    (current.getTime() - last.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays === 1) {
    return { streakDays: streakDays + 1, lastStreakDate: today };
  }

  return { streakDays: 1, lastStreakDate: today };
}

export function mergeStoredPlan(
  stored: StoredDailyTasks | null,
  profile: StudentProfile,
): StoredDailyTasks {
  const today = getTodayDateString();

  if (stored && stored.date === today) {
    return {
      ...stored,
      tasks: stored.tasks.map((task) =>
        task.id === "daily_main"
          ? { ...task, description: createDailyMainTask().description }
          : task,
      ),
    };
  }

  const previousStreak = stored?.streakDays ?? 0;
  const previousLastStreakDate = stored?.lastStreakDate ?? null;

  return {
    date: today,
    tasks: buildDailyTasks(profile),
    streakDays: previousStreak,
    lastStreakDate: previousLastStreakDate,
  };
}

export function toDailyTaskPlan(stored: StoredDailyTasks): DailyTaskPlan {
  return {
    date: stored.date,
    tasks: stored.tasks,
    streakDays: stored.streakDays,
  };
}

const QUESTIONS_PER_TASK = 7;

export function getDailyTaskProgress(stored: StoredDailyTasks): DailyTaskProgress {
  const plan = toDailyTaskPlan(stored);
  const completedTaskCount = plan.tasks.filter(
    (t) => t.status === "completed",
  ).length;

  return {
    plan,
    completedTaskCount,
    totalTaskCount: plan.tasks.length,
    completedQuestionCount: completedTaskCount * QUESTIONS_PER_TASK,
    allCompleted:
      plan.tasks.length > 0 && completedTaskCount === plan.tasks.length,
  };
}

export function markTaskInProgress(
  stored: StoredDailyTasks,
  taskId: string,
): StoredDailyTasks {
  return {
    ...stored,
    tasks: stored.tasks.map((task) =>
      task.id === taskId && task.status === "pending"
        ? { ...task, status: "in_progress" }
        : task,
    ),
  };
}

export function canCompleteTask(
  task: DailyTask,
  accuracy: number,
): boolean {
  if (task.type === "daily_main") return true;
  if (task.type === "weak_skill") return accuracy >= 0.6;
  return false;
}

export function markTaskCompleted(
  stored: StoredDailyTasks,
  taskId: string,
  accuracy: number,
): StoredDailyTasks {
  const task = stored.tasks.find((t) => t.id === taskId);
  if (!task || task.status === "completed") return stored;
  if (!canCompleteTask(task, accuracy)) return stored;

  const today = getTodayDateString();
  const tasks = stored.tasks.map((t) =>
    t.id === taskId ? { ...t, status: "completed" as const } : t,
  );

  const requiredDone = tasks
    .filter((t) => t.required)
    .every((t) => t.status === "completed");

  let streakDays = stored.streakDays;
  let lastStreakDate = stored.lastStreakDate;

  if (requiredDone && task.type === "daily_main") {
    const streak = computeStreak(stored.streakDays, stored.lastStreakDate, today);
    streakDays = streak.streakDays;
    lastStreakDate = streak.lastStreakDate;
  }

  return {
    ...stored,
    tasks,
    streakDays,
    lastStreakDate,
  };
}

export function getTaskPracticeHref(task: DailyTask): string {
  if (task.type === "weak_skill" && task.targetSkill) {
    return `/practice?task=${task.id}&skill=${task.targetSkill}`;
  }
  return `/practice?task=${task.id}`;
}

export function parseTaskIdFromParam(param: string | null): string | null {
  if (!param) return null;
  if (param === "daily_main") return "daily_main";
  if (param.startsWith("weak_skill_")) return param;
  return null;
}

export function getTaskTypeFromId(taskId: string): DailyTaskType | null {
  if (taskId === "daily_main") return "daily_main";
  if (taskId.startsWith("weak_skill_")) return "weak_skill";
  return null;
}
