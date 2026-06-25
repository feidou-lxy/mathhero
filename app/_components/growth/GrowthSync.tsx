"use client";

import { syncGrowthWithServer } from "@/lib/progress/growthSync";
import { useEffect } from "react";

/** 启动时同步星星：本地恢复 + 与服务端合并 */
export function GrowthSync() {
  useEffect(() => {
    void syncGrowthWithServer();
  }, []);

  return null;
}
