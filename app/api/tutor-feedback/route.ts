import { getTutorFeedback } from "@/lib/ai/tutorFeedback";
import type { TutorFeedbackRequest } from "@/lib/types/tutor";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as TutorFeedbackRequest;

    if (
      !body.question?.prompt ||
      body.userAnswer === undefined ||
      body.userAnswer === "" ||
      !body.attemptNumber
    ) {
      return Response.json({ error: "Invalid request" }, { status: 400 });
    }

    const feedback = await getTutorFeedback(body);

    return Response.json(feedback, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to get tutor feedback";

    return Response.json({ error: message }, { status: 502 });
  }
}
