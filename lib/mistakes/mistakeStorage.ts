import {
  createEmptyMistakeBook,
  deleteMistake,
  getDrillCategories,
  getMistakeById,
  normalizeMistakeBook,
  recordMistake,
  sortMistakes,
  touchMistake,
} from "@/lib/mistakes/mistakeBook";
import type {
  MistakeBook,
  MistakeEntry,
  RecordMistakeInput,
} from "@/lib/types/mistakes";
import { scheduleStudentDataPush } from "@/lib/progress/studentDataPush";
import type { QuestionCategory } from "@/lib/types/practice";

const STORAGE_KEY = "mathhero-mistake-book";

function readRaw(): MistakeBook {
  if (typeof window === "undefined") return createEmptyMistakeBook();

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createEmptyMistakeBook();
    return normalizeMistakeBook(JSON.parse(raw));
  } catch {
    return createEmptyMistakeBook();
  }
}

function writeRaw(book: MistakeBook): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(book));
  scheduleStudentDataPush();
}

export function loadMistakeBook(): MistakeBook {
  return readRaw();
}

export function loadMistakes(): MistakeEntry[] {
  return sortMistakes(readRaw().entries);
}

export function loadMistakeCount(): number {
  return readRaw().entries.length;
}

export function saveMistakeRecord(input: RecordMistakeInput): MistakeEntry[] {
  const book = recordMistake(readRaw(), input);
  writeRaw(book);
  return sortMistakes(book.entries);
}

export function removeMistake(id: string): MistakeEntry[] {
  const book = deleteMistake(readRaw(), id);
  writeRaw(book);
  return sortMistakes(book.entries);
}

export function markMistakePracticed(id: string): MistakeEntry[] {
  const book = touchMistake(readRaw(), id);
  writeRaw(book);
  return sortMistakes(book.entries);
}

export function findMistake(id: string): MistakeEntry | null {
  return getMistakeById(readRaw(), id);
}

export function getMistakeDrillCategories(): QuestionCategory[] {
  return getDrillCategories(readRaw().entries);
}
