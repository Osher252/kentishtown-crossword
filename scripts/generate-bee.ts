import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";
import path from "path";

// Load .env.local manually
const envPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const m = line.match(/^([A-Z_]+)="?([^"]*)"?$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

const client = new Anthropic();

// ── NW5 words that score double ───────────────────────────────────────────────
const NW5_BONUS_WORDS = new Set([
  "pineapple","grafton","junction","vine","assembly","torriano","southampton",
  "dartmouth","gipsy","malden","palmerston","garibaldi","anglers","leverton",
  "fortess","caversham","burghley","highgate","gospel","camden","chalk","fleet",
  "heath","vale","forum","vinyl","indie","craft","brunch","allotment","patron",
  "kossoffs","pottery","foxes","lido","mural","busker","overground","tufnell",
  "swains","parliament","hampstead","parakeet","fiddlers","oseney","wolsey",
  "clarence","peckwater","gaisford","islip","lupton","evangelist",
  // common words still NW5-flavoured
  "local","pub","ale","lane","road","hill","park","oak","town","north","south",
]);

// ── Load system dictionary ────────────────────────────────────────────────────
function loadDictionary(): Set<string> {
  const raw = fs.readFileSync("/usr/share/dict/words", "utf-8");
  const words = new Set<string>();
  for (const w of raw.split("\n")) {
    const clean = w.trim().toLowerCase();
    // Only plain lowercase alpha words, 4+ letters, no proper nouns (already lower)
    if (/^[a-z]{4,}$/.test(clean)) words.add(clean);
  }
  return words;
}

// ── Find valid words for a given letter set ───────────────────────────────────
function findValidWords(center: string, letters: string[], dict: Set<string>): string[] {
  const allLetters = new Set([center, ...letters]);
  const valid: string[] = [];
  for (const word of dict) {
    if (!word.includes(center)) continue;
    if ([...word].every((ch) => allLetters.has(ch))) {
      valid.push(word);
    }
  }
  return valid;
}

// ── Pangram check ─────────────────────────────────────────────────────────────
function isPangram(word: string, letters: string[]): boolean {
  return letters.every((l) => word.includes(l));
}

// ── Good letter sets for Spelling Bee ────────────────────────────────────────
// These are curated sets where the center letter + 6 outer letters form interesting puzzles
// Each has at least one pangram and 20+ valid words
const LETTER_SETS: { center: string; outer: string[] }[] = [
  { center: "a", outer: ["l","t","e","r","n","g"] },   // TRIANGLE → INTEGRAL, ALERTING etc
  { center: "o", outer: ["p","s","t","i","n","e"] },   // POETINS, POINTES
  { center: "e", outer: ["r","s","t","i","n","g"] },   // RESTING, STINGER
  { center: "i", outer: ["n","s","t","r","a","g"] },   // RATINGS, GASTRIN
  { center: "n", outer: ["o","i","t","a","l","e"] },   // NATALIE, ELATION
  { center: "t", outer: ["r","a","i","n","s","e"] },   // RETAINS, NASTIER
  { center: "a", outer: ["p","r","i","s","e","n"] },   // PAINTER, PANIERS
  { center: "e", outer: ["c","r","a","t","i","n"] },   // CERTAIN, NARCEIT
  { center: "o", outer: ["c","r","a","t","i","n"] },   // TACTION
  { center: "a", outer: ["n","g","l","e","r","s"] },   // ANGLERS ← NW5!
  { center: "l", outer: ["o","c","a","t","i","n"] },   // LOCATION
  { center: "e", outer: ["p","l","a","n","t","s"] },   // PLANETS
  { center: "a", outer: ["r","t","i","s","n","e"] },   // ARTISAN → NW5: ARTIST
  { center: "r", outer: ["a","t","i","s","n","e"] },   // RETAINS
  { center: "o", outer: ["r","a","t","i","s","n"] },   // RATIONS
  { center: "u", outer: ["n","t","a","r","e","l"] },   // NEUTRAL
  { center: "i", outer: ["n","d","e","r","s","t"] },   // TINDERS → NW5: INDIE!
  { center: "n", outer: ["d","i","e","r","s","t"] },   // TINDERS
  { center: "a", outer: ["l","o","t","m","e","n"] },   // ALLOTMENT ← NW5!
  { center: "v", outer: ["i","n","y","l","e","r"] },   // VINYL ← NW5! + LIVERY etc
  { center: "a", outer: ["l","e","r","t","i","n"] },   // ALERTING, RETINAL
  { center: "o", outer: ["f","r","u","m","e","n"] },   // FORUM ← NW5!
  { center: "u", outer: ["b","r","s","k","e","n"] },   // BUSKER ← NW5!
];

