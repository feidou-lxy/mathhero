import { createEmptyProfile, normalizeProfile } from "@/lib/profile/studentProfile";
import { getStudentProfileFilePath } from "@/lib/progress/dataPaths";
import type { StudentProfile } from "@/lib/types/profile";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

const PROFILE_PATH = getStudentProfileFilePath();

export async function loadProfileFromFile(): Promise<StudentProfile> {
  try {
    const raw = await readFile(PROFILE_PATH, "utf-8");
    return normalizeProfile(JSON.parse(raw));
  } catch {
    return createEmptyProfile();
  }
}

export async function saveProfileToFile(profile: StudentProfile): Promise<void> {
  await mkdir(path.dirname(PROFILE_PATH), { recursive: true });
  await writeFile(PROFILE_PATH, JSON.stringify(profile, null, 2), "utf-8");
}
