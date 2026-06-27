import {
  createEmptyStudentDataBundle,
  normalizeStudentDataBundle,
} from "@/lib/progress/studentDataMerge";
import { getStudentDataFilePath } from "@/lib/progress/dataPaths";
import type { StudentDataBundle } from "@/lib/types/studentData";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

const DATA_PATH = getStudentDataFilePath();

export async function loadStudentDataFromFile(): Promise<StudentDataBundle> {
  try {
    const raw = await readFile(DATA_PATH, "utf-8");
    return normalizeStudentDataBundle(JSON.parse(raw));
  } catch {
    return createEmptyStudentDataBundle();
  }
}

export async function saveStudentDataToFile(
  bundle: StudentDataBundle,
): Promise<void> {
  await mkdir(path.dirname(DATA_PATH), { recursive: true });
  await writeFile(
    DATA_PATH,
    JSON.stringify(normalizeStudentDataBundle(bundle), null, 2),
    "utf-8",
  );
}
