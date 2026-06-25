"use client";

import { syncStudentDataWithServer } from "@/lib/progress/studentDataSync";
import { useEffect } from "react";

/** 启动时同步全部学习数据（多设备） */
export function StudentDataSync() {
  useEffect(() => {
    void syncStudentDataWithServer();
  }, []);

  return null;
}
