// 理解度ごとの有利対面倍率
// 1〜5 の理解度（priority）に対応するスコア倍率
export const PRIORITY_MULTIPLIERS: Record<number, number> = {
  5: 1.5,
  4: 1.2,
  3: 1.0,
  2: 0.8,
  1: 0.5,
}
