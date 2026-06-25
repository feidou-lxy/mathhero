import {
  createEmptyGrowth,
  normalizeGrowth,
} from "@/lib/progress/growth";
import type { StudentGrowth } from "@/lib/types/growth";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

const GROWTH_PATH = path.join(process.cwd(), "data", "student-growth.json");

export async function loadGrowthFromFile(): Promise<StudentGrowth> {
  try {
    const raw = await readFile(GROWTH_PATH, "utf-8");
    return normalizeGrowth(JSON.parse(raw));
  } catch {
    return createEmptyGrowth();
  }
}

export async function saveGrowthToFile(growth: StudentGrowth): Promise<void> {
  await mkdir(path.dirname(GROWTH_PATH), { recursive: true });
  await writeFile(GROWTH_PATH, JSON.stringify(growth, null, 2), "utf-8");
}