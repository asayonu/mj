import { RuleSet, tilesToHand } from "mahjong-tile-efficiency";
import type { TileId } from "./tiles";

type UkeireMap = Record<string, number>;

export type DiscardOption = {
  discard: TileId;
  totalUkeire: number;
  shantenAfterDiscard: number;
  ukeire: UkeireMap;
  isReceding: boolean;
};

export type HandAnalysis = {
  shanten: number;
  options: DiscardOption[];
  best: DiscardOption | null;
};

function sumUkeire(map: UkeireMap): number {
  return Object.values(map).reduce((a, b) => a + b, 0);
}

function shantenAfterDiscard(
  tiles: TileId[],
  discard: TileId,
  rule: RuleSet,
): number {
  const remaining = [...tiles];
  const idx = remaining.indexOf(discard);
  if (idx === -1) return 99;
  remaining.splice(idx, 1);
  return rule.calShanten(tilesToHand(remaining));
}

export function analyzeFourteen(tiles: TileId[]): HandAnalysis {
  if (tiles.length !== 14) {
    return { shanten: -1, options: [], best: null };
  }

  const rule = new RuleSet("Riichi");
  const hand = tilesToHand(tiles);
  const raw = rule.calUkeire(hand) as {
    shanten: number;
    normalDiscard?: Record<string, UkeireMap>;
    recedingDiscard?: Record<string, UkeireMap>;
  };

  const options: DiscardOption[] = [];

  for (const [discard, ukeire] of Object.entries(raw.normalDiscard ?? {})) {
    options.push({
      discard: discard as TileId,
      totalUkeire: sumUkeire(ukeire),
      shantenAfterDiscard: shantenAfterDiscard(tiles, discard as TileId, rule),
      ukeire,
      isReceding: false,
    });
  }

  for (const [discard, ukeire] of Object.entries(raw.recedingDiscard ?? {})) {
    options.push({
      discard: discard as TileId,
      totalUkeire: sumUkeire(ukeire),
      shantenAfterDiscard: shantenAfterDiscard(tiles, discard as TileId, rule),
      ukeire,
      isReceding: true,
    });
  }

  options.sort((a, b) => {
    if (b.totalUkeire !== a.totalUkeire) return b.totalUkeire - a.totalUkeire;
    if (a.shantenAfterDiscard !== b.shantenAfterDiscard) {
      return a.shantenAfterDiscard - b.shantenAfterDiscard;
    }
    if (a.isReceding !== b.isReceding) return a.isReceding ? 1 : -1;
    return a.discard.localeCompare(b.discard);
  });

  return {
    shanten: raw.shanten,
    options,
    best: options[0] ?? null,
  };
}

export function formatUkeireList(ukeire: UkeireMap): string {
  return Object.entries(ukeire)
    .map(([t, n]) => `${t}×${n}`)
    .join(" ");
}
