"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ParentReportCard } from "@/app/_components/parent-report/ParentReportCard";
import { TEACHER_NAME } from "@/lib/ai/teacherCharacter";
import {
  getParentReportById,
  loadParentReports,
} from "@/lib/progress/parentReportStorage";
import type { ParentLearningReport } from "@/lib/types/parentReport";

export function ParentReportPageContent() {
  const searchParams = useSearchParams();
  const reportId = searchParams.get("id");
  const [reports, setReports] = useState<ParentLearningReport[] | null>(null);

  useEffect(() => {
    setReports(loadParentReports());
  }, []);

  const highlightedReport = useMemo(() => {
    if (!reports || reports.length === 0) return null;
    if (reportId) {
      return getParentReportById(reportId) ?? reports[0];
    }
    return reports[0];
  }, [reports, reportId]);

  const historyReports = useMemo(() => {
    if (!reports || !highlightedReport) return reports ?? [];
    return reports.filter((r) => r.id !== highlightedReport.id);
  }, [reports, highlightedReport]);

  if (!reports) {
    return (
      <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
        <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-6 py-12">
          <p className="text-zinc-600 dark:text-zinc-400">报告加载中…</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-6 py-12">
        <header className="mb-6">
          <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
            家长学习报告
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            每次练习完成后由{TEACHER_NAME}自动生成，方便了解孩子的学习情况
          </p>
        </header>

        {reports.length === 0 ? (
          <div className="rounded-2xl border border-black/[.08] bg-white px-6 py-12 text-center dark:border-white/[.145] dark:bg-zinc-900">
            <p className="text-base font-medium text-black dark:text-zinc-50">
              还没有学习报告
            </p>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              完成一次数学练习后，这里会自动生成报告
            </p>
            <Link
              href="/"
              className="mt-6 inline-flex items-center justify-center rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
            >
              返回首页开始练习
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {highlightedReport && (
              <section>
                <h2 className="mb-3 text-lg font-semibold text-black dark:text-zinc-50">
                  本次学习
                </h2>
                <ParentReportCard report={highlightedReport} highlight />
              </section>
            )}

            {historyReports.length > 0 && (
              <section>
                <h2 className="mb-3 text-lg font-semibold text-black dark:text-zinc-50">
                  历史记录
                </h2>
                <div className="space-y-3">
                  {historyReports.map((report) => (
                    <ParentReportCard key={report.id} report={report} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        <Link
          href="/"
          className="mt-8 flex w-full items-center justify-center rounded-full border border-black/[.08] py-3.5 text-base font-medium transition-colors hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a]"
        >
          返回首页
        </Link>
      </main>
    </div>
  );
}
