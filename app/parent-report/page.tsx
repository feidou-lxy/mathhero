import { Suspense } from "react";
import { ParentReportPageContent } from "@/app/_components/parent-report/ParentReportPageContent";

function ParentReportFallback() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-6 py-16 dark:bg-black">
      <p className="text-zinc-600 dark:text-zinc-400">报告加载中…</p>
    </div>
  );
}

export default function ParentReportPage() {
  return (
    <Suspense fallback={<ParentReportFallback />}>
      <ParentReportPageContent />
    </Suspense>
  );
}
