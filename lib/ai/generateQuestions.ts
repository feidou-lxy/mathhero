import { callAiChat, isMockApiKey } from "@/lib/ai";
import {
  buildMockPracticeSet,
  getTodayDateString,
} from "@/lib/ai/mockQuestions";
import { buildSystemPrompt, buildUserPrompt } from "@/lib/ai/prompts";
import {
  parseRawAIQuestionResponse,
  toPracticeSet,
  validateQuestionMix,
} from "@/lib/ai/validate";
import {
  buildGenerationPlan,
  getProfileFingerprint,
} from "@/lib/profile/generationPlan";
import { createEmptyProfile } from "@/lib/profile/studentProfile";
import type {
  GenerateQuestionsOptions,
  PracticeLevel,
  PracticeSet,
} from "@/lib/types/practice";

const cache = new Map<string, PracticeSet>();

function resolveLevel(options: GenerateQuestionsOptions): PracticeLevel {
  if (options.level) return options.level;
  if (options.grade) return options.grade;
  return 2;
}

function getCacheKey(
  date: string,
  level: PracticeLevel,
  profileFingerprint: string,
  pathWeek?: number,
  focusSkill?: string,
): string {
  const weekPart = pathWeek ? `:w${pathWeek}` : "";
  const skillPart = focusSkill ? `:s${focusSkill}` : "";
  return `${date}:${level}:${profileFingerprint}${weekPart}${skillPart}`;
}

export async function generateAIQuestions(
  options: GenerateQuestionsOptions = {},
): Promise<PracticeSet> {
  const date = options.date ?? getTodayDateString();
  const level = resolveLevel(options);
  const profile = options.profile ?? createEmptyProfile();
  const plan = buildGenerationPlan(
    profile,
    level,
    date,
    options.pathWeek,
    options.focusSkill,
  );
  const profileFingerprint = getProfileFingerprint(profile);
  const cacheKey = getCacheKey(
    date,
    level,
    profileFingerprint,
    options.pathWeek,
    options.focusSkill,
  );

  if (!options.force) {
    const cached = cache.get(cacheKey);
    if (cached) return cached;
  }

  if (isMockApiKey(process.env.DEEPSEEK_API_KEY)) {
    const mockSet = buildMockPracticeSet(date, level);
    cache.set(cacheKey, mockSet);
    return mockSet;
  }

  const messages = [
    {
      role: "system" as const,
      content: buildSystemPrompt(level, profile, plan),
    },
    {
      role: "user" as const,
      content: buildUserPrompt(date, level, profile, plan),
    },
  ];

  let lastError = "Unknown AI generation error";

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const content = await callAiChat(messages);
      const raw = parseRawAIQuestionResponse(content, level);

      if (!raw) {
        lastError = "AI response is not valid JSON";
        continue;
      }

      const mixError = validateQuestionMix(raw.questions, level, plan);
      if (mixError) {
        lastError = mixError;
        continue;
      }

      const practiceSet = toPracticeSet(raw, date, level, "ai");
      cache.set(cacheKey, practiceSet);
      return practiceSet;
    } catch (error) {
      lastError =
        error instanceof Error ? error.message : "DeepSeek request failed";
    }
  }

  console.warn(
    "[generateAIQuestions] AI generation failed, using mock fallback:",
    lastError,
  );
  const mockSet = buildMockPracticeSet(date, level);
  cache.set(cacheKey, mockSet);
  return mockSet;
}
