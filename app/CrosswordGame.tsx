"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { Puzzle } from "./page";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Cell {
  row: number;
  col: number;
}

type Direction = "across" | "down";

interface ActiveClue {
  direction: Direction;
  number: number;
}

// ── Helper: which cells belong to each clue ───────────────────────────────────
function clueCells(
  puzzle: Puzzle,
  direction: Direction,
  number: number
): Cell[] {
  const entries = direction === "across" ? puzzle.across : puzzle.down;
  const entry = entries.find((e) => e.number === number);
  if (!entry) return [];
  const cells: Cell[] = [];
  for (let i = 0; i < entry.answer.length; i++) {
    if (direction === "across") cells.push({ row: entry.row, col: entry.col + i });
    else cells.push({ row: entry.row + i, col: entry.col });
  }
  return cells;
}

// ── Helper: which clues pass through a cell ───────────────────────────────────
function cluesForCell(puzzle: Puzzle, row: number, col: number): ActiveClue[] {
  const result: ActiveClue[] = [];
  for (const entry of puzzle.across) {
    for (let i = 0; i < entry.answer.length; i++) {
      if (entry.row === row && entry.col + i === col) {
        result.push({ direction: "across", number: entry.number });
      }
    }
  }
  for (const entry of puzzle.down) {
    for (let i = 0; i < entry.answer.length; i++) {
      if (entry.row + i === row && entry.col === col) {
        result.push({ direction: "down", number: entry.number });
      }
    }
  }
  return result;
}

// ── Helper: cell number label ─────────────────────────────────────────────────
function cellNumber(puzzle: Puzzle, row: number, col: number): number | null {
  for (const e of [...puzzle.across, ...puzzle.down]) {
    if (e.row === row && e.col === col) return e.number;
  }
  return null;
}

