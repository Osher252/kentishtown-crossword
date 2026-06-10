"use client";

import { useState, useEffect, useCallback } from "react";

export interface BeeData {
  date: string;
  theme: string;
  center: string;
  outer: string[];
  validWords: string[];
  wordScores: Record<string, number>;
  nw5Words: string[];
  pangrams: string[];
  maxScore: number;
}

// ── Rank thresholds (% of max score) ─────────────────────────────────────────
const RANKS = [
  { label: "NW5 Newcomer", pct: 0 },
  { label: "Market Browser", pct: 0.02 },
  { label: "Corner Shop Regular", pct: 0.05 },
  { label: "Pub Quiz Regular", pct: 0.08 },
  { label: "Overground Commuter", pct: 0.15 },
  { label: "Kentish Town Local", pct: 0.25 },
  { label: "Forum Devotee", pct: 0.40 },
  { label: "Pineapple Regular", pct: 0.55 },
  { label: "NW5 Obsessive", pct: 0.70 },
  { label: "Secret Artist NW5", pct: 1.0 },
];

function getRank(score: number, maxScore: number) {
  const pct = score / Math.max(maxScore, 1);
  let rank = RANKS[0];
  for (const r of RANKS) {
    if (pct >= r.pct) rank = r;
  }
  return rank;
}

const BEE_STORAGE_KEY = "kt-bee-state";

interface BeeState {
  date: string;
  foundWords: string[];
  score: number;
}

function loadBeeState(date: string): BeeState {
  try {
    const raw = localStorage.getItem(BEE_STORAGE_KEY);
    if (!raw) return { date, foundWords: [], score: 0 };
    const s = JSON.parse(raw) as BeeState;
    return s.date === date ? s : { date, foundWords: [], score: 0 };
  } catch { return { date, foundWords: [], score: 0 }; }
}

function saveBeeState(s: BeeState) {
  try { localStorage.setItem(BEE_STORAGE_KEY, JSON.stringify(s)); } catch {}
}

// ── Hex grid positions for 7 letters (flat-top hexagons) ─────────────────────
// Center, then 6 outer positions in a ring
const HEX_POSITIONS = [
  { x: 50, y: 50 },           // center
  { x: 50, y: 17 },           // top
  { x: 79, y: 34 },           // top-right
  { x: 79, y: 66 },           // bottom-right
  { x: 50, y: 83 },           // bottom
  { x: 21, y: 66 },           // bottom-left
  { x: 21, y: 34 },           // top-left
];

