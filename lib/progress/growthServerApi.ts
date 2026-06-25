import type { StudentGrowth } from "@/lib/types/growth";

export async function fetchServerGrowth(): Promise<StudentGrowth | null> {
  try {
    const response = await fetch("/api/student-growth", { cache: "no-store" });
    if (!response.ok) return null;
    return (await response.json()) as StudentGrowth;
  } catch {
    return null;
  }
}

export async function pushGrowthToServer(growth: StudentGrowth): Promise<void> {
  try {
    await fetch("/api/student-growth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(growth),
    });
  } catch {
    // 离线时忽略
  }
}
