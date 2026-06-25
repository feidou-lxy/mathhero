export const STUDENT_DATA_UPDATED_EVENT = "mathhero-student-data-updated";

export function notifyStudentDataUpdated(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(STUDENT_DATA_UPDATED_EVENT));
}
