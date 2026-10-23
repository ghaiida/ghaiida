// Maze generation for the maze template: a perfect maze (one route between any two cells),
// its solution route, and evenly spaced checkpoints along that route.
import type { Rng } from './engine.ts';

export interface Maze {
  cols: number;
  rows: number;
  // openE[i] / openS[i]: passage from cell i to its east / south neighbour.
  openE: boolean[];
  openS: boolean[];
  path: number[]; // cell indices from start to exit
  checkpoints: number[]; // indices into `path`
}

export function generateMaze(questionCount: number, rng: Rng): Maze {
  let size = Math.min(25, Math.max(7, Math.ceil(Math.sqrt(questionCount * 6))));
  for (let attempt = 0; ; attempt++) {
    const m = build(size, size, rng);
    if (m.path.length - 2 >= questionCount) return { ...m, checkpoints: spread(m.path.length, questionCount) };
    if (attempt % 5 === 4) size = Math.min(size + 2, 41);
  }
}

function build(cols: number, rows: number, rng: Rng): Omit<Maze, 'checkpoints'> {
  const n = cols * rows;
  const openE = new Array<boolean>(n).fill(false);
  const openS = new Array<boolean>(n).fill(false);
  const seen = new Array<boolean>(n).fill(false);
  const start = cols - 1; // top-right: where an Arabic reader starts
  const exit = (rows - 1) * cols; // bottom-left
  const stack = [start];
  seen[start] = true;
  while (stack.length) {
    const c = stack[stack.length - 1];
    const x = c % cols;
    const y = Math.floor(c / cols);
    const next: number[] = [];
    if (x > 0 && !seen[c - 1]) next.push(c - 1);
    if (x < cols - 1 && !seen[c + 1]) next.push(c + 1);
    if (y > 0 && !seen[c - cols]) next.push(c - cols);
    if (y < rows - 1 && !seen[c + cols]) next.push(c + cols);
    if (!next.length) {
      stack.pop();
      continue;
    }
    const nb = next[Math.floor(rng() * next.length)];
    if (nb === c + 1) openE[c] = true;
    else if (nb === c - 1) openE[nb] = true;
    else if (nb === c + cols) openS[c] = true;
    else openS[nb] = true;
    seen[nb] = true;
    stack.push(nb);
  }
  return { cols, rows, openE, openS, path: solve(cols, rows, openE, openS, start, exit) };
}

export function neighbours(m: Pick<Maze, 'cols' | 'rows' | 'openE' | 'openS'>, c: number): number[] {
  const out: number[] = [];
  const x = c % m.cols;
  if (m.openE[c]) out.push(c + 1);
  if (x > 0 && m.openE[c - 1]) out.push(c - 1);
  if (m.openS[c]) out.push(c + m.cols);
  if (c >= m.cols && m.openS[c - m.cols]) out.push(c - m.cols);
  return out;
}

function solve(cols: number, rows: number, openE: boolean[], openS: boolean[], start: number, exit: number): number[] {
  const prev = new Map<number, number>([[start, -1]]);
  const queue = [start];
  while (queue.length) {
    const c = queue.shift()!;
    if (c === exit) break;
    for (const nb of neighbours({ cols, rows, openE, openS }, c))
      if (!prev.has(nb)) {
        prev.set(nb, c);
        queue.push(nb);
      }
  }
  const path: number[] = [];
  for (let c = exit; c !== -1; c = prev.get(c)!) path.unshift(c);
  return path;
}

// Spreads k checkpoints along a route of `len` cells, never on the start or exit cell.
export function spread(len: number, k: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < k; i++) {
    let p = Math.round(((i + 1) * (len - 1)) / (k + 1));
    if (out.length && p <= out[out.length - 1]) p = out[out.length - 1] + 1;
    out.push(Math.min(p, len - 2));
  }
  return out;
}
