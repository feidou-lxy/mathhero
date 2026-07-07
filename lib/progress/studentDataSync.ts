import {
  addStars,
  createEmptyGrowth,
  mergeGrowthRecords,
  reconcileGrowthWithRedemptions,
} from "@/lib/progress/growth";
import { notifyGrowthUpdated } from "@/lib/progress/growthEvents";
import { notifyStudentDataUpdated } from "@/lib/progress/studentDataEvents";
import { tryRecoverGrowthFromLocalData } from "@/lib/progress/growthRecovery";
import {
  applyStudentDataBundleToLocal,
  loadLocalStudentDataBundle,
} from "@/lib/progress/studentDataClient";
import {
  mergeStudentDataBundles,
  normalizeStudentDataBundle,
} from "@/lib/progress/studentDataMerge";
import {
  fetchServerStudentData,
  pushStudentDataToServer,
} from "@/lib/progress/studentDataServerApi";
import type { StudentDataBundle } from "@/lib/types/studentData";

export { GROWTH_UPDATED_EVENT } from "@/lib/progress/growthEvents";
export { STUDENT_DATA_UPDATED_EVENT } from "@/lib/progress/studentDataEvents";

/** 历史数据恢复：全新账号无兑换记录时的初始星星 */
const RESTORED_STAR_COUNT = 20;

function applyStarBaseline(bundle: StudentDataBundle): StudentDataBundle {
  const redeemed = bundle.starBank.totalRedeemedStars ?? 0;
  const growth = reconcileGrowthWithRedemptions(bundle.growth, redeemed);

  if (growth.totalStars > 0 || growth.lifetimeStars > 0 || redeemed > 0) {
    return { ...bundle, growth };
  }

  const now = new Date().toISOString();
  return {
    ...bundle,
    growth: {
      ...growth,
      totalStars: RESTORED_STAR_COUNT,
      lifetimeStars: RESTORED_STAR_COUNT,
      updatedAt: now,
    },
    updatedAt: now,
  };
}

function applyGrowthFixes(bundle: StudentDataBundle): StudentDataBundle {
  const localGrowth = bundle.growth;
  const recoveredStars = tryRecoverGrowthFromLocalData(localGrowth.totalStars);
  let growth =
    recoveredStars > localGrowth.totalStars
      ? addStars(createEmptyGrowth(localGrowth.studentId), recoveredStars)
      : localGrowth;

  return applyStarBaseline({
    ...bundle,
    growth,
    updatedAt: new Date().toISOString(),
  });
}

function notifyAllUpdated(): void {
  notifyGrowthUpdated();
  notifyStudentDataUpdated();
}

export async function syncStudentDataWithServer(): Promise<StudentDataBundle> {
  let local = applyGrowthFixes(loadLocalStudentDataBundle());
  const server = await fetchServerStudentData();

  const merged = server
    ? applyGrowthFixes(mergeStudentDataBundles(local, server))
    : local;

  applyStudentDataBundleToLocal(merged);
  let pushed: StudentDataBundle | null = null;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    pushed = await pushStudentDataToServer(merged);
    if (pushed) break;
    await new Promise((resolve) => setTimeout(resolve, 400 * (attempt + 1)));
  }

  const afterPush = pushed ?? merged;

  if (server) {
    const reconciled = mergeStudentDataBundles(merged, afterPush);
    applyStudentDataBundleToLocal(reconciled);
    notifyAllUpdated();
    return normalizeStudentDataBundle(reconciled);
  }

  notifyAllUpdated();
  return normalizeStudentDataBundle(afterPush);
}

/** @deprecated 使用 syncStudentDataWithServer */
export async function syncGrowthWithServer() {
  const bundle = await syncStudentDataWithServer();
  return bundle.growth;
}
