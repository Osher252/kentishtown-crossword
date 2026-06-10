import { readFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import CrosswordGame from "./CrosswordGame";
import SpellingBee from "./SpellingBee";
import type { BeeData } from "./SpellingBee";

export const dynamic = "force-static";
export const revalidate = 3600;

interface PuzzleEntry {
  number: number;
  row: number;
  col: number;
  answer: string;
  clue: string;
}

export interface Puzzle {
  date: string;
  title: string;
  size?: number;
  grid: string[][];
  across: PuzzleEntry[];
  down: PuzzleEntry[];
}

async function getPuzzle(): Promise<Puzzle | null> {
  const today = new Date().toISOString().split("T")[0];
  const filePath = path.join(process.cwd(), "puzzles", `${today}.json`);
  if (!existsSync(filePath)) return null;
  const raw = await readFile(filePath, "utf-8");
  return JSON.parse(raw);
}

async function getBee(): Promise<BeeData | null> {
  const today = new Date().toISOString().split("T")[0];
  const filePath = path.join(process.cwd(), "bees", `${today}.json`);
  if (!existsSync(filePath)) return null;
  const raw = await readFile(filePath, "utf-8");
  return JSON.parse(raw);
}

export default async function Home() {
  const [puzzle, bee] = await Promise.all([getPuzzle(), getBee()]);
  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <main
      className="min-h-screen flex flex-col items-center py-8 px-4 relative"
      style={{
        backgroundImage: "url('/secret-artist-bg.avif')",
        backgroundSize: "cover",
        backgroundPosition: "center top",
        backgroundAttachment: "fixed",
      }}
    >
      {/* Soft warm overlay so games stay readable over the painting */}
      <div className="absolute inset-0 bg-[#f5f0e8]/80 pointer-events-none" />

      {/* All content sits above the overlay */}
      <div className="relative z-10 flex flex-col items-center w-full">
        <header className="text-center mb-6">
          <p className="text-xs tracking-widest uppercase text-stone-500 mb-1">
            NW5 · Daily Edition
          </p>
          <h1 className="text-3xl font-bold text-stone-900" style={{ fontFamily: "Georgia, serif" }}>
            Kentish Town
          </h1>
          <p className="text-sm text-stone-500 mt-1">{today}</p>
        </header>

        {/* ── Crossword ── */}
        {puzzle ? (
          <CrosswordGame puzzle={puzzle} />
        ) : (
          <div className="text-stone-600 text-center mt-8">
            <p className="text-lg">No crossword available yet.</p>
            <p className="text-sm mt-2 text-stone-400">Check back tomorrow!</p>
          </div>
        )}

        {/* ── Divider ── */}
        <div className="w-full max-w-md my-10 flex items-center gap-3">
          <div className="flex-1 h-px bg-stone-300" />
          <span className="text-xs uppercase tracking-widest text-stone-400">Spelling Bee</span>
          <div className="flex-1 h-px bg-stone-300" />
        </div>

        {/* ── Spelling Bee ── */}
        {bee ? (
          <SpellingBee bee={bee} />
        ) : (
          <div className="text-stone-600 text-center">
            <p className="text-lg">No bee available yet.</p>
            <p className="text-sm mt-2 text-stone-400">Check back tomorrow!</p>
          </div>
        )}

        <footer className="mt-10 mb-4 text-center text-xs text-stone-400 space-y-1">
          <p>Inspired by the streets, pubs, and paintings of NW5.</p>
          <p>
            Background painting:{" "}
            <a
              href="https://secretartistnw5.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-stone-600 transition"
            >
              Secret Artist NW5
            </a>
            {" "}— Kentish Town Road, looking north, 2023
          </p>
        </footer>
      </div>
    </main>
  );
}
