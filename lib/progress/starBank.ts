import type { StarBankAccount, StarBankRedemption } from "@/lib/types/starBank";

/** 1 颗星星 = 0.1 元（1 角） */
export const STARS_PER_YUAN = 10;

export const MAX_REDEMPTIONS = 50;

export function yuanToStars(yuan: number): number {
  return Math.round(yuan * STARS_PER_YUAN);
}

export function starsToYuan(stars: number): number {
  return stars / STARS_PER_YUAN;
}

export function formatYuan(yuan: number): string {
  const rounded = Math.round(yuan * 10) / 10;
  return Number.isInteger(rounded) ? `${rounded}` : rounded.toFixed(1);
}

export function parseYuanInput(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const yuan = Number(trimmed);
  if (!Number.isFinite(yuan) || yuan <= 0) return null;

  const jiao = Math.round(yuan * 10);
  if (jiao <= 0) return null;

  return jiao / 10;
}

export function createEmptyStarBankAccount(): StarBankAccount {
  return {
    redemptions: [],
    totalRedeemedYuan: 0,
    totalRedeemedStars: 0,
    updatedAt: new Date().toISOString(),
  };
}

function sumRedemptions(redemptions: StarBankRedemption[]) {
  let totalRedeemedYuan = 0;
  let totalRedeemedStars = 0;

  for (const item of redemptions) {
    totalRedeemedYuan += item.yuan;
    totalRedeemedStars += item.starsSpent;
  }

  return {
    totalRedeemedYuan: Math.round(totalRedeemedYuan * 10) / 10,
    totalRedeemedStars,
  };
}

export function normalizeStarBankAccount(data: unknown): StarBankAccount {
  const base = createEmptyStarBankAccount();
  if (!data || typeof data !== "object") return base;

  const record = data as Partial<StarBankAccount>;
  const redemptions: StarBankRedemption[] = [];

  if (Array.isArray(record.redemptions)) {
    for (const raw of record.redemptions) {
      if (!raw || typeof raw !== "object") continue;
      const item = raw as Partial<StarBankRedemption>;
      if (
        typeof item.id !== "string" ||
        typeof item.createdAt !== "string" ||
        typeof item.yuan !== "number" ||
        typeof item.starsSpent !== "number"
      ) {
        continue;
      }

      redemptions.push({
        id: item.id,
        createdAt: item.createdAt,
        yuan: Math.round(item.yuan * 10) / 10,
        starsSpent: Math.max(1, Math.floor(item.starsSpent)),
      });
    }
  }

  redemptions.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  const limited = redemptions.slice(0, MAX_REDEMPTIONS);
  const totals = sumRedemptions(limited);

  return {
    redemptions: limited,
    totalRedeemedYuan: totals.totalRedeemedYuan,
    totalRedeemedStars: totals.totalRedeemedStars,
    updatedAt:
      typeof record.updatedAt === "string" ? record.updatedAt : base.updatedAt,
  };
}

export function validateRedeemRequest(
  yuan: number,
  availableStars: number,
): string | null {
  const starsNeeded = yuanToStars(yuan);

  if (starsNeeded <= 0) {
    return "请输入有效的兑换金额";
  }

  if (starsNeeded > availableStars) {
    return `星星不足，还需 ${starsNeeded - availableStars} 颗星星`;
  }

  return null;
}

export function buildRedemption(yuan: number): StarBankRedemption {
  const starsSpent = yuanToStars(yuan);

  return {
    id:
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `redeem_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    createdAt: new Date().toISOString(),
    yuan,
    starsSpent,
  };
}

export function appendRedemption(
  account: StarBankAccount,
  redemption: StarBankRedemption,
): StarBankAccount {
  const redemptions = [redemption, ...account.redemptions].slice(
    0,
    MAX_REDEMPTIONS,
  );
  const totals = sumRedemptions(redemptions);

  return {
    redemptions,
    totalRedeemedYuan: totals.totalRedeemedYuan,
    totalRedeemedStars: totals.totalRedeemedStars,
    updatedAt: new Date().toISOString(),
  };
}

export function mergeStarBankAccounts(
  a: StarBankAccount,
  b: StarBankAccount,
): StarBankAccount {
  const map = new Map<string, StarBankRedemption>();

  for (const item of [...a.redemptions, ...b.redemptions]) {
    const existing = map.get(item.id);
    if (!existing) {
      map.set(item.id, item);
      continue;
    }
    map.set(
      item.id,
      new Date(item.createdAt).getTime() >= new Date(existing.createdAt).getTime()
        ? item
        : existing,
    );
  }

  const redemptions = Array.from(map.values()).sort(
    (x, y) => new Date(y.createdAt).getTime() - new Date(x.createdAt).getTime(),
  );

  const limited = redemptions.slice(0, MAX_REDEMPTIONS);
  const totals = sumRedemptions(limited);

  return {
    redemptions: limited,
    totalRedeemedYuan: totals.totalRedeemedYuan,
    totalRedeemedStars: totals.totalRedeemedStars,
    updatedAt:
      new Date(a.updatedAt).getTime() >= new Date(b.updatedAt).getTime()
        ? a.updatedAt
        : b.updatedAt,
  };
}
