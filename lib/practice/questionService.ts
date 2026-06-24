import { buildMistakePracticeSet } from "@/lib/mistakes/buildPracticeSet";
import {
  findMistake,
  getMistakeDrillCategories,
  loadMistakes,
  markMistakePracticed,
} from "@/lib/mistakes/mistakeStorage";
import { loadProfileFromStorage } from "@/lib/profile/clientStorage";
import type { PracticeSet, ProfileSkill, Question, StudentProfile } from "@/types/math";
import {
  fetchGenerateQuestions,
  fetchMistakesPractice,
  fetchReinforcementQuestions,
} from "@/lib/practice/tutorApi";
import {
  PRACTICE_LEVEL,
  type PracticeSource,
} from "@/lib/practice/types";

export type LoadPracticeInput = {
  source: PracticeSource;
  mistakeId: string | null;
  force?: boolean;
  pathWeek?: number;
  focusSkill?: ProfileSkill;
};

export type LoadPracticeResult = {
  practiceSet: PracticeSet;
  profile: StudentProfile;
};

export async function loadPractice(
  input: LoadPracticeInput,
): Promise<LoadPracticeResult> {
  const profile = loadProfileFromStorage();
  const { source, mistakeId, force = false } = input;

  if (source === "mistake_single") {
    if (!mistakeId) {
      throw new Error("未指定错题");
    }

    const entry = findMistake(mistakeId);
    if (!entry) {
      throw new Error("错题不存在或已被删除");
    }

    markMistakePracticed(mistakeId);
    return {
      practiceSet: buildMistakePracticeSet(entry),
      profile,
    };
  }

  if (source === "mistakes_drill") {
    const mistakes = loadMistakes();
    if (mistakes.length === 0) {
      throw new Error("错题本为空，无法生成专项训练");
    }

    const categories = getMistakeDrillCategories();
    const practiceSet = await fetchMistakesPractice({ categories, mistakes });
    return { practiceSet, profile };
  }

  const practiceSet = await fetchGenerateQuestions({
    level: PRACTICE_LEVEL,
    force,
    profile,
    pathWeek: input.pathWeek,
    focusSkill: input.focusSkill,
  });

  return { practiceSet, profile };
}

export async function loadReinforcementQuestions(
  question: Question,
): Promise<Question[]> {
  const data = await fetchReinforcementQuestions(question);
  return data.questions;
}
