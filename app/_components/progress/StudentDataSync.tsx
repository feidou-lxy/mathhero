"use client";

import { syncStudentDataNow } from "@/lib/progress/studentDataPush";
import { syncStudentDataWithServer } from "@/lib/progress/studentDataSync";
import { useEffect } from "react";

const SYNC_INTERVAL_MS = 45_000;

/** 启动时与前后台切换时同步全部学习数据（多设备） */
export function StudentDataSync() {
  useEffect(() => {
    void syncStudentDataWithServer();

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        syncStudentDataNow();
      }
    };

    const handleFocus = () => {
      syncStudentDataNow();
    };

    const handleOnline = () => {
      syncStudentDataNow();
    };

    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        syncStudentDataNow();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("online", handleOnline);
    window.addEventListener("pageshow", handlePageShow);

    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        syncStudentDataNow();
      }
    }, SYNC_INTERVAL_MS);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("pageshow", handlePageShow);
      window.clearInterval(interval);
    };
  }, []);

  return null;
}
