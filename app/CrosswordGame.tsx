"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { Puzzle } from "./page";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Cell { row: number; col: number; }
type Direction = "across" | "down";
interface ActiveClue { direction: Direction; number: number; }

interface Stats {
  streak: number;
  lastSolvedDate: string | null; // "YYYY-MM-DD"
  totalSolved: number;
  bestTime: number | null; // seconds
  todaySolveTime: number | null; // seconds — set once per day
}

const STATS_KEY = "kt-crossword-stats";

function loadStats(): Stats {
  if (typeof window === "undefined") return { streak: 0, lastSolvedDate: null, totalSolved: 0, bestTime: null, todaySolveTime: null };
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (!raw) return { streak: 0, lastSolvedDate: null, totalSolved: 0, bestTime: null, todaySolveTime: null };
    return JSON.parse(raw) as Stats;
  } catch { return { streak: 0, lastSolvedDate: null, totalSolved: 0, bestTime: null, todaySolveTime: null }; }
}

function saveStats(s: Stats) {
  try { localStorage.setItem(STATS_KEY, JSON.stringify(s)); } catch {}
}

function toDateStr(d: Date) {
  return d.toISOString().split("T")[0];
}

function prevDay(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() - 1);
  return toDateStr(d);
}

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function clueCells(puzzle: Puzzle, direction: Direction, number: number): Cell[] {
  const entries = direction === "across" ? puzzle.across : puzzle.down;
  const entry = entries.find((e) => e.number === number);
  if (!entry) return [];
  return Array.from({ length: entry.answer.length }, (_, i) =>
    direction === "across"
      ? { row: entry.row, col: entry.col + i }
      : { row: entry.row + i, col: entry.col }
  );
}

function cluesForCell(puzzle: Puzzle, row: number, col: number): ActiveClue[] {
  const result: ActiveClue[] = [];
  for (const entry of puzzle.across)
    for (let i = 0; i < entry.answer.length; i++)
      if (entry.row === row && entry.col + i === col)
        result.push({ direction: "across", number: entry.number });
  for (const entry of puzzle.down)
    for (let i = 0; i < entry.answer.length; i++)
      if (entry.row + i === row && entry.col === col)
        result.push({ direction: "down", number: entry.number });
  return result;
}

function cellNumber(puzzle: Puzzle, row: number, col: number): number | null {
  for (const e of [...puzzle.across, ...puzzle.down])
    if (e.row === row && e.col === col) return e.number;
  return null;
}

