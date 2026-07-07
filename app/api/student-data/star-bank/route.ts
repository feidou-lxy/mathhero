import {
  loadStudentDataFromFile,
  saveStudentDataToFile,
} from "@/lib/progress/studentDataFileStorage";
import { normalizeStarBankAccount } from "@/lib/progress/starBank";
import type { StarBankAccount } from "@/lib/types/starBank";

/** 直接替换星星银行数据（不合并），用于修正无效兑换记录 */
export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as StarBankAccount;
    const starBank = normalizeStarBankAccount(body);
    const bundle = await loadStudentDataFromFile();
    const updatedAt = new Date().toISOString();

    await saveStudentDataToFile({
      ...bundle,
      starBank,
      updatedAt,
    });

    return Response.json(starBank);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update star bank";
    return Response.json({ error: message }, { status: 500 });
  }
}
