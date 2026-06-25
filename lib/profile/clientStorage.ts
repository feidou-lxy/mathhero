import { scheduleStudentDataPush } from "@/lib/progress/studentDataPush";
import { createEmptyProfile, normalizeProfile } from "@/lib/profile/studentProfile";
import type { RecordAnswerInput, StudentProfile } from "@/lib/types/profile";
import { recordProfileAnswer } from "@/lib/profile/studentProfile";

const STORAGE_KEY = "mathhero-student-profile";

export function loadProfileFromStorage(): StudentProfile {
  if (typeof window === "undefined") return createEmptyProfile();

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createEmptyProfile();
    return normalizeProfile(JSON.parse(raw));
  } catch {
    return createEmptyProfile();
  }
}

export function saveProfileToStorage(profile: StudentProfile): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  scheduleStudentDataPush();
}

export function recordAndSaveAnswer(input: RecordAnswerInput): StudentProfile {
  const profile = recordProfileAnswer(loadProfileFromStorage(), input);
  saveProfileToStorage(profile);
  return profile;
}
