import type { StudentDataBundle } from "@/lib/types/studentData";

export async function fetchServerStudentData(): Promise<StudentDataBundle | null> {
  try {
    const response = await fetch("/api/student-data", { cache: "no-store" });
    if (!response.ok) return null;
    return (await response.json()) as StudentDataBundle;
  } catch {
    return null;
  }
}

export async function pushStudentDataToServer(
  bundle: StudentDataBundle,
): Promise<StudentDataBundle | null> {
  try {
    const response = await fetch("/api/student-data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bundle),
      keepalive: true,
    });
    if (!response.ok) return null;
    return (await response.json()) as StudentDataBundle;
  } catch {
    return null;
  }
}
