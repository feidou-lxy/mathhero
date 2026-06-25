import { callAiChat, isMockApiKey } from "@/lib/ai";
import {
  buildMockReinforcement,
  buildReinforcementSystemPrompt,
  buildReinforcementUserPrompt,
} from "@/lib/ai/reinforcementPrompts";
import { parseRawAIQuestionResponse } from "@/lib/ai/validate";
import { validateLogicReasoningQuestion } from "@/lib/ai/logicQuestionValidator";
import type { Question } from "@/lib/types/practice";
import { normalizeQuestion } from "@/lib/practice/questionPresentation";
import {
  REINFORCEMENT_COUNT,
  type ReinforcementSet,
  validateReinforcementCategory,
} from "@/lib/types/reinforcement";

function validateReinforcementQuestions(
  original: Question,
  questions: Question[],
): string | null {
  if (questions.length !== REINFORCEMENT_COUNT) {
    return `Expected ${REINFORCEMENT_COUNT} reinforcement questions`;
  }

  for (const q of questions) {
    if (!validateReinforcementCategory(original.category, q.category)) {
      return "Reinforcement questions must match original category";
    }
  }

  return null;
}

function toReinforcementSet(
  original: Question,
  rawQuestions: Question[],
): ReinforcementSet {
  const baseId = original.id * 100;

  return {
    sourceQuestionId: original.id,
    questions: rawQuestions.map((q, index) => ({
      ...q,
      id: baseId + index + 1,
      prompt: q.prompt.trim(),
    })),
  };
}

export async function generateReinforcementQuestions(
  original: Question,
): Promise<ReinforcementSet> {
  if (isMockApiKey(process.env.DEEPSEEK_API_KEY)) {
    return toReinforcementSet(original, buildMockReinforcement(original));
  }

  const messages = [
    { role: "system" as const, content: buildReinforcementSystemPrompt() },
    {
      role: "user" as const,
      content: buildReinforcementUserPrompt(original),
    },
  ];

  let lastError = "Failed to generate reinforcement questions";

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const content = await callAiChat(messages, {
        jsonMode: true,
        temperature: 0.7,
      });
      const raw = parseRawAIQuestionResponse(content, 1);

      if (!raw || raw.questions.length !== REINFORCEMENT_COUNT) {
        lastError = "Invalid reinforcement response";
        continue;
      }

      const mapped: Question[] = raw.questions.map((q, index) =>
        normalizeQuestion({
          id: original.id * 100 + index + 1,
          type: q.type,
          category: q.category,
          prompt: q.prompt.trim(),
          answer: q.answer,
          ...(q.unit ? { unit: q.unit } : {}),
          ...(q.hint ? { hint: q.hint } : {}),
          ...(q.options ? { options: q.options } : {}),
        }),
      );

      const validationError = validateReinforcementQuestions(original, mapped);
      if (validationError) {
        lastError = validationError;
        continue;
      }

      let logicValidationError: string | null = null;
      for (const question of mapped) {
        logicValidationError = validateLogicReasoningQuestion(question);
        if (logicValidationError) break;
      }
      if (logicValidationError) {
        lastError = logicValidationError;
        continue;
      }

      return toReinforcementSet(original, mapped);
    } catch (error) {
      lastError =
        error instanceof Error ? error.message : "Reinforcement request failed";
    }
  }

  return toReinforcementSet(original, buildMockReinforcement(original));
}