// ── Main component ────────────────────────────────────────────────────────────
export default function CrosswordGame({ puzzle }: { puzzle: Puzzle }) {
  const ROWS = 5;
  const COLS = 5;

  const [letters, setLetters] = useState<string[][]>(
    Array.from({ length: ROWS }, () => Array(COLS).fill(""))
  );
  const [selected, setSelected] = useState<Cell | null>(null);
  const [active, setActive] = useState<ActiveClue | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [checked, setChecked] = useState(false);
  const [solved, setSolved] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus hidden input when a cell is selected
  useEffect(() => {
    if (selected) inputRef.current?.focus();
  }, [selected]);

  const isBlack = (row: number, col: number) =>
    puzzle.grid[row]?.[col] === "#";

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
    if (selected?.row === row && selected?.col === col) {
      // Toggle direction
      const clues = cluesForCell(puzzle, row, col);
      if (clues.length > 1 && active) {
        const other = clues.find(
          (c) =>
            c.direction !== active.direction || c.number !== active.number
        );
        if (other) setActive(other);
      }
      return;
    }
    setSelected({ row, col });
    const clues = cluesForCell(puzzle, row, col);
    if (clues.length > 0) {
      // Prefer the current direction if available
      const same = active
        ? clues.find((c) => c.direction === active.direction)
        : null;
      setActive(same || clues[0]);
    }
  };

  const advanceCursor = useCallback(
    (row: number, col: number) => {
      if (!active) return;
      const cells = clueCells(puzzle, active.direction, active.number);
      const idx = cells.findIndex((c) => c.row === row && c.col === col);
      if (idx < cells.length - 1) {
        setSelected(cells[idx + 1]);
      }
    },
    [active, puzzle]
  );

  const retreatCursor = useCallback(
    (row: number, col: number) => {
      if (!active) return;
      const cells = clueCells(puzzle, active.direction, active.number);
      const idx = cells.findIndex((c) => c.row === row && c.col === col);
      if (idx > 0) {
        setSelected(cells[idx - 1]);
      }
    },
    [active, puzzle]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!selected) return;
    const { row, col } = selected;

    if (e.key === "Backspace") {
      e.preventDefault();
      const cur = letters[row][col];
      if (cur) {
        setLetters((prev) => {
          const next = prev.map((r) => [...r]);
          next[row][col] = "";
          return next;
        });
      } else {
        retreatCursor(row, col);
      }
      return;
    }

    if (e.key === "ArrowRight") {
      e.preventDefault();
      const clues = cluesForCell(puzzle, row, col);
      const across = clues.find((c) => c.direction === "across");
      if (across) setActive(across);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const clues = cluesForCell(puzzle, row, col);
      const down = clues.find((c) => c.direction === "down");
      if (down) setActive(down);
      return;
    }
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      const clues = cluesForCell(puzzle, row, col);
      const across = clues.find((c) => c.direction === "across");
      if (across) {
        setActive(across);
        retreatCursor(row, col);
      }
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      const clues = cluesForCell(puzzle, row, col);
      const down = clues.find((c) => c.direction === "down");
      if (down) {
        setActive(down);
        retreatCursor(row, col);
      }
      return;
    }

    if (/^[a-zA-Z]$/.test(e.key)) {
      e.preventDefault();
      const letter = e.key.toUpperCase();
      setLetters((prev) => {
        const next = prev.map((r) => [...r]);
        next[row][col] = letter;
        return next;
      });
      setChecked(false);
      advanceCursor(row, col);
    }
  };

  const checkAnswers = () => {
    setChecked(true);
    // Check if complete and correct
    let allCorrect = true;
    for (const entry of [...puzzle.across, ...puzzle.down]) {
      const cells = clueCells(
        puzzle,
        entry.number <= puzzle.across.length ? "across" : "down",
        entry.number
      );
    }
    // Simpler: check every non-black cell
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (!isBlack(r, c)) {
          if (letters[r][c] !== puzzle.grid[r][c]) {
            allCorrect = false;
          }
        }
      }
    }
    if (allCorrect) setSolved(true);
  };

  const revealAll = () => {
    setLetters(puzzle.grid.map((row) => [...row]));
    setRevealed(true);
    setSolved(true);
  };

  const reset = () => {
    setLetters(Array.from({ length: ROWS }, () => Array(COLS).fill("")));
    setRevealed(false);
    setChecked(false);
    setSolved(false);
    setSelected(null);
    setActive(null);
  };

  const cellCorrect = (row: number, col: number) => {
    if (!checked || isBlack(row, col)) return null;
    return letters[row][col] === puzzle.grid[row][col];
  };

  const activeEntries = active
    ? (active.direction === "across" ? puzzle.across : puzzle.down).filter(
        (e) => e.number === active.number
      )
    : [];
  const activeEntry = activeEntries[0];

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-md">
      {/* Solved banner */}
      {solved && (
        <div className="bg-green-700 text-white rounded-xl px-6 py-3 text-center font-semibold shadow">
          🎉 Solved! Nice one.
        </div>
      )}

      {/* Active clue */}
      <div className="min-h-[52px] text-center">
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
        className="grid gap-[3px] bg-stone-800 p-[3px] rounded-md shadow-lg select-none"
        style={{ gridTemplateColumns: `repeat(${COLS}, 60px)` }}
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
                  "relative w-[60px] h-[60px] flex items-center justify-center cursor-pointer",
                  black
                    ? "bg-stone-900"
                    : isSelected
                    ? "bg-yellow-300"
                    : inClue
                    ? "bg-blue-100"
                    : "bg-white",
                  !black && "border border-stone-300",
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
                        correct === true
                          ? "text-green-700"
                          : correct === false
                          ? "text-red-600"
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
      <input
        ref={inputRef}
        className="opacity-0 absolute -top-10 w-1 h-1"
        readOnly
        onKeyDown={handleKeyDown}
      />

      {/* Buttons */}
      <div className="flex gap-3">
        <button
          onClick={checkAnswers}
          className="px-4 py-2 bg-stone-800 text-white text-sm rounded-lg hover:bg-stone-700 transition"
        >
          Check
        </button>
        <button
          onClick={revealAll}
          className="px-4 py-2 bg-stone-200 text-stone-700 text-sm rounded-lg hover:bg-stone-300 transition"
        >
          Reveal
        </button>
        <button
          onClick={reset}
          className="px-4 py-2 bg-stone-200 text-stone-700 text-sm rounded-lg hover:bg-stone-300 transition"
        >
          Reset
        </button>
      </div>

      {/* Clue lists */}
      <div className="w-full grid grid-cols-2 gap-6 mt-2">
        <ClueList
          title="Across"
          entries={puzzle.across}
          activeDirection={active?.direction}
          activeNumber={active?.number}
          onClick={(n) => {
            setActive({ direction: "across", number: n });
            const cells = clueCells(puzzle, "across", n);
            if (cells.length > 0) setSelected(cells[0]);
          }}
        />
        <ClueList
          title="Down"
          entries={puzzle.down}
          activeDirection={active?.direction}
          activeNumber={active?.number}
          onClick={(n) => {
            setActive({ direction: "down", number: n });
            const cells = clueCells(puzzle, "down", n);
            if (cells.length > 0) setSelected(cells[0]);
          }}
        />
      </div>
    </div>
  );
}

function ClueList({
  title,
  entries,
  activeDirection,
  activeNumber,
  onClick,
}: {
  title: string;
  entries: { number: number; clue: string }[];
  activeDirection?: string;
  activeNumber?: number;
  onClick: (n: number) => void;
}) {
  const dir = title.toLowerCase() as Direction;
  return (
    <div>
      <h2 className="font-bold text-stone-800 text-sm mb-2 uppercase tracking-wide">
        {title}
      </h2>
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
