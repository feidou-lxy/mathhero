import {
  loadStudentDataFromFile,
  saveStudentDataToFile,
} from "@/lib/progress/studentDataFileStorage";
import { normalizeGrowth } from "@/lib/progress/growth";
import { saveGrowthToFile } from "@/lib/progress/growthFileStorage";
import type { StudentGrowth } from "@/lib/types/growth";

/** 直接替换成长数据（不合并），用于修正星星余额与累计星星 */
export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as StudentGrowth;
    const growth = normalizeGrowth(body);
    const bundle = await loadStudentDataFromFile();
    const updatedAt = new Date().toISOString();

    await saveStudentDataToFile({
      ...bundle,
      growth,
      updatedAt,
    });
    await saveGrowthToFile(growth);

    return Response.json(growth);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update growth";
    return Response.json({ error: message }, { status: 500 });
  }
}
