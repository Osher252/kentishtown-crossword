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

// ─── 5×5 template ───────────────────────────────────────────────────────────
// Layout (. = white, # = black):
//   . . . . .   ← 1A  (row 0, col 0, len 5)
//   . # . # .
//   . . . . .   ← 4A  (row 2, col 0, len 5)
//   . # . # .
//   . . . . .   ← 5A  (row 4, col 0, len 5)
//   ↑   ↑   ↑
//  1D  2D  3D  (col 0, 2, 4; row 0, len 5)
//
// Intersection constraints:
//   1A[0]=1D[0], 1A[2]=2D[0], 1A[4]=3D[0]
//   4A[0]=1D[2], 4A[2]=2D[2], 4A[4]=3D[2]
//   5A[0]=1D[4], 5A[2]=2D[4], 5A[4]=3D[4]

// ─── Word pool ───────────────────────────────────────────────────────────────
// At least 2 KT-local words per puzzle. General English fills the rest.
const KT_WORDS = [
  "FORUM",   // the Forum venue
  "HEATH",   // Hampstead Heath
  "CANAL",   // Regent's Canal
  "INDIE",   // indie music scene
  "VENUE",   // live music venues
  "NORTH",   // North London
  "GROVE",   // various streets: Montpelier Grove etc.
  "HILLS",   // Parliament Hill
  "CHALK",   // Chalk Farm nearby
  "LOCAL",   // the local pub
  "LANES",   // cycle lanes
  "BIKES",   // cycling culture
  "TRACK",   // music / running
  "ALLEY",   // various alleys
  "OZONE",   // air quality
  "BREWS",   // craft beers
  "VEGAN",   // local vegan spots
  "GRAFT",   // hard work culture
  "YARDS",   // courtyards
  "MURAL",   // street art / Secret Artist NW5
  "PAINT",   // the Secret Artist paints
  "SIGNS",   // street signs
  "NIGHT",   // night out
  "BANDS",   // live music
  "CROWD",   // gig crowd
  "DRIFT",   // drifting through the town
  "MANOR",   // manor house area
  "PATHS",   // footpaths on the Heath
  "PONDS",   // bathing ponds
  "SWIMS",   // swimming in the ponds
  "RISEN",   // York Rise
  "OAKEN",   // Gospel Oak
];

const FILLER_WORDS = [
  "ABOUT", "ABOVE", "AFTER", "AGAIN", "ANGEL", "ANGER", "ANGLE", "ANKLE",
  "ANNEX", "APART", "APPLE", "AREAS", "ARENA", "ARGUE", "ARISE", "ASSET",
  "ATLAS", "ATTIC", "AUDIO", "AUDIT", "AVOID", "AWAKE", "AWFUL", "BACON",
  "BADGE", "BANKS", "BASIC", "BASIN", "BATON", "BEACH", "BEGIN", "BELLE",
  "BELOW", "BENCH", "BLEND", "BLINK", "BLOCK", "BLOOD", "BLOWN", "BLUES",
  "BLUNT", "BOARD", "BOAST", "BRAVE", "BREAD", "BREAK", "BREED", "BRICK",
  "BRIDE", "BRIEF", "BRING", "BROAD", "BROKE", "BROWN", "BRUSH", "BUILD",
  "BUILT", "BURST", "CABIN", "CABLE", "CAMEL", "CANON", "CARGO", "CARRY",
  "CAUSE", "CEDAR", "CHAIN", "CHAIR", "CHAOS", "CHARM", "CHART", "CHASE",
  "CHECK", "CHIEF", "CHINA", "CHOIR", "CIVIL", "CLAIM", "CLAMP", "CLANG",
  "CLASH", "CLING", "CLOCK", "CLONE", "CLOSE", "CLOUD", "COACH", "COAST",
  "COLOR", "COMIC", "CORAL", "COULD", "COMET", "COMMA", "CORGI", "COUNT",
  "COVER", "CRANE", "CRASH", "CRAZY", "CREAM", "CREEK", "CRISP", "CROSS",
  "CRUSH", "CRYPT", "CUBIC", "CYCLE", "DAILY", "DAIRY", "DANCE", "DATES",
  "DEBUT", "DECOR", "DELAY", "DEPTH", "DERBY", "DEVIL", "DIGIT", "DISCO",
  "DODGE", "DOUGH", "DRAFT", "DRAIN", "DRAMA", "DRAPE", "DRAWN", "DREAM",
  "DRESS", "DRIED", "DRINK", "DRIVE", "DROPS", "DRUMS", "DRYER", "DYING",
  "EAGLE", "EARLY", "EARTH", "EIGHT", "ELITE", "EMBER", "EMPTY", "ENEMY",
  "ENJOY", "ENTER", "ENTRY", "EQUAL", "ERROR", "ESSAY", "EAGLE", "EVENT",
  "EVERY", "EXACT", "EXAMS", "EXIST", "EXTRA", "FABLE", "FAINT", "FAIRY",
  "FALLS", "FANCY", "FARMS", "FAULT", "FEAST", "FENCE", "FERRY", "FETCH",
  "FEVER", "FIBER", "FIELD", "FIFTH", "FIFTY", "FIGHT", "FINAL", "FIRES",
  "FIRST", "FIXED", "FLAME", "FLARE", "FLASH", "FLASK", "FLESH", "FLIES",
  "FLOAT", "FLOOD", "FLOOR", "FLOOR", "FLORA", "FLOUR", "FLOWN", "FLUTE",
  "FOIST", "FOLKS", "FORCE", "FOUND", "FRANC", "FRAME", "FRANK", "FRESH",
  "FRONT", "FROST", "FROZE", "FRUIT", "FUNDS", "FUNNY", "GAMMA", "GAMES",
  "GAMER", "GAUGE", "GENRE", "GHOST", "GIANT", "GIVEN", "GLAND", "GLARE",
  "GLASS", "GLOBE", "GLOOM", "GLORY", "GLOSS", "GLOVE", "GOING", "GRACE",
  "GRADE", "GRAIN", "GRAND", "GRANT", "GRAPE", "GRASP", "GRASS", "GRAVE",
  "GREAT", "GREEN", "GREET", "GROAN", "GUARD", "GUESS", "GUIDE", "GUILD",
  "GUILE", "GUILT", "GUISE", "GULCH", "GUSTO", "HABIT", "HAPPY", "HARSH",
  "HASTE", "HAUNT", "HAVEN", "HEART", "HEAVY", "HEDGE", "HENCE", "HERBS",
  "HINGE", "HIPPO", "HIRED", "HOIST", "HOLLY", "HONEY", "HONOR", "HORSE",
  "HOTEL", "HOUND", "HOUSE", "HUMAN", "HUMOR", "HURRY", "HYENA", "ICING",
  "IDIOT", "IMAGE", "IMPLY", "INFER", "INTER", "INTRO", "INSET", "IONIC",
  "IRONY", "IVORY", "JACKY", "JAPAN", "JEWEL", "JOUST", "JUICE", "JUICE",
  "JUICY", "KARMA", "KAYAK", "KNEEL", "KNIFE", "KNOCK", "KNOWN", "LABEL",
  "LAGER", "LANCE", "LARGO", "LASER", "LATER", "LATTE", "LAUGH", "LAYER",
  "LEADS", "LEARN", "LEASE", "LEAST", "LEAVE", "LEGAL", "LEMON", "LEVEL",
  "LIGHT", "LINER", "LINKS", "LIONS", "LIVER", "LOANS", "LODGE", "LOGIC",
  "LOOSE", "LOVER", "LOWER", "LUCKY", "LUNCH", "LUSTY", "LYRIC", "MAGIC",
  "MAJOR", "MAKER", "MANGO", "MANOR", "MAPLE", "MARCH", "MARKS", "MARSH",
  "MATCH", "MAYOR", "MEDAL", "MEDIA", "MEETS", "MERCY", "MERGE", "MERIT",
  "METAL", "MIGHT", "MIMIC", "MINOR", "MINUS", "MIRTH", "MOCHA", "MODEL",
  "MONEY", "MONKS", "MONTH", "MORAL", "MOVIE", "MUDDY", "MUSIC", "NAVAL",
  "NAIVE", "NAMED", "NAMES", "NEEDS", "NERVE", "NEVER", "NEWER", "NEXUS",
  "NOBLE", "NOISE", "NOVEL", "NURSE", "NYMPH", "OCCUR", "OCEAN", "OLIVE",
  "ONSET", "OPERA", "ORDER", "ORGAN", "OTHER", "OUTER", "OVARY", "OXIDE",
  "OZONE", "PACED", "PANDA", "PANEL", "PANIC", "PAPER", "PARTY", "PASTA",
  "PATCH", "PAUSE", "PEACE", "PEARL", "PEDAL", "PENNY", "PERCH", "PHASE",
  "PHONE", "PHOTO", "PIANO", "PIECE", "PILOT", "PIXEL", "PIZZA", "PLACE",
  "PLAID", "PLAIN", "PLANE", "PLANT", "PLATE", "PLAZA", "PLEAD", "PLUCK",
  "PLUME", "PLUNK", "PLUSH", "PLUTO", "POINT", "POKER", "POLAR", "POSED",
  "POWER", "PRESS", "PRICE", "PRIDE", "PRIME", "PRINT", "PRIOR", "PRIZE",
  "PROBE", "PROSE", "PROUD", "PROXY", "PULSE", "PURSE", "QUEEN", "QUERY",
  "QUEUE", "QUICK", "QUIET", "QUOTA", "QUOTE", "RADAR", "RADIO", "RAISE",
  "RALLY", "RANGE", "RAPID", "RATIO", "REACH", "REACT", "READY", "REALM",
  "REBEL", "REFER", "REIGN", "RELAX", "RELAY", "RELIC", "REMIX", "REPAY",
  "REPEL", "RISKY", "RIVAL", "RIVER", "ROAST", "ROBIN", "ROGUE", "ROMAN",
  "ROUGH", "ROUND", "ROUTE", "ROVER", "ROYAL", "RUGBY", "RULER", "RUMOR",
  "RURAL", "SADLY", "SAINT", "SALES", "SAUCE", "SCALE", "SCARE", "SCENE",
  "SCORE", "SCOUT", "SEEDS", "SEIZE", "SERVE", "SETUP", "SEVEN", "SHADY",
  "SHAKE", "SHALL", "SHAME", "SHAPE", "SHARE", "SHARK", "SHARP", "SHELF",
  "SHELL", "SHIFT", "SHINE", "SHIRT", "SHOCK", "SHOES", "SHORT", "SHOUT",
  "SIGHT", "SINCE", "SIXTH", "SIXTY", "SIZED", "SKILL", "SLOPE", "SLOTH",
  "SMALL", "SMART", "SMASH", "SMILE", "SMOKE", "SNAIL", "SNAKE", "SNEAK",
  "SOLAR", "SOLID", "SOLVE", "SONIC", "SORRY", "SOULS", "SOUND", "SPACE",
  "SPARE", "SPARK", "SPEAK", "SPEED", "SPEND", "SPICE", "SPIKE", "SPINE",
  "SPITE", "SPLIT", "SPOKE", "SPOON", "SPORT", "SPOTS", "SPRAY", "STACK",
  "STAFF", "STAGE", "STAIR", "STAND", "STARE", "STARK", "START", "STATE",
  "STAYS", "STEAL", "STEAM", "STEEL", "STEEP", "STEER", "STERN", "STOCK",
  "STONE", "STOOD", "STORE", "STORK", "STORM", "STORY", "STRAP", "STRAW",
  "STRAY", "STRIP", "STUCK", "STUDY", "STUNT", "SUGAR", "SUITE", "SUNNY",
  "SUPER", "SURGE", "SWAMP", "SWEPT", "SWIFT", "SWING", "SWORD", "TABLE",
  "TANGO", "TASTE", "TEACH", "TENSE", "TENTH", "TERMS", "THORN", "THREE",
  "THROW", "TIGER", "TIMER", "TIRED", "TITLE", "TODAY", "TOKEN", "TOAST",
  "TORCH", "TOTAL", "TOUCH", "TOUGH", "TOWER", "TOXIC", "TRAIL", "TRAIN",
  "TRAIT", "TRASH", "TRICK", "TRIED", "TROOP", "TROUT", "TROVE", "TRUCE",
  "TRULY", "TRUNK", "TRUST", "TRUTH", "TULIP", "TUNER", "TUNIC", "TUTOR",
  "TWEED", "TWICE", "TWIST", "ULTRA", "UNCLE", "UNDER", "UNION", "UNITE",
  "UPPER", "UPSET", "URBAN", "USAGE", "UTTER", "VALID", "VALOR", "VALUE",
  "VALVE", "VAPOR", "VAULT", "VICAR", "VIOLA", "VIRAL", "VISIT", "VISTA",
  "VITAL", "VIVID", "VOCAL", "VOICE", "VOTER", "VYING", "WAGER", "WASTE",
  "WATCH", "WATER", "WEARY", "WEAVE", "WEDGE", "WEIRD", "WHALE", "WHEAT",
  "WHERE", "WHICH", "WHILE", "WHITE", "WHOLE", "WHOSE", "WIDOW", "EIGHT",
  "WIDER", "WINDY", "WITTY", "WOMEN", "WOODS", "WORLD", "WORRY", "WORSE",
  "WORSE", "WORST", "WORTH", "WRECK", "WRIST", "WRONG", "YACHT", "YIELD",
  "YOUNG", "YOUTH", "ZEBRA", "ZONAL",
];

