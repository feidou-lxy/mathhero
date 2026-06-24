import { getTodayDateString } from "@/lib/ai/mockQuestions";
import type { MistakeEntry } from "@/lib/types/mistakes";
import type { PracticeSet } from "@/lib/types/practice";

export function buildMistakePracticeSet(entry: MistakeEntry): PracticeSet {
  const date = getTodayDateString();

  return {
    setId: `mistake-${entry.id}`,
    date,
    level: 2,
    source: "mock",
    generatedAt: new Date().toISOString(),
    questions: [
      {
        ...entry.questionSnapshot,
        id: 1,
      },
    ],
  };
}