// ── Stats panel ───────────────────────────────────────────────────────────────
function StatsPanel({ stats, elapsed, solved }: { stats: Stats; elapsed: number; solved: boolean }) {
  const displayTime = solved ? (stats.todaySolveTime ?? elapsed) : elapsed;
  return (
    <div className="w-full max-w-md grid grid-cols-3 gap-3 text-center">
      {[
        { label: "Streak", value: `${stats.streak}🔥` },
        { label: "Solved", value: stats.totalSolved },
        { label: solved ? "Time" : "Timer", value: formatTime(displayTime) },
      ].map(({ label, value }) => (
        <div key={label} className="bg-white/70 rounded-xl py-3 shadow-sm">
          <p className="text-xl font-bold text-stone-900">{value}</p>
          <p className="text-[10px] uppercase tracking-widest text-stone-400 mt-0.5">{label}</p>
        </div>
      ))}
      {stats.bestTime !== null && (
        <div className="col-span-3 text-xs text-stone-400 text-center -mt-1">
          Best time: {formatTime(stats.bestTime)}
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function CrosswordGame({ puzzle }: { puzzle: Puzzle }) {
  const ROWS = puzzle.size ?? 12;
  const COLS = puzzle.size ?? 12;

  const [letters, setLetters] = useState<string[][]>(
    Array.from({ length: ROWS }, () => Array(COLS).fill(""))
  );
  const [selected, setSelected] = useState<Cell | null>(null);
  const [active, setActive] = useState<ActiveClue | null>(null);
  const [checked, setChecked] = useState(false);
  const [solved, setSolved] = useState(false);
  const [stats, setStats] = useState<Stats>(() => loadStats());
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Start timer on first keypress / cell click
  const ensureTimer = useCallback(() => {
    if (startRef.current !== null || solved) return;
    startRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current!) / 1000));
    }, 1000);
  }, [solved]);

  // Stop timer when solved
  useEffect(() => {
    if (solved && timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, [solved]);

  // Cleanup on unmount
  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  // Focus hidden input when a cell is selected
  useEffect(() => { if (selected) inputRef.current?.focus(); }, [selected]);

  const isBlack = (row: number, col: number) => puzzle.grid[row]?.[col] === "#";

  const isInActiveClue = useCallback(
    (row: number, col: number) => {
      if (!active) return false;
      return clueCells(puzzle, active.direction, active.number).some(
        (c) => c.row === row && c.col === col
      );
    },
    [active, puzzle]
  );

  const handleCellClick = (row: number, col: number) => {
    if (isBlack(row, col)) return;
    ensureTimer();
    if (selected?.row === row && selected?.col === col) {
      const clues = cluesForCell(puzzle, row, col);
      if (clues.length > 1 && active) {
        const other = clues.find(
          (c) => c.direction !== active.direction || c.number !== active.number
        );
        if (other) setActive(other);
      }
      return;
    }
    setSelected({ row, col });
    const clues = cluesForCell(puzzle, row, col);
    if (clues.length > 0) {
      const same = active ? clues.find((c) => c.direction === active.direction) : null;
      setActive(same || clues[0]);
    }
  };

  const advanceCursor = useCallback(
    (row: number, col: number) => {
      if (!active) return;
      const cells = clueCells(puzzle, active.direction, active.number);
      const idx = cells.findIndex((c) => c.row === row && c.col === col);
      if (idx < cells.length - 1) setSelected(cells[idx + 1]);
    },
    [active, puzzle]
  );

  const retreatCursor = useCallback(
    (row: number, col: number) => {
      if (!active) return;
      const cells = clueCells(puzzle, active.direction, active.number);
      const idx = cells.findIndex((c) => c.row === row && c.col === col);
      if (idx > 0) setSelected(cells[idx - 1]);
    },
    [active, puzzle]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!selected) return;
    const { row, col } = selected;
    if (e.key === "Backspace") {
      e.preventDefault();
      if (letters[row][col]) {
        setLetters((prev) => { const n = prev.map((r) => [...r]); n[row][col] = ""; return n; });
      } else { retreatCursor(row, col); }
      return;
    }
    if (e.key === "ArrowRight") { e.preventDefault(); const c = cluesForCell(puzzle, row, col).find((c) => c.direction === "across"); if (c) setActive(c); return; }
    if (e.key === "ArrowDown")  { e.preventDefault(); const c = cluesForCell(puzzle, row, col).find((c) => c.direction === "down");   if (c) setActive(c); return; }
    if (e.key === "ArrowLeft")  { e.preventDefault(); const c = cluesForCell(puzzle, row, col).find((c) => c.direction === "across"); if (c) { setActive(c); retreatCursor(row, col); } return; }
    if (e.key === "ArrowUp")    { e.preventDefault(); const c = cluesForCell(puzzle, row, col).find((c) => c.direction === "down");   if (c) { setActive(c); retreatCursor(row, col); } return; }
    if (/^[a-zA-Z]$/.test(e.key)) {
      e.preventDefault();
      ensureTimer();
      setLetters((prev) => { const n = prev.map((r) => [...r]); n[row][col] = e.key.toUpperCase(); return n; });
      setChecked(false);
      advanceCursor(row, col);
    }
  };

  const markSolved = useCallback(() => {
    if (solved) return;
    setSolved(true);
    const solveTime = startRef.current ? Math.floor((Date.now() - startRef.current) / 1000) : elapsed;
    const today = toDateStr(new Date());
    setStats((prev) => {
      const alreadySolvedToday = prev.lastSolvedDate === today;
      if (alreadySolvedToday) return prev; // don't double-count
      const newStreak =
        prev.lastSolvedDate === prevDay(today) ? prev.streak + 1 : 1;
      const next: Stats = {
        streak: newStreak,
        lastSolvedDate: today,
        totalSolved: prev.totalSolved + 1,
        bestTime: prev.bestTime === null ? solveTime : Math.min(prev.bestTime, solveTime),
        todaySolveTime: solveTime,
      };
      saveStats(next);
      return next;
    });
  }, [solved, elapsed]);

  const checkAnswers = () => {
    setChecked(true);
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++)
        if (!isBlack(r, c) && letters[r][c] !== puzzle.grid[r][c]) return;
    markSolved();
  };

  // Auto-check after every letter
  useEffect(() => {
    let allFilled = true;
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++)
        if (!isBlack(r, c) && !letters[r][c]) { allFilled = false; break; }
    if (!allFilled || solved) return;
    let allCorrect = true;
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++)
        if (!isBlack(r, c) && letters[r][c] !== puzzle.grid[r][c]) { allCorrect = false; break; }
    if (allCorrect) { setChecked(true); markSolved(); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [letters]);

  const reset = () => {
    setLetters(Array.from({ length: ROWS }, () => Array(COLS).fill("")));
    setChecked(false);
    setSolved(false);
    setSelected(null);
    setActive(null);
    setElapsed(0);
    startRef.current = null;
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  };

  const cellCorrect = (row: number, col: number) => {
    if (!checked || isBlack(row, col)) return null;
    return letters[row][col] === puzzle.grid[row][col];
  };

  const activeEntry = active
    ? (active.direction === "across" ? puzzle.across : puzzle.down).find(
        (e) => e.number === active.number
      )
    : null;

  return (
    <div className="flex flex-col items-center gap-5 w-full max-w-md">
      {/* Stats */}
      <StatsPanel stats={stats} elapsed={elapsed} solved={solved} />

      {/* Solved banner */}
      {solved && (
        <div className="bg-green-700 text-white rounded-xl px-6 py-3 text-center font-semibold shadow w-full">
          🎉 Solved! Pure NW5.
        </div>
      )}

      {/* Active clue */}
      <div className="min-h-[48px] text-center px-2">
        {activeEntry ? (
          <p className="text-stone-700 text-sm leading-snug">
            <span className="font-bold text-stone-900">
              {activeEntry.number} {active?.direction === "across" ? "Across" : "Down"}
            </span>
            {" — "}
            {activeEntry.clue}
          </p>
        ) : (
          <p className="text-stone-400 text-sm">Click a square to start</p>
        )}
      </div>

      {/* Grid */}
      <div
        className="grid gap-[2px] bg-stone-300 p-[2px] rounded-md shadow-md select-none"
        style={{ gridTemplateColumns: `repeat(${COLS}, 44px)` }}
        onKeyDown={handleKeyDown}
        tabIndex={0}
      >
        {Array.from({ length: ROWS }, (_, r) =>
          Array.from({ length: COLS }, (_, c) => {
            const black = isBlack(r, c);
            const isSelected = selected?.row === r && selected?.col === c;
            const inClue = isInActiveClue(r, c);
            const num = cellNumber(puzzle, r, c);
            const correct = cellCorrect(r, c);
            return (
              <div
                key={`${r}-${c}`}
                className={[
                  "relative w-[44px] h-[44px] flex items-center justify-center cursor-pointer",
                  black ? "bg-stone-500"
                    : isSelected ? "bg-yellow-300"
                    : inClue ? "bg-amber-50"
                    : "bg-white",
                  !black && "border border-stone-200",
                ].join(" ")}
                onClick={() => handleCellClick(r, c)}
              >
                {!black && (
                  <>
                    {num && (
                      <span className="absolute top-[2px] left-[3px] text-[10px] font-bold text-stone-700 leading-none">
                        {num}
                      </span>
                    )}
                    <span
                      className={[
                        "text-xl font-bold",
                        correct === true ? "text-green-700"
                          : correct === false ? "text-red-600"
                          : "text-stone-900",
                      ].join(" ")}
                    >
                      {letters[r][c]}
                    </span>
                  </>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Hidden input for mobile keyboard */}
      <input ref={inputRef} className="opacity-0 absolute -top-10 w-1 h-1" readOnly onKeyDown={handleKeyDown} />

      {/* Buttons */}
      <div className="flex gap-3">
        <button onClick={checkAnswers} className="px-4 py-2 bg-stone-800 text-white text-sm rounded-lg hover:bg-stone-700 transition">
          Check
        </button>
        <button onClick={reset} className="px-4 py-2 bg-stone-200 text-stone-700 text-sm rounded-lg hover:bg-stone-300 transition">
          Reset
        </button>
      </div>

      {/* Clue lists */}
      <div className="w-full grid grid-cols-2 gap-6 mt-2">
        <ClueList title="Across" entries={puzzle.across} activeDirection={active?.direction} activeNumber={active?.number}
          onClick={(n) => { setActive({ direction: "across", number: n }); const cells = clueCells(puzzle, "across", n); if (cells.length > 0) setSelected(cells[0]); }}
        />
        <ClueList title="Down" entries={puzzle.down} activeDirection={active?.direction} activeNumber={active?.number}
          onClick={(n) => { setActive({ direction: "down", number: n }); const cells = clueCells(puzzle, "down", n); if (cells.length > 0) setSelected(cells[0]); }}
        />
      </div>
    </div>
  );
}

function ClueList({ title, entries, activeDirection, activeNumber, onClick }: {
  title: string;
  entries: { number: number; clue: string }[];
  activeDirection?: string;
  activeNumber?: number;
  onClick: (n: number) => void;
}) {
  const dir = title.toLowerCase() as Direction;
  return (
    <div>
      <h2 className="font-bold text-stone-800 text-sm mb-2 uppercase tracking-wide">{title}</h2>
      <ul className="space-y-2">
        {entries.map((e) => (
          <li
            key={e.number}
            className={[
              "text-xs leading-snug cursor-pointer rounded px-1 py-0.5 transition",
              activeDirection === dir && activeNumber === e.number
                ? "bg-yellow-200 font-semibold text-stone-900"
                : "text-stone-600 hover:text-stone-900",
            ].join(" ")}
            onClick={() => onClick(e.number)}
          >
            <span className="font-bold mr-1">{e.number}.</span>
            {e.clue}
          </li>
        ))}
      </ul>
    </div>
  );
}
