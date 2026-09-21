export type PrizeBand = "all" | "under_1" | "1_to_5" | "over_5";

export function inPrizeBand(amountUsdc: number, band: PrizeBand): boolean {
  if (band === "all") return true;
  // Bậc rỗng hoặc không có gì trả về false, không undefined
  if (typeof amountUsdc !== "number" || isNaN(amountUsdc)) return false;

  if (band === "under_1") return amountUsdc < 1;
  // Biên 1 và 5 thuộc bậc giữa
  if (band === "1_to_5") return amountUsdc >= 1 && amountUsdc <= 5;
  if (band === "over_5") return amountUsdc > 5;

  return false;
}
