import { spendStars } from "@/lib/progress/growth";
import { loadGrowth, saveGrowth } from "@/lib/progress/growthStorage";
import { scheduleStudentDataPush, syncStudentDataNow } from "@/lib/progress/studentDataPush";
import {
  appendRedemption,
  buildRedemption,
  createEmptyStarBankAccount,
  normalizeStarBankAccount,
  validateRedeemRequest,
} from "@/lib/progress/starBank";
import type { StarBankAccount, StarBankRedeemResult } from "@/lib/types/starBank";

const STORAGE_KEY = "mathhero-star-bank";

function readRaw(): StarBankAccount {
  if (typeof window === "undefined") return createEmptyStarBankAccount();

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createEmptyStarBankAccount();
    return normalizeStarBankAccount(JSON.parse(raw));
  } catch {
    return createEmptyStarBankAccount();
  }
}

function writeRaw(account: StarBankAccount): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(account));
}

export function loadStarBankAccount(): StarBankAccount {
  return readRaw();
}

export function saveStarBankAccount(account: StarBankAccount): void {
  writeRaw(normalizeStarBankAccount(account));
  scheduleStudentDataPush();
}

export function clearStarBankRedemptions(): StarBankAccount {
  const account = createEmptyStarBankAccount();
  writeRaw(account);
  scheduleStudentDataPush();
  syncStudentDataNow();
  return account;
}

export function redeemStarsForYuan(yuan: number): StarBankRedeemResult {
  const growth = loadGrowth();
  const error = validateRedeemRequest(yuan, growth.totalStars);
  if (error) {
    return { ok: false, error };
  }

  const redemption = buildRedemption(yuan);
  const afterGrowth = spendStars(growth, redemption.starsSpent);
  if (!afterGrowth) {
    return { ok: false, error: "星星不足，无法兑换" };
  }

  const account = appendRedemption(readRaw(), redemption);
  saveGrowth(afterGrowth);
  saveStarBankAccount(account);
  syncStudentDataNow();

  return {
    ok: true,
    redemption,
    starsRemaining: afterGrowth.totalStars,
  };
}