// ── Pick today's letter set ───────────────────────────────────────────────────
function pickLetterSet(date: string, dict: Set<string>): { center: string; outer: string[]; validWords: string[] } | null {
  // Use date to deterministically pick a set, rotating through
  const dayNum = Math.floor(new Date(date + "T12:00:00Z").getTime() / 86400000);

  for (let attempt = 0; attempt < LETTER_SETS.length; attempt++) {
    const idx = (dayNum + attempt) % LETTER_SETS.length;
    const { center, outer } = LETTER_SETS[idx];
    const allLetters = [center, ...outer];
    const validWords = findValidWords(center, outer, dict);

    // Need at least one pangram and at least 20 valid words
    const hasPangram = validWords.some((w) => isPangram(w, allLetters));
    if (hasPangram && validWords.length >= 20) {
      return { center, outer, validWords };
    }
  }
  return null;
}

// ── Score a word ──────────────────────────────────────────────────────────────
function scoreWord(word: string, allLetters: string[]): number {
  const baseScore = word.length === 4 ? 1 : word.length;
  const pangramBonus = isPangram(word, allLetters) ? 7 : 0;
  const nw5Bonus = NW5_BONUS_WORDS.has(word) ? baseScore : 0; // double = add again
  return baseScore + pangramBonus + nw5Bonus;
}

// ── Generate clue/theme label via Claude ──────────────────────────────────────
async function generateTheme(center: string, outer: string[], pangrams: string[]): Promise<string> {
  const msg = await client.messages.create({
    model: "claude-opus-4-5",
    max_tokens: 100,
    messages: [{
      role: "user",
      content: `You are writing for the Kentish Town Spelling Bee, a hyper-local NW5 word puzzle.
Today's letters are: centre letter "${center.toUpperCase()}", outer letters "${outer.map(l=>l.toUpperCase()).join(", ")}".
Pangrams (words using all 7 letters): ${pangrams.slice(0,3).join(", ") || "none found"}.

Write a single short NW5-flavoured theme line (max 8 words) for today's puzzle.
Examples: "Fleet Street of the north", "A pint at the Southampton", "Gospel Oak golden morning".
Just the line, no quotes, no punctuation at the end.`
    }]
  });
  return (msg.content[0] as { text: string }).text.trim();
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const targetDate = process.argv[2] ?? (() => {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() + 1);
    return d.toISOString().split("T")[0];
  })();

  console.log(`Generating Spelling Bee for ${targetDate}…`);

  const dict = loadDictionary();
  console.log(`Dictionary loaded: ${dict.size} words`);

  const result = pickLetterSet(targetDate, dict);
  if (!result) {
    console.error("Could not find a valid letter set — add more to LETTER_SETS");
    process.exit(1);
  }

  const { center, outer, validWords } = result;
  const allLetters = [center, ...outer];
  console.log(`Letters: [${center.toUpperCase()}] ${outer.map(l=>l.toUpperCase()).join(" ")} — ${validWords.length} valid words`);

  const pangrams = validWords.filter((w) => isPangram(w, allLetters));
  console.log(`Pangrams: ${pangrams.join(", ")}`);

  // Build scored word map
  const wordScores: Record<string, number> = {};
  for (const w of validWords) {
    wordScores[w] = scoreWord(w, allLetters);
  }

  // NW5 bonus words in this set
  const nw5Words = validWords.filter((w) => NW5_BONUS_WORDS.has(w));
  console.log(`NW5 bonus words: ${nw5Words.join(", ") || "none"}`);

  const theme = await generateTheme(center, outer, pangrams);
  console.log(`Theme: "${theme}"`);

  const maxScore = validWords.reduce((s, w) => s + wordScores[w], 0);

  const bee = {
    date: targetDate,
    theme,
    center: center.toUpperCase(),
    outer: outer.map((l) => l.toUpperCase()),
    validWords: validWords.map((w) => w.toUpperCase()),
    wordScores: Object.fromEntries(Object.entries(wordScores).map(([k, v]) => [k.toUpperCase(), v])),
    nw5Words: nw5Words.map((w) => w.toUpperCase()),
    pangrams: pangrams.map((w) => w.toUpperCase()),
    maxScore,
  };

  const outDir = path.join(process.cwd(), "bees");
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `${targetDate}.json`);
  fs.writeFileSync(outPath, JSON.stringify(bee, null, 2));
  console.log(`✓ Saved to ${outPath}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
