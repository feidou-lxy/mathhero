export const GROWTH_UPDATED_EVENT = "mathhero-growth-updated";

export function notifyGrowthUpdated(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(GROWTH_UPDATED_EVENT));
}
