import { generateAIQuestions } from "@/lib/ai/generateQuestions";
import { getTodayDateString } from "@/lib/ai/mockQuestions";
import type {
  GenerateQuestionsOptions,
  PracticeLevel,
} from "@/lib/types/practice";
import type { StudentProfile } from "@/lib/types/profile";
import { loadProfileFromFile } from "@/lib/profile/fileStorage";
import { NextRequest } from "next/server";

function parseLevel(
  levelParam: string | null,
  gradeParam: string | null,
): PracticeLevel | undefined {
  if (levelParam === "transition") return "transition";
  if (levelParam === "1" || gradeParam === "1") return 1;
  if (levelParam === "2" || gradeParam === "2") return 2;
  return undefined;
}

function buildOptions(request: NextRequest): GenerateQuestionsOptions {
  const { searchParams } = request.nextUrl;

  return {
    date: searchParams.get("date") ?? getTodayDateString(),
    level: parseLevel(
      searchParams.get("level"),
      searchParams.get("grade"),
    ),
    force: searchParams.get("force") === "true",
  };
}

export async function GET(request: NextRequest) {
  try {
    const options = buildOptions(request);
    const profile = await loadProfileFromFile();
    const practiceSet = await generateAIQuestions({ ...options, profile });

    return Response.json(practiceSet, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to generate questions";

    return Response.json({ error: message }, { status: 502 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as GenerateQuestionsOptions;
    const fileProfile = await loadProfileFromFile();
    const practiceSet = await generateAIQuestions({
      date: body.date ?? getTodayDateString(),
      level: body.level ?? body.grade ?? 2,
      force: body.force ?? false,
      profile: body.profile ?? fileProfile,
      pathWeek: body.pathWeek,
      focusSkill: body.focusSkill,
    });

    return Response.json(practiceSet, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to generate questions";

    return Response.json({ error: message }, { status: 502 });
  }
}
