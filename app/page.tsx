import { readFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import CrosswordGame from "./CrosswordGame";

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

export default async function Home() {
  const puzzle = await getPuzzle();
  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <main className="min-h-screen bg-[#f5f0e8] flex flex-col items-center py-8 px-4">
      <header className="text-center mb-6">
        <p className="text-xs tracking-widest uppercase text-stone-500 mb-1">
          NW5 · Daily Edition
        </p>
        <h1 className="text-3xl font-bold text-stone-900" style={{ fontFamily: "Georgia, serif" }}>
          Kentish Town Crossword
        </h1>
        <p className="text-sm text-stone-500 mt-1">{today}</p>
      </header>

      {puzzle ? (
        <CrosswordGame puzzle={puzzle} />
      ) : (
        <div className="text-stone-600 text-center mt-16">
          <p className="text-lg">No puzzle available for today yet.</p>
          <p className="text-sm mt-2 text-stone-400">Check back tomorrow!</p>
        </div>
      )}

      <footer className="mt-10 text-center text-xs text-stone-400 space-y-1">
        <p>Inspired by the streets, pubs, and paintings of NW5.</p>
        <p>
          Visit{" "}
          <a
            href="https://secretartistnw5.com"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-stone-600"
          >
            secretartistnw5.com
          </a>
          {" "}· Grab a pint at The Pineapple · Catch a gig at The Forum
        </p>
      </footer>
    </main>
  );
}
