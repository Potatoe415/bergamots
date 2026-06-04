import { describe, it, expect } from 'vitest';
import { gridRisk } from './gridFeasibility';
import { emptyGrid } from './gameEngine';
import { Card, GridCell } from './types';

function island(value: number): Card {
  return { id: `island_${value}`, type: 'island', value };
}

function place(grid: GridCell[], pos: number, value: number): GridCell[] {
  return grid.map(c => (c.position === pos ? { ...c, card: island(value) } : c));
}

describe('gridRisk — feasibility of empty segments', () => {
  it('an empty grid is feasible with no risk', () => {
    expect(gridRisk(emptyGrid())).toEqual({ feasible: true, risk: 0 });
  });

  it('detects an unfillable internal segment (42 and 44 with 2 empty cells between)', () => {
    // positions 10 and 13 → 2 empty cells need values strictly in (42,44) = just 43.
    let grid = emptyGrid();
    grid = place(grid, 10, 42);
    grid = place(grid, 13, 44);
    const report = gridRisk(grid);
    expect(report.feasible).toBe(false);
  });

  it('accepts the same pair when the value span leaves room', () => {
    let grid = emptyGrid();
    grid = place(grid, 10, 42);
    grid = place(grid, 13, 46); // span 4 over cell span 3 → slack 1
    expect(gridRisk(grid).feasible).toBe(true);
  });

  it('flags a tight (zero-slack) segment as risky but feasible', () => {
    let grid = emptyGrid();
    grid = place(grid, 10, 42);
    grid = place(grid, 13, 45); // span 3 over cell span 3 → slack 0
    const report = gridRisk(grid);
    expect(report.feasible).toBe(true);
    expect(report.risk).toBeGreaterThan(0);
  });

  it('adjacent cards never create an internal segment', () => {
    let grid = emptyGrid();
    grid = place(grid, 10, 20);
    grid = place(grid, 11, 21);
    expect(gridRisk(grid).feasible).toBe(true);
  });
});