const ALL_WORDS = [...new Set([...KT_WORDS, ...FILLER_WORDS])];

// Build lookup: letter → set of words having that letter at position N
function buildIndex(words: string[]): Array<Map<string, Set<string>>> {
  const idx: Map<string, Set<string>>[] = Array.from({ length: 5 }, () => new Map());
  for (const w of words) {
    for (let i = 0; i < 5; i++) {
      const k = w[i];
      if (!idx[i].has(k)) idx[i].set(k, new Set());
      idx[i].get(k)!.add(w);
    }
  }
  return idx;
}

function intersect(a: Set<string>, b: Set<string>): Set<string> {
  return new Set([...a].filter((x) => b.has(x)));
}

function findValidPuzzle(): [string, string, string, string, string, string] | null {
  const idx = buildIndex(ALL_WORDS);
  // Shuffle to get variety
  const words = [...ALL_WORDS].sort(() => Math.random() - 0.5);
  // Require at least 2 KT words in each puzzle
  const ktSet = new Set(KT_WORDS);

  for (const a1 of words) {
    for (const a2 of words) {
      if (a2 === a1) continue;
      for (const a3 of words) {
        if (a3 === a1 || a3 === a2) continue;
        const ktCount = [a1, a2, a3].filter((w) => ktSet.has(w)).length;
        if (ktCount < 1) continue; // at least 1 KT word in across

        // Find d1: pos0=a1[0], pos2=a2[0], pos4=a3[0]
        const d1Candidates = intersect(
          intersect(
            idx[0].get(a1[0]) ?? new Set(),
            idx[2].get(a2[0]) ?? new Set()
          ),
          idx[4].get(a3[0]) ?? new Set()
        );
        const d1Options = [...d1Candidates].filter(
          (w) => w !== a1 && w !== a2 && w !== a3
        );
        if (d1Options.length === 0) continue;

        for (const d1 of d1Options) {
          // Find d2: pos0=a1[2], pos2=a2[2], pos4=a3[2]
          const d2Candidates = intersect(
            intersect(
              idx[0].get(a1[2]) ?? new Set(),
              idx[2].get(a2[2]) ?? new Set()
            ),
            idx[4].get(a3[2]) ?? new Set()
          );
          const d2Options = [...d2Candidates].filter(
            (w) => w !== a1 && w !== a2 && w !== a3 && w !== d1
          );
          if (d2Options.length === 0) continue;

          for (const d2 of d2Options) {
            // Find d3: pos0=a1[4], pos2=a2[4], pos4=a3[4]
            const d3Candidates = intersect(
              intersect(
                idx[0].get(a1[4]) ?? new Set(),
                idx[2].get(a2[4]) ?? new Set()
              ),
              idx[4].get(a3[4]) ?? new Set()
            );
            const d3Options = [...d3Candidates].filter(
              (w) =>
                w !== a1 &&
                w !== a2 &&
                w !== a3 &&
                w !== d1 &&
                w !== d2
            );
            if (d3Options.length === 0) continue;

            const d3 = d3Options[0] as string;
            const allKT = [a1, a2, a3, d1, d2, d3].filter((w) =>
              ktSet.has(w)
            ).length;
            if (allKT < 2) continue; // need at least 2 KT words total

            return [a1, a2, a3, d1, d2, d3];
          }
        }
      }
    }
  }
  return null;
}