function HexCell({ x, y, letter, center, onClick }: {
  x: number; y: number; letter: string; center: boolean; onClick: () => void;
}) {
  const size = 13; // hex "radius" in viewBox units
  // pointy-top hexagon points
  const pts = Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 180) * (60 * i - 30);
    return `${x + size * Math.cos(angle)},${y + size * Math.sin(angle)}`;
  }).join(" ");

  return (
    <g onClick={onClick} className="cursor-pointer select-none">
      <polygon
        points={pts}
        className={`transition-colors ${
          center
            ? "fill-yellow-400 hover:fill-yellow-300"
            : "fill-stone-200 hover:fill-stone-100"
        } stroke-white stroke-[0.5]`}
      />
      <text
        x={x} y={y + 1}
        textAnchor="middle"
        dominantBaseline="middle"
        className={`text-[7px] font-bold ${center ? "fill-stone-900" : "fill-stone-700"}`}
        style={{ fontSize: "7px", fontWeight: "bold", userSelect: "none" }}
      >
        {letter}
      </text>
    </g>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function SpellingBee({ bee }: { bee: BeeData }) {
  const [input, setInput] = useState("");
  const [state, setState] = useState<BeeState>(() => loadBeeState(bee.date));
  const [message, setMessage] = useState<{ text: string; kind: "good" | "bad" | "nw5" | "pangram" } | null>(null);
  const [shuffled, setShuffled] = useState([...bee.outer]);

  const flash = (text: string, kind: "good" | "bad" | "nw5" | "pangram") => {
    setMessage({ text, kind });
    setTimeout(() => setMessage(null), 1800);
  };

  const addLetter = useCallback((letter: string) => {
    setInput((prev) => prev + letter);
  }, []);

  const deleteLetter = useCallback(() => {
    setInput((prev) => prev.slice(0, -1));
  }, []);

  const shuffle = () => {
    setShuffled((prev) => {
      const s = [...prev];
      for (let i = s.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [s[i], s[j]] = [s[j], s[i]];
      }
      return s;
    });
  };

  const submit = useCallback(() => {
    const word = input.toUpperCase();
    setInput("");

    if (word.length < 4) { flash("Too short!", "bad"); return; }
    if (!word.includes(bee.center)) { flash(`Must use ${bee.center}`, "bad"); return; }
    if (state.foundWords.includes(word)) { flash("Already found!", "bad"); return; }
    if (!bee.validWords.includes(word)) { flash("Not in word list", "bad"); return; }

    const pts = bee.wordScores[word] ?? 1;
    const isPangram = bee.pangrams.includes(word);
    const isNw5 = bee.nw5Words.includes(word);

    const newState: BeeState = {
      date: bee.date,
      foundWords: [...state.foundWords, word],
      score: state.score + pts,
    };
    setState(newState);
    saveBeeState(newState);

    if (isPangram) flash(`🌟 Pangram! +${pts}`, "pangram");
    else if (isNw5) flash(`🏠 NW5 bonus! +${pts}`, "nw5");
    else flash(`+${pts}`, "good");
  }, [input, bee, state]);

  // Keyboard support
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "Enter") { submit(); return; }
      if (e.key === "Backspace") { deleteLetter(); return; }
      if (/^[a-zA-Z]$/.test(e.key)) {
        const l = e.key.toUpperCase();
        const allLetters = [bee.center, ...bee.outer];
        if (allLetters.includes(l)) addLetter(l);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [submit, deleteLetter, addLetter, bee]);

  const rank = getRank(state.score, bee.maxScore);
  const allLetters = [bee.center, ...shuffled];

  return (
    <div className="w-full max-w-md flex flex-col items-center gap-4">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-xl font-bold text-stone-900" style={{ fontFamily: "Georgia, serif" }}>
          NW5 Spelling Bee
        </h2>
        <p className="text-xs text-stone-500 italic mt-0.5">"{bee.theme}"</p>
        <p className="text-[10px] text-stone-400 mt-1">
          NW5 words score double · pangrams score +7 bonus
        </p>
      </div>

      {/* Score + rank */}
      <div className="flex items-center gap-4 bg-white/70 rounded-xl px-5 py-2 shadow-sm w-full justify-between">
        <div>
          <span className="text-2xl font-bold text-stone-900">{state.score}</span>
          <span className="text-xs text-stone-400 ml-1">pts</span>
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold text-stone-700">{rank.label}</p>
          <p className="text-[10px] text-stone-400">{state.foundWords.length} word{state.foundWords.length !== 1 ? "s" : ""} found</p>
        </div>
      </div>

      {/* Rank progress bar */}
      <div className="w-full h-1.5 bg-stone-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-yellow-400 rounded-full transition-all"
          style={{ width: `${Math.min(100, (state.score / bee.maxScore) * 100)}%` }}
        />
      </div>

      {/* Input display */}
      <div className="relative min-h-[40px] flex items-center justify-center w-full">
        {message ? (
          <span className={`text-sm font-semibold px-3 py-1 rounded-lg ${
            message.kind === "pangram" ? "bg-purple-100 text-purple-800" :
            message.kind === "nw5"    ? "bg-amber-100 text-amber-800" :
            message.kind === "good"   ? "bg-green-100 text-green-800" :
                                        "bg-red-100 text-red-700"
          }`}>
            {message.text}
          </span>
        ) : (
          <p className="text-2xl font-bold tracking-widest text-stone-900">
            {input.split("").map((ch, i) => (
              <span key={i} className={bee.center === ch ? "text-yellow-500" : "text-stone-900"}>
                {ch}
              </span>
            ))}
            <span className="animate-pulse text-stone-300">|</span>
          </p>
        )}
      </div>

      {/* Hex grid */}
      <svg viewBox="0 0 100 100" className="w-56 h-56 drop-shadow-sm">
        {[bee.center, ...shuffled].map((letter, i) => (
          <HexCell
            key={i}
            x={HEX_POSITIONS[i].x}
            y={HEX_POSITIONS[i].y}
            letter={letter}
            center={i === 0}
            onClick={() => addLetter(letter)}
          />
        ))}
      </svg>

      {/* Controls */}
      <div className="flex gap-2">
        <button onClick={deleteLetter} className="px-3 py-2 bg-stone-200 text-stone-700 text-sm rounded-lg hover:bg-stone-300 transition">
          Delete
        </button>
        <button onClick={shuffle} className="px-3 py-2 bg-stone-200 text-stone-700 text-sm rounded-lg hover:bg-stone-300 transition">
          Shuffle
        </button>
        <button onClick={submit} className="px-4 py-2 bg-stone-800 text-white text-sm rounded-lg hover:bg-stone-700 transition font-semibold">
          Enter
        </button>
      </div>

      {/* Found words */}
      {state.foundWords.length > 0 && (
        <div className="w-full bg-white/60 rounded-xl p-3 shadow-sm">
          <p className="text-[10px] uppercase tracking-widest text-stone-400 mb-2">Found words</p>
          <div className="flex flex-wrap gap-1.5">
            {[...state.foundWords].sort().map((w) => (
              <span
                key={w}
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  bee.pangrams.includes(w)
                    ? "bg-purple-100 text-purple-800 border border-purple-300"
                    : bee.nw5Words.includes(w)
                    ? "bg-amber-100 text-amber-800 border border-amber-300"
                    : "bg-stone-100 text-stone-700"
                }`}
              >
                {w}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
