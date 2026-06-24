import {
  loadProfileFromFile,
  saveProfileToFile,
} from "@/lib/profile/fileStorage";
import { normalizeProfile, recordProfileAnswer } from "@/lib/profile/studentProfile";
import type { RecordAnswerInput, StudentProfile } from "@/lib/types/profile";

export async function GET() {
  try {
    const profile = await loadProfileFromFile();
    return Response.json(profile);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load profile";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as
      | StudentProfile
      | { profile?: StudentProfile; record?: RecordAnswerInput };

    if ("record" in body && body.record) {
      const current = body.profile
        ? normalizeProfile(body.profile)
        : await loadProfileFromFile();
      const updated = recordProfileAnswer(current, body.record);
      await saveProfileToFile(updated);
      return Response.json(updated);
    }

    if ("skills" in body) {
      const profile = normalizeProfile(body);
      await saveProfileToFile(profile);
      return Response.json(profile);
    }

    return Response.json({ error: "Invalid request" }, { status: 400 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to save profile";
    return Response.json({ error: message }, { status: 500 });
  }
}