function buildGrid(
  a1: string, a2: string, a3: string,
  d1: string, d2: string, d3: string
): string[][] {
  // 5x5 grid. Rows 1&3 have blacks at cols 1,3; cols 0,2,4 come from down words.
  const grid: string[][] = Array.from({ length: 5 }, () => Array(5).fill("#"));
  for (let c = 0; c < 5; c++) {
    grid[0][c] = a1[c];
    grid[2][c] = a2[c];
    grid[4][c] = a3[c];
  }
  // Down word intermediate letters (rows 1 and 3, cols 0/2/4)
  grid[1][0] = d1[1]; grid[1][2] = d2[1]; grid[1][4] = d3[1];
  grid[3][0] = d1[3]; grid[3][2] = d2[3]; grid[3][4] = d3[3];
  return grid;
}

// ─── Clue generation ─────────────────────────────────────────────────────────
async function generateClues(
  words: { word: string; direction: string; number: number }[],
  date: string
): Promise<Record<string, string>> {
  const wordList = words
    .map((w) => `${w.number}${w.direction.toUpperCase()}: ${w.word}`)
    .join("\n");

  const response = await client.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 1000,
    messages: [
      {
        role: "user",
        content: `You are writing clues for a Kentish Town, London NW5 themed crossword puzzle for date ${date}.

Local landmarks and references: The Pineapple pub (on Leverton Street), secretartistnw5.com (a street artist who leaves small paintings around NW5), The Forum (music venue on Highgate Road), Parliament Hill, Hampstead Heath, Regent's Canal, Swain's Lane (leads to Highgate Cemetery), Gospel Oak, Tufnell Park, Camden.

Write one SHORT crossword clue for each word below. Clues should be witty, clever and — where the word has a local connection — reference Kentish Town or NW5. For general words, write a normal crossword-style clue. No definitions, just the clue.

Return ONLY a JSON object like: {"1A": "clue text", "1D": "clue text", ...}

Words:
${wordList}`,
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "{}";
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return {};
  return JSON.parse(match[0]);
}

// ─── Build final puzzle JSON ──────────────────────────────────────────────────
async function generatePuzzle(date: string): Promise<object> {
  const result = findValidPuzzle();
  if (!result) throw new Error("Could not find valid word combination");

  const [a1, a2, a3, d1, d2, d3] = result;

  const grid = buildGrid(a1, a2, a3, d1, d2, d3);

  // Number the squares: 1(0,0), 2(0,2), 3(0,4), 4(2,0), 5(4,0)
  const wordEntries = [
    { word: a1, direction: "across", number: 1 },
    { word: a2, direction: "across", number: 4 },
    { word: a3, direction: "across", number: 5 },
    { word: d1, direction: "down", number: 1 },
    { word: d2, direction: "down", number: 2 },
    { word: d3, direction: "down", number: 3 },
  ];

  console.log(
    `  Words: ${a1}(1A), ${a2}(4A), ${a3}(5A) | ${d1}(1D), ${d2}(2D), ${d3}(3D)`
  );

  const clues = await generateClues(wordEntries, date);

  return {
    date,
    title: "Kentish Town Daily Crossword",
    grid,
    across: [
      { number: 1, row: 0, col: 0, answer: a1, clue: clues["1A"] || a1 },
      { number: 4, row: 2, col: 0, answer: a2, clue: clues["4A"] || a2 },
      { number: 5, row: 4, col: 0, answer: a3, clue: clues["5A"] || a3 },
    ],
    down: [
      { number: 1, row: 0, col: 0, answer: d1, clue: clues["1D"] || d1 },
      { number: 2, row: 0, col: 2, answer: d2, clue: clues["2D"] || d2 },
      { number: 3, row: 0, col: 4, answer: d3, clue: clues["3D"] || d3 },
    ],
  };
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);
  const dates: string[] = [];

  if (args[0] === "--days") {
    const days = parseInt(args[1] || "14");
    const today = new Date();
    for (let i = 0; i < days; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      dates.push(d.toISOString().split("T")[0]);
    }
  } else if (args[0] === "--date") {
    dates.push(args[1]);
  } else {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    dates.push(tomorrow.toISOString().split("T")[0]);
  }

  const puzzlesDir = path.join(process.cwd(), "puzzles");
  if (!fs.existsSync(puzzlesDir)) fs.mkdirSync(puzzlesDir, { recursive: true });

  for (const date of dates) {
    const filePath = path.join(puzzlesDir, `${date}.json`);
    if (fs.existsSync(filePath)) {
      console.log(`Puzzle for ${date} already exists, skipping.`);
      continue;
    }
    console.log(`Generating puzzle for ${date}...`);
    try {
      const puzzle = await generatePuzzle(date);
      fs.writeFileSync(filePath, JSON.stringify(puzzle, null, 2));
      console.log(`✓ Saved puzzle for ${date}`);
    } catch (err) {
      console.error(`✗ Failed for ${date}:`, err);
    }
  }
}

main();
