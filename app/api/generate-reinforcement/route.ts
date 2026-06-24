import { generateReinforcementQuestions } from "@/lib/ai/generateReinforcement";
import type { Question } from "@/lib/types/practice";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { question?: Question };

    if (!body.question?.prompt || !body.question.category) {
      return Response.json({ error: "Invalid request" }, { status: 400 });
    }

    const reinforcement = await generateReinforcementQuestions(body.question);

    return Response.json(reinforcement, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to generate reinforcement questions";

    return Response.json({ error: message }, { status: 502 });
  }
}
