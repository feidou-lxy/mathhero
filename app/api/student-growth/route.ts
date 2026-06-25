import {
  loadGrowthFromFile,
  saveGrowthToFile,
} from "@/lib/progress/growthFileStorage";
import {
  mergeGrowthRecords,
  normalizeGrowth,
} from "@/lib/progress/growth";
import type { StudentGrowth } from "@/lib/types/growth";

export async function GET() {
  try {
    const growth = await loadGrowthFromFile();
    return Response.json(growth);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load growth";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as StudentGrowth;
    const incoming = normalizeGrowth(body);
    const current = await loadGrowthFromFile();
    const merged = mergeGrowthRecords(current, incoming);
    await saveGrowthToFile(merged);
    return Response.json(merged);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to save growth";
    return Response.json({ error: message }, { status: 500 });
  }
}
