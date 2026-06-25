let timer: ReturnType<typeof setTimeout> | null = null;
let pushing = false;

export function scheduleStudentDataPush(): void {
  if (typeof window === "undefined") return;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    void flushStudentDataPush();
  }, 1000);
}

async function flushStudentDataPush(): Promise<void> {
  if (pushing || typeof window === "undefined") return;

  pushing = true;
  try {
    const { loadLocalStudentDataBundle } = await import(
      "@/lib/progress/studentDataClient"
    );
    const { pushStudentDataToServer } = await import(
      "@/lib/progress/studentDataServerApi"
    );

    const local = loadLocalStudentDataBundle();
    local.updatedAt = new Date().toISOString();
    await pushStudentDataToServer(local);
  } finally {
    pushing = false;
  }
}
