import { syncStudentDataWithServer } from "@/lib/progress/studentDataSync";

let timer: ReturnType<typeof setTimeout> | null = null;
let syncing = false;
let resyncRequested = false;

async function runStudentDataSync(): Promise<void> {
  if (syncing || typeof window === "undefined") return;

  syncing = true;
  try {
    await syncStudentDataWithServer();
  } finally {
    syncing = false;
    if (resyncRequested) {
      resyncRequested = false;
      void runStudentDataSync();
    }
  }
}

export function scheduleStudentDataPush(): void {
  if (typeof window === "undefined") return;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    void runStudentDataSync();
  }, 800);
}

/** 立即同步（页面重新可见、网络恢复时） */
export function syncStudentDataNow(): void {
  if (typeof window === "undefined") return;

  if (syncing) {
    resyncRequested = true;
    return;
  }

  if (timer) {
    clearTimeout(timer);
    timer = null;
  }

  void runStudentDataSync();
}
