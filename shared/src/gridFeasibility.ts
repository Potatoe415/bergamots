import { Card, GridCell } from './types';

// Analyses whether the empty cells of the grid can still be filled given the
// ascending-order + positional-bound rules. The grid ascends from position 0
// (value > 0) to position 35 (value <= 80). Between two placed islands a run of
// k empty cells needs k strictly increasing integers in the open value
// interval, so the "slack" of a segment is (valueSpan - cellSpan). Negative
// slack means the segment can never be filled — the game is effectively lost.

const MAX_ISLAND = 80;
const LAST_POS = 35;

// Feasibility violations must dominate every other heuristic weight.
export const INFEASIBLE_UNIT = 1_000_000;
const SLACK0_PENALTY = 6000; // exact fit, no margin — risky
const SLACK1_PENALTY = 1500; // almost no margin

export interface FeasibilityReport {
  feasible: boolean;
  risk: number; // higher = closer to an unfillable grid
}

function placedIslands(grid: GridCell[]): { pos: number; value: number }[] {
  const out: { pos: number; value: number }[] = [];
  for (const cell of grid) {
    if (cell.card?.type === 'island') out.push({ pos: cell.position, value: cell.card.value! });
  }
  return out; // grid is ordered by position
}

function slackPenalty(slack: number): number {
  if (slack < 0) return INFEASIBLE_UNIT * (1 - slack); // 1e6, 2e6, 3e6, …
  if (slack === 0) return SLACK0_PENALTY;
  if (slack === 1) return SLACK1_PENALTY;
  return 0;
}

export function gridRisk(grid: GridCell[]): FeasibilityReport {
  const islands = placedIslands(grid);
  if (islands.length === 0) return { feasible: true, risk: 0 };

  const slacks: number[] = [];
  const first = islands[0];
  // Left edge: cells [0 .. p0-1] need p0 increasing values below v0.
  slacks.push(first.value - 1 - first.pos);
  // Internal segments between consecutive islands.
  for (let i = 0; i + 1 < islands.length; i++) {
    const a = islands[i];
    const b = islands[i + 1];
    slacks.push((b.value - a.value) - (b.pos - a.pos));
  }
  // Right edge: cells [pL+1 .. 35] need values above vL up to 80.
  const last = islands[islands.length - 1];
  slacks.push((MAX_ISLAND - last.value) - (LAST_POS - last.pos));

  let risk = 0;
  let feasible = true;
  for (const slack of slacks) {
    if (slack < 0) feasible = false;
    risk += slackPenalty(slack);
  }
  return { feasible, risk };
}

export function gridWithCard(grid: GridCell[], pos: number, card: Card): GridCell[] {
  return grid.map(c => (c.position === pos ? { ...c, card } : c));
}

export function gridWithoutCard(grid: GridCell[], pos: number): GridCell[] {
  return grid.map(c => (c.position === pos ? { ...c, card: null } : c));
}
