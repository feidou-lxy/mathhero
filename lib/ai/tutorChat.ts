import { TEACHER_NAME } from "@/lib/ai/teacherCharacter";
import { callAiChat, isMockApiKey } from "@/lib/ai";
import {
  buildTutorChatSystemPrompt,
  buildTutorChatUserPrompt,
} from "@/lib/ai/tutorChatPrompts";
import type {
  TutorChatRequest,
  TutorChatResponse,
} from "@/lib/types/tutor";

function parseChatMessage(content: string): string | null {
  try {
    const parsed = JSON.parse(content) as { message?: unknown };
    return typeof parsed.message === "string" && parsed.message.trim()
      ? parsed.message.trim()
      : null;
  } catch {
    const trimmed = content.trim();
    return trimmed || null;
  }
}

function buildMockChatResponse(req: TutorChatRequest): TutorChatResponse {
  const replies = [
    `嗯，你说得对！${TEACHER_NAME}再问你：题目里第一个数字是多少呀？`,
    "很好，你在认真思考！接下来想想，这两个数是要合起来，还是从一个里拿走一些呢？",
    `你已经很接近啦！试着在心里算一算，然后告诉${TEACHER_NAME}你的新答案～`,
  ];

  return {
    message: replies[Math.min(req.hintRound - 1, replies.length - 1)],
  };
}

export async function getTutorChatResponse(
  req: TutorChatRequest,
): Promise<TutorChatResponse> {
  if (isMockApiKey(process.env.DEEPSEEK_API_KEY)) {
    return buildMockChatResponse(req);
  }

  const messages = [
    { role: "system" as const, content: buildTutorChatSystemPrompt(req) },
    { role: "user" as const, content: buildTutorChatUserPrompt(req) },
  ];

  const content = await callAiChat(messages, {
    jsonMode: true,
    temperature: 0.7,
  });
  const message = parseChatMessage(content);

  return { message: message ?? buildMockChatResponse(req).message };
}
