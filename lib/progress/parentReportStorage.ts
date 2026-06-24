import { buildParentReport, type BuildParentReportInput } from "@/lib/learning/parentReport";
import type {
  ParentLearningReport,
  ParentReportStore,
} from "@/lib/types/parentReport";

const STORAGE_KEY = "mathhero-parent-reports";
const MAX_REPORTS = 50;

function readRaw(): unknown {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeRaw(store: ParentReportStore): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function isValidReport(value: unknown): value is ParentLearningReport {
  if (!value || typeof value !== "object") return false;
  const r = value as Partial<ParentLearningReport>;
  return (
    typeof r.id === "string" &&
    typeof r.createdAt === "string" &&
    typeof r.durationLabel === "string" &&
    typeof r.accuracyPercent === "number" &&
    typeof r.wrongCount === "number" &&
    typeof r.teacherComment === "string" &&
    Array.isArray(r.masteredSkills) &&
    Array.isArray(r.weakSkills)
  );
}

function normalizeStore(data: unknown): ParentReportStore {
  if (!data || typeof data !== "object") return { reports: [] };

  const record = data as Partial<ParentReportStore>;
  if (!Array.isArray(record.reports)) return { reports: [] };

  const reports = record.reports.filter(isValidReport);
  reports.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return { reports: reports.slice(0, MAX_REPORTS) };
}

export function loadParentReports(): ParentLearningReport[] {
  const store = normalizeStore(readRaw());
  writeRaw(store);
  return store.reports;
}

export function loadLatestParentReport(): ParentLearningReport | null {
  const reports = loadParentReports();
  return reports[0] ?? null;
}

export function getParentReportById(id: string): ParentLearningReport | null {
  return loadParentReports().find((r) => r.id === id) ?? null;
}

export function saveParentReport(report: ParentLearningReport): ParentLearningReport {
  const store = normalizeStore(readRaw());
  const reports = [report, ...store.reports.filter((r) => r.id !== report.id)];
  writeRaw({ reports: reports.slice(0, MAX_REPORTS) });
  return report;
}

export function createAndSaveParentReport(
  input: BuildParentReportInput,
): ParentLearningReport {
  return saveParentReport(buildParentReport(input));
}
