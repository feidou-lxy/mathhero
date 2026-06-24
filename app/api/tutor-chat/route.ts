import { getTutorChatResponse } from "@/lib/ai/tutorChat";
import type { TutorChatRequest } from "@/lib/types/tutor";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as TutorChatRequest;

    if (
      !body.question?.prompt ||
      !body.studentMessage?.trim() ||
      !body.hintRound
    ) {
      return Response.json({ error: "Invalid request" }, { status: 400 });
    }

    const response = await getTutorChatResponse({
      ...body,
      dialogueHistory: body.dialogueHistory ?? [],
    });

    return Response.json(response, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to get tutor chat";

    return Response.json({ error: message }, { status: 502 });
  }
}
