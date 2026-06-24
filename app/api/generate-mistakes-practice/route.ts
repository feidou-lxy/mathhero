import { generateMistakesPractice } from "@/lib/ai/generateMistakesPractice";
import type { MistakeEntry } from "@/lib/types/mistakes";
import type { QuestionCategory } from "@/lib/types/practice";

type RequestBody = {
  categories?: QuestionCategory[];
  mistakes?: MistakeEntry[];
};

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as RequestBody;
    const categories = Array.isArray(body.categories) ? body.categories : [];
    const mistakes = Array.isArray(body.mistakes) ? body.mistakes : [];

    if (categories.length === 0 && mistakes.length === 0) {
      return Response.json(
        { error: "No categories or mistakes provided" },
        { status: 400 },
      );
    }

    const practiceSet = await generateMistakesPractice({
      categories,
      mistakes,
    });

    return Response.json(practiceSet, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to generate mistakes practice";

    return Response.json({ error: message }, { status: 502 });
  }
}
