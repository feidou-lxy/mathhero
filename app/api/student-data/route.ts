import {
  loadStudentDataFromFile,
  saveStudentDataToFile,
} from "@/lib/progress/studentDataFileStorage";
import { saveGrowthToFile } from "@/lib/progress/growthFileStorage";
import { saveProfileToFile } from "@/lib/profile/fileStorage";
import {
  mergeStudentDataBundles,
  normalizeStudentDataBundle,
} from "@/lib/progress/studentDataMerge";
import type { StudentDataBundle } from "@/lib/types/studentData";

export async function GET() {
  try {
    const bundle = await loadStudentDataFromFile();
    return Response.json(bundle);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load student data";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as StudentDataBundle;
    const incoming = normalizeStudentDataBundle(body);
    const current = await loadStudentDataFromFile();
    const merged = mergeStudentDataBundles(current, incoming);
    await saveStudentDataToFile(merged);
    await saveProfileToFile(merged.profile);
    await saveGrowthToFile(merged.growth);
    return Response.json(merged);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to save student data";
    return Response.json({ error: message }, { status: 500 });
  }
}
