import {
  GRADE2_FIXED_ADVANCED_COUNT,
  GRADE2_FIXED_BASIC_COUNT,
  isBasicCategory,
  isExtensionCategory,
  type TopicSlot,
} from "@/lib/curriculum/grade2";
import {
  computeDifficultyBalance,
  isSkillWeak,
  THINKING_CATEGORIES,
  type DifficultyBalance,
} from "@/lib/curriculum/difficultyBalance";
import { getTopWeakSkills } from "@/lib/mastery/skillMastery";
import type { ProfileSkill, StudentProfile } from "@/lib/types/profile";
import type { QuestionCategory } from "@/types/math";

const CALC_SKILLS: QuestionCategory[] = [
  "addition",
  "subtraction",
  "multiplication",
  "division",
];

const APPLICATION_SKILLS: QuestionCategory[] = [
  "two_step_word",
  "time_money",
  "multi_step_word",
];

function pickWeakestCategory(
  profile: StudentProfile,
  pool: QuestionCategory[],
  exclude: QuestionCategory[] = [],
): QuestionCategory {
  const candidates = pool.filter((c) => !exclude.includes(c));
  const weak = candidates.find((c) => isSkillWeak(profile, c as ProfileSkill));
  return weak ?? candidates[0] ?? "addition";
}

function buildBasicSlotsForFocus(
  profile: StudentProfile,
  focusSkill: ProfileSkill,
  balance: DifficultyBalance,
): QuestionCategory[] {
  if (isBasicCategory(focusSkill)) {
    const slots: QuestionCategory[] = [focusSkill, focusSkill, focusSkill];

    if (focusSkill === "division") {
      slots.push("multiplication");
    } else if (focusSkill === "multiplication") {
      slots.push("division");
    } else if (CALC_SKILLS.includes(focusSkill)) {
      slots.push(
        pickWeakestCategory(profile, CALC_SKILLS, [focusSkill, ...slots]),
      );
    } else {
      slots.push(pickWeakestCategory(profile, CALC_SKILLS));
    }

    if (focusSkill === "two_step_word" || focusSkill === "time_money") {
      slots.push(
        pickWeakestCategory(profile, CALC_SKILLS, [focusSkill]),
      );
    } else if (balance.focusSkills.includes("two_step_word")) {
      slots.push("two_step_word");
    } else {
      slots.push(
        pickWeakestCategory(profile, APPLICATION_SKILLS, [focusSkill]),
      );
    }

    return slots.slice(0, GRADE2_FIXED_BASIC_COUNT);
  }

  const weakCalc = getTopWeakSkills(profile, 2).filter((s) =>
    CALC_SKILLS.includes(s),
  );

  const basics: QuestionCategory[] = [
    ...(weakCalc.length > 0
      ? (weakCalc as QuestionCategory[])
      : (["addition", "subtraction"] as QuestionCategory[])),
    pickWeakestCategory(profile, CALC_SKILLS, weakCalc as QuestionCategory[]),
    pickWeakestCategory(profile, APPLICATION_SKILLS),
  ];

  while (basics.length < GRADE2_FIXED_BASIC_COUNT) {
    basics.push(pickWeakestCategory(profile, CALC_SKILLS, basics));
  }

  return basics.slice(0, GRADE2_FIXED_BASIC_COUNT);
}

function buildAdvancedSlotsForFocus(
  profile: StudentProfile,
  focusSkill: ProfileSkill,
  balance: DifficultyBalance,
): QuestionCategory[] {
  if (isExtensionCategory(focusSkill)) {
    const thinkingPool = THINKING_CATEGORIES.filter((c) => c !== focusSkill);
    const second =
      thinkingPool.find((c) => isSkillWeak(profile, c as ProfileSkill)) ??
      thinkingPool[0] ??
      "pattern_sequence";

    return [focusSkill, second];
  }

  if (focusSkill === "two_step_word" || focusSkill === "multi_step_word") {
    return ["multi_step_word", "logic_reasoning"];
  }

  if (focusSkill === "time_money") {
    return ["clever_calc", "pattern_sequence"];
  }

  const thinking = THINKING_CATEGORIES.find((c) =>
    isSkillWeak(profile, c as ProfileSkill),
  );

  return [
    thinking ?? "pattern_sequence",
    balance.advancedTier === "hard" ? "multi_step_word" : "shape_pattern",
  ];
}

export function allocateWeakSkillTopicSlots(
  profile: StudentProfile,
  focusSkill: ProfileSkill,
  date: string,
  balance?: DifficultyBalance,
): TopicSlot[] {
  const resolvedBalance = balance ?? computeDifficultyBalance(profile);
  void date;

  const basicCategories = buildBasicSlotsForFocus(
    profile,
    focusSkill,
    resolvedBalance,
  );
  const advancedCategories = buildAdvancedSlotsForFocus(
    profile,
    focusSkill,
    resolvedBalance,
  );

  return [
    ...basicCategories.map((category) => ({
      type: "basic" as const,
      category,
    })),
    ...advancedCategories
      .slice(0, GRADE2_FIXED_ADVANCED_COUNT)
      .map((category) => ({
        type: "extension" as const,
        category,
      })),
  ];
}

export function validateFocusSkillBasicCoverage(
  categories: QuestionCategory[],
  focusSkill: ProfileSkill,
): string | null {
  const focusCount = categories.filter((c) => c === focusSkill).length;

  if (isBasicCategory(focusSkill) && focusCount < 3) {
    return `Weak-skill practice must include at least 3 basic questions for ${focusSkill}, got ${focusCount}`;
  }

  if (isExtensionCategory(focusSkill)) {
    return null;
  }

  return null;
}
