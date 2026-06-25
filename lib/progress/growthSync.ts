import {
  addStars,
  createEmptyGrowth,
  mergeGrowthRecords,
} from "@/lib/progress/growth";
import { notifyGrowthUpdated } from "@/lib/progress/growthEvents";
import { tryRecoverGrowthFromLocalData } from "@/lib/progress/growthRecovery";
import {
  fetchServerGrowth,
  pushGrowthToServer,
} from "@/lib/progress/growthServerApi";
import { loadGrowth, saveGrowth } from "@/lib/progress/growthStorage";
import type { StudentGrowth } from "@/lib/types/growth";

export { GROWTH_UPDATED_EVENT } from "@/lib/progress/growthEvents";

/** 历史数据恢复：星星被清空时补回 Lv2 门槛 */
const RESTORED_STAR_COUNT = 20;

function applyStarBaseline(growth: StudentGrowth): StudentGrowth {
  if (growth.totalStars > 0) return growth;

  return {
    ...growth,
    totalStars: RESTORED_STAR_COUNT,
    updatedAt: new Date().toISOString(),
  };
}

export async function syncGrowthWithServer(): Promise<StudentGrowth> {
  const local = loadGrowth();
  const recoveredStars = tryRecoverGrowthFromLocalData(local.totalStars);
  let recovered =
    recoveredStars > local.totalStars
      ? addStars(createEmptyGrowth(local.studentId), recoveredStars)
      : local;

  recovered = applyStarBaseline(recovered);

  if (recovered.totalStars !== local.totalStars) {
    saveGrowth(recovered);
  }

  const server = await fetchServerGrowth();
  if (!server) {
    void pushGrowthToServer(recovered);
    notifyGrowthUpdated();
    return recovered;
  }

  const merged = applyStarBaseline(mergeGrowthRecords(recovered, server));
  if (merged.totalStars !== local.totalStars) {
    saveGrowth(merged);
  }

  if (merged.totalStars > server.totalStars) {
    void pushGrowthToServer(merged);
  }

  notifyGrowthUpdated();
  return merged;
}
