"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { GROWTH_UPDATED_EVENT } from "@/lib/progress/growthEvents";
import { loadLevelProgress } from "@/lib/progress/growthStorage";
import { STUDENT_DATA_UPDATED_EVENT } from "@/lib/progress/studentDataEvents";
import {
  formatRedemptionTime,
  formatYuan,
  parseYuanInput,
  starsToYuan,
  STARS_PER_YUAN,
  yuanToStars,
} from "@/lib/progress/starBank";
import {
  loadStarBankAccount,
  redeemStarsForYuan,
} from "@/lib/progress/starBankStorage";
import type { LevelProgress } from "@/lib/types/growth";
import type { StarBankAccount } from "@/lib/types/starBank";

export function StarBankPageContent() {
  const [levelProgress, setLevelProgress] = useState<LevelProgress | null>(
    null,
  );
  const [account, setAccount] = useState<StarBankAccount | null>(null);
  const [yuanInput, setYuanInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showAllRedemptions, setShowAllRedemptions] = useState(false);

  const refresh = () => {
    setLevelProgress(loadLevelProgress());
    setAccount(loadStarBankAccount());
  };

  useEffect(() => {
    refresh();
    window.addEventListener(GROWTH_UPDATED_EVENT, refresh);
    window.addEventListener(STUDENT_DATA_UPDATED_EVENT, refresh);
    return () => {
      window.removeEventListener(GROWTH_UPDATED_EVENT, refresh);
      window.removeEventListener(STUDENT_DATA_UPDATED_EVENT, refresh);
    };
  }, []);

  const parsedYuan = useMemo(() => parseYuanInput(yuanInput), [yuanInput]);
  const starsNeeded = parsedYuan ? yuanToStars(parsedYuan) : 0;
  const maxYuan = levelProgress ? starsToYuan(levelProgress.balanceStars) : 0;
  const visibleRedemptions = useMemo(() => {
    if (!account) return [];
    if (showAllRedemptions) return account.redemptions;
    return account.redemptions.slice(0, 5);
  }, [account, showAllRedemptions]);
  const hasMoreRedemptions = (account?.redemptions.length ?? 0) > 5;

  const handleRedeem = () => {
    setError(null);
    setSuccess(null);

    if (!parsedYuan) {
      setError("请输入有效的兑换金额（最少 0.1 元）");
      return;
    }

    setSubmitting(true);
    const result = redeemStarsForYuan(parsedYuan);
    setSubmitting(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setYuanInput("");
    refresh();
    setSuccess(
      `兑换成功！获得 ${formatYuan(result.redemption.yuan)} 元，消耗 ${result.redemption.starsSpent} 颗星星，剩余 ${result.starsRemaining} 颗 ⭐`,
    );
  };

  if (!levelProgress || !account) {
    return (
      <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
        <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-6 py-12">
          <p className="text-zinc-600 dark:text-zinc-400">加载星星银行…</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-6 py-8">
        <header className="mb-6">
          <Link
            href="/"
            className="mb-4 inline-flex text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            ← 返回首页
          </Link>
          <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
            星星银行
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            1 颗星星 = 0.1 元 · 10 颗星星 = 1 元
          </p>
        </header>

        <section className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-5 dark:border-amber-900 dark:bg-amber-950/30">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
            当前星星
          </p>
          <p className="mt-2 text-4xl font-bold text-amber-600 dark:text-amber-400">
            ⭐ {levelProgress.balanceStars}
          </p>
          <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">
            最多可兑换 {formatYuan(maxYuan)} 元 · Lv.{levelProgress.level}{" "}
            {levelProgress.title}
            <span className="text-amber-600/80 dark:text-amber-400/80">
              {" "}
              · 累计获得 {levelProgress.lifetimeStars} 星
            </span>
          </p>
          {account.totalRedeemedYuan > 0 && (
            <p className="mt-1 text-xs text-amber-600/80 dark:text-amber-400/80">
              已累计兑换 {formatYuan(account.totalRedeemedYuan)} 元（
              {account.totalRedeemedStars} 颗星星）
            </p>
          )}
        </section>

        <section className="mb-6 rounded-2xl border border-black/[.08] bg-white px-5 py-5 dark:border-white/[.145] dark:bg-zinc-900">
          <label
            htmlFor="redeem-yuan"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            兑换金额（元）
          </label>
          <div className="mt-3 flex items-center gap-2">
            <input
              id="redeem-yuan"
              type="number"
              inputMode="decimal"
              min="0.1"
              step="0.1"
              placeholder="例如 1.5"
              value={yuanInput}
              onChange={(event) => {
                setYuanInput(event.target.value);
                setError(null);
                setSuccess(null);
              }}
              className="w-full rounded-xl border border-black/[.08] bg-zinc-50 px-4 py-3 text-lg font-medium text-black outline-none transition-colors focus:border-amber-400 dark:border-white/[.145] dark:bg-zinc-800 dark:text-zinc-50"
            />
            <span className="shrink-0 text-sm text-zinc-500 dark:text-zinc-400">
              元
            </span>
          </div>

          {parsedYuan && (
            <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
              将消耗{" "}
              <span className="font-semibold text-amber-600 dark:text-amber-400">
                {starsNeeded}
              </span>{" "}
              颗星星（{formatYuan(parsedYuan)} 元 × {STARS_PER_YUAN} 星/元）
            </p>
          )}

          <button
            type="button"
            onClick={handleRedeem}
            disabled={submitting || !parsedYuan || starsNeeded > levelProgress.balanceStars}
            className="mt-5 w-full rounded-full bg-foreground py-3.5 text-base font-semibold text-background transition-colors hover:bg-[#383838] disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-[#ccc]"
          >
            {submitting ? "兑换中…" : "确认兑换"}
          </button>

          {error && (
            <p className="mt-3 text-sm text-red-500 dark:text-red-400">{error}</p>
          )}
          {success && (
            <p className="mt-3 text-sm text-green-600 dark:text-green-400">
              {success}
            </p>
          )}
        </section>

        <section className="rounded-2xl border border-black/[.08] bg-white px-5 py-5 dark:border-white/[.145] dark:bg-zinc-900">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-black dark:text-zinc-50">
                兑换记录
              </h2>
              {account.redemptions.length > 0 ? (
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  共 {account.redemptions.length} 笔 · 累计{" "}
                  {formatYuan(account.totalRedeemedYuan)} 元 ·{" "}
                  {account.totalRedeemedStars} 颗星星
                </p>
              ) : (
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  还没有兑换记录
                </p>
              )}
            </div>
          </div>

          {account.redemptions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-200 px-4 py-8 text-center dark:border-zinc-700">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                完成练习赚取星星后，可以在这里兑换奖励
              </p>
            </div>
          ) : (
            <>
              <ul className="space-y-2">
                {visibleRedemptions.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between gap-3 rounded-xl bg-zinc-50 px-4 py-3 dark:bg-zinc-800/60"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-black dark:text-zinc-50">
                        兑换 {formatYuan(item.yuan)} 元
                      </p>
                      <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                        消耗 {item.starsSpent} 颗星星
                      </p>
                    </div>
                    <time
                      dateTime={item.createdAt}
                      className="shrink-0 text-xs text-zinc-400 dark:text-zinc-500"
                    >
                      {formatRedemptionTime(item.createdAt)}
                    </time>
                  </li>
                ))}
              </ul>

              {hasMoreRedemptions && (
                <button
                  type="button"
                  onClick={() => setShowAllRedemptions((prev) => !prev)}
                  className="mt-3 w-full rounded-xl py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-800/60"
                >
                  {showAllRedemptions
                    ? "收起记录"
                    : `查看全部 ${account.redemptions.length} 笔记录`}
                </button>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
}
