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

const SIZE = 12;

// ── Kentish Town word pool ────────────────────────────────────────────────────
// local: true = genuinely NW5-specific, gets a local clue
// clueHint: optional prompt hint so Claude writes the right clue
const KT_WORDS: { word: string; local: true; hint: string }[] = [
  // ── Pubs ──
  { word: "PINEAPPLE",  local: true, hint: "The Pineapple pub, Leverton Street NW5 — beloved local with a beer garden" },
  { word: "GRAFTON",    local: true, hint: "The Grafton pub, independent Victorian pub next to Kentish Town West overground" },
  { word: "JUNCTION",   local: true, hint: "Junction Tavern, real-ale pub on Fortess Road NW5" },
  { word: "PARAKEET",   local: true, hint: "The Parakeet, Michelin Bib Gourmand pub on Kentish Town Road" },
  { word: "VINE",       local: true, hint: "The Vine, Edwardian gastropub with shuffleboard and roof terrace in NW5" },
  { word: "ASSEMBLY",   local: true, hint: "The Assembly House, Grade II listed pub at 292 Kentish Town Road" },
  { word: "TORRIANO",   local: true, hint: "The Torriano Arms pub / Torriano Avenue, one of NW5's loveliest streets" },
  { word: "SOUTHAMPTON",local: true, hint: "Southampton Arms, no-nonsense real-ale and cider pub on Highgate Road NW5" },
  { word: "DARTMOUTH",  local: true, hint: "Dartmouth Arms, cosy pub in Gospel Oak" },
  { word: "GIPSY",      local: true, hint: "The Gipsy Queen, family-friendly local on Malden Road NW5" },
  { word: "FIDDLERS",   local: true, hint: "Fiddler's Elbow, live music pub on Malden Road NW5" },
  { word: "MALDEN",     local: true, hint: "Malden Road NW5 / the Malden Arms pub" },
  { word: "PALMERSTON", local: true, hint: "Lord Palmerston pub on Dartmouth Park Hill, near NW5" },
  { word: "GARIBALDI",  local: true, hint: "The Garibaldi, historic NW5 pub" },
  { word: "ANGLERS",    local: true, hint: "The Jolly Anglers pub / Anglers Lane NW5" },
  // ── Streets ──
  { word: "LEVERTON",   local: true, hint: "Leverton Street NW5 — where The Pineapple pub sits" },
  { word: "FORTESS",    local: true, hint: "Fortess Road NW5 — the main artery through Tufnell Park (note unusual spelling)" },
  { word: "CAVERSHAM",  local: true, hint: "Caversham Road NW5, part of the Christ Church Oxford estate network of streets" },
  { word: "BURGHLEY",   local: true, hint: "Burghley Road NW5, named after Lord Burghley, Chancellor to Elizabeth I" },
  { word: "ISLIP",      local: true, hint: "Islip Street NW5, part of the Christ Church Oxford streets" },
  { word: "GAISFORD",   local: true, hint: "Gaisford Street NW5, part of the Christ Church Oxford streets" },
  { word: "OSENEY",     local: true, hint: "Oseney Crescent NW5, named after Osney Abbey, Oxford" },
  { word: "WOLSEY",     local: true, hint: "Wolsey Road NW5, named after Cardinal Wolsey" },
  { word: "EVANGELIST", local: true, hint: "Evangelist Road NW5, part of the St John's College Cambridge estate" },
  { word: "LUPTON",     local: true, hint: "Lupton Street NW5" },
  { word: "HIGHGATE",   local: true, hint: "Highgate Road NW5 — runs along the eastern edge of Kentish Town" },
  { word: "CLARENCE",   local: true, hint: "Clarence Way NW5" },
  { word: "PECKWATER",  local: true, hint: "Peckwater Street NW5, named after Peckwater Quad at Christ Church Oxford" },
  // ── Landmarks & areas ──
  { word: "PARLIAMENT", local: true, hint: "Parliament Hill on Hampstead Heath — sweeping views of London from NW5" },
  { word: "HAMPSTEAD",  local: true, hint: "Hampstead Heath, the vast park on NW5's doorstep" },
  { word: "TUFNELL",    local: true, hint: "Tufnell Park, the area just west of Kentish Town" },
  { word: "GOSPEL",     local: true, hint: "Gospel Oak, the neighbourhood between Kentish Town and Hampstead" },
  { word: "SWAINS",     local: true, hint: "Swain's Lane NW6 — the steep lane up to Highgate Cemetery" },
  { word: "CAMDEN",     local: true, hint: "Camden, the famous market district just south of Kentish Town" },
  { word: "CHALK",      local: true, hint: "Chalk Farm, the area just south-west of Kentish Town" },
  { word: "FLEET",      local: true, hint: "The River Fleet — runs underground beneath Kentish Town Road to this day" },
  { word: "LIDO",       local: true, hint: "Hampstead Lido — open-air pool on the Heath, beloved by NW5 swimmers" },
  { word: "CITYFARM",   local: true, hint: "Kentish Town City Farm, Cressfield Close — urban farm since 1972" },
  { word: "CRESSFIELD", local: true, hint: "Cressfield Close NW5, home of Kentish Town City Farm" },
  { word: "HEATH",      local: true, hint: "Hampstead Heath, the ancient park on NW5's doorstep" },
  { word: "VALE",       local: true, hint: "Vale of Health — the secluded hamlet within Hampstead Heath" },
  // ── Famous residents & culture ──
  { word: "MARX",       local: true, hint: "Karl Marx lived at 46 Grafton Terrace NW5 from 1856 to 1883" },
  { word: "ORWELL",     local: true, hint: "George Orwell lived in NW5 — author of 1984 and Animal Farm" },
  { word: "PHOEBE",     local: true, hint: "Phoebe Waller-Bridge, creator of Fleabag, is from the Kentish Town area" },
  { word: "FORUM",      local: true, hint: "The Forum, legendary music venue on Highgate Road NW5 (formerly Town & Country Club)" },
  { word: "OVERGROUND", local: true, hint: "London Overground — stops at Kentish Town West and Gospel Oak" },
  { word: "STPANCRAS",  local: true, hint: "St Pancras, the old borough that covered Kentish Town" },
  // ── Local vibe ──
  { word: "VINYL",      local: true, hint: "Vinyl — record shops are a staple of the Camden/Kentish Town area" },
  { word: "INDIE",      local: true, hint: "Indie music — what the Forum and Bull & Gate were built on" },
  { word: "ARTIST",     local: true, hint: "The Secret Artist NW5 — leaves small paintings around Kentish Town (secretartistnw5.com)" },
  { word: "MURAL",      local: true, hint: "Murals and street art — a Secret Artist NW5 speciality" },
  { word: "BUSKER",     local: true, hint: "Buskers outside Kentish Town tube station" },
  { word: "FOXES",      local: true, hint: "Urban foxes — practically mascots of NW5" },
  { word: "CRAFT",      local: true, hint: "Craft beer — The Grafton and Junction Tavern are temples to it" },
  { word: "BRUNCH",     local: true, hint: "Brunch — a religion in Kentish Town on Sunday mornings" },
  { word: "ALLOTMENT",  local: true, hint: "Allotments — prized plots scattered around NW5" },
  { word: "KOSSOFFS",   local: true, hint: "Kossoff's, the brilliant bakery on Kentish Town Road — coffee and pastries" },
  { word: "POTTERY",    local: true, hint: "Social Pottery NW5 — workshops on the Kentish Town high street" },
  { word: "BOOKSHOP",   local: true, hint: "The independent bookshop at 207 Kentish Town Road NW5" },
  { word: "HALFCUT",    local: true, hint: "Half Cut Market, Kentish Town — great cocktails, standing room only" },
  { word: "PATRON",     local: true, hint: "Patron brasserie on Fortess Road NW5 — Parisian cooking, local crowd" },
];

// ── General English filler words (varied lengths 4–9 letters) ────────────────
const FILLER_WORDS: { word: string; local: false }[] = [
  "ABOUT","ABOVE","AFTER","AGREE","ANGEL","ANGER","APART","APPLE","ARENA",
  "ARISE","AUDIO","AVOID","BACON","BADGE","BASIC","BASIN","BEACH","BEGIN",
  "BELOW","BENCH","BLEND","BLOCK","BLOOD","BOARD","BRAVE","BREAD","BREAK",
  "BRICK","BRING","BROAD","BROWN","BUILD","BUILT","BURST","CABLE","CARRY",
  "CAUSE","CEDAR","CHAIN","CHAIR","CHARM","CHART","CHASE","CHECK","CHIEF",
  "CHINA","CLAIM","CLASH","CLEAN","CLEAR","CLOSE","CLOUD","COACH","COAST",
  "CORAL","COUNT","COVER","CRANE","CRASH","CREAM","CROSS","CRUSH","CYCLE",
  "DAILY","DANCE","DEBUT","DEPTH","DISCO","DODGE","DOUGH","DRAFT","DRAIN",
  "DRAMA","DREAM","DRESS","DRINK","DRIVE","DRUMS","EAGLE","EARLY","EARTH",
  "ELITE","EMPTY","ENJOY","ENTER","EQUAL","ERROR","EVENT","EVERY","EXACT",
  "EXTRA","FABLE","FANCY","FAULT","FEAST","FENCE","FEVER","FIELD","FINAL",
  "FIRST","FIXED","FLAME","FLASH","FLESH","FLOAT","FLOOD","FLOOR","FLORA",
  "FLOUR","FORCE","FOUND","FRAME","FRANK","FRESH","FRONT","FROST","FRUIT",
  "GAMES","GAUGE","GHOST","GIANT","GLASS","GLOBE","GLORY","GLOSS","GLOVE",
  "GRACE","GRADE","GRAIN","GRAND","GRANT","GRAPE","GRASP","GRASS","GRAVE",
  "GREAT","GREEN","GREET","GUARD","GUESS","GUIDE","HAPPY","HARSH","HASTE",
  "HEART","HEAVY","HENCE","HERBS","HOLLY","HONEY","HONOR","HOTEL","HOUSE",
  "HUMAN","HUMOR","IMAGE","IONIC","IRONY","IVORY","JEWEL","JUICE","KARMA",
  "KNIFE","KNOWN","LABEL","LANCE","LASER","LATER","LAUGH","LAYER","LEARN",
  "LEAST","LEAVE","LEGAL","LEMON","LEVEL","LIGHT","LINER","LINKS","LIVER",
  "LODGE","LOGIC","LOOSE","LOVER","LOWER","LUCKY","LUNCH","LYRIC","MAGIC",
  "MAJOR","MAKER","MANGO","MAPLE","MARCH","MATCH","MEDAL","MEDIA","MERCY",
  "METAL","MIGHT","MINOR","MODEL","MONEY","MONTH","MORAL","MOVIE","MUSIC",
  "NAIVE","NEEDS","NERVE","NEVER","NOBLE","NOISE","NOVEL","NURSE","OCCUR",
  "OCEAN","OLIVE","ONSET","OPERA","ORDER","ORGAN","OTHER","OUTER","OXIDE",
  "OZONE","PANEL","PANIC","PAPER","PARTY","PASTA","PATCH","PAUSE","PEACE",
  "PEARL","PEDAL","PENNY","PERCH","PHASE","PHONE","PHOTO","PIANO","PIECE",
  "PILOT","PIZZA","PLACE","PLANE","PLANT","PLATE","PLAZA","PLUCK","POINT",
  "POLAR","POWER","PRESS","PRICE","PRIDE","PRIME","PRINT","PRIOR","PRIZE",
  "PROSE","PROUD","PULSE","PURSE","QUEEN","QUERY","QUICK","QUIET","RADAR",
  "RADIO","RAISE","RALLY","RANGE","RAPID","REACH","REACT","READY","REALM",
  "REBEL","REFER","REIGN","RELAX","RELAY","RELIC","REMIX","RISKY","RIVAL",
  "RIVER","ROAST","ROBIN","ROMAN","ROUND","ROUTE","ROYAL","RUGBY","RULER",
  "RURAL","SADLY","SAINT","SAUCE","SCALE","SCARE","SCENE","SCORE","SCOUT",
  "SEIZE","SERVE","SEVEN","SHAKE","SHAPE","SHARE","SHARP","SHELF","SHELL",
  "SHIFT","SHINE","SHIRT","SHOCK","SHORT","SIGHT","SINCE","SKILL","SLOPE",
  "SMALL","SMART","SMASH","SMILE","SMOKE","SOLAR","SOLID","SOLVE","SONIC",
  "SORRY","SOUND","SPACE","SPARE","SPARK","SPEAK","SPEED","SPEND","SPICE",
  "SPINE","SPITE","SPLIT","SPORT","STACK","STAFF","STAIR","STAND","STARE",
  "STARK","START","STATE","STEAL","STEAM","STEEL","STEER","STERN","STOCK",
  "STONE","STORE","STORM","STORY","STRIP","STUDY","SUGAR","SUNNY","SUPER",
  "SURGE","SWIFT","SWING","SWORD","TABLE","TASTE","TEACH","TENSE","TERMS",
  "THREE","THROW","TIGER","TIMER","TIRED","TITLE","TOKEN","TOAST","TORCH",
  "TOTAL","TOUCH","TOUGH","TOWER","TOXIC","TRAIL","TRAIN","TRAIT","TRICK",
  "TROUT","TRULY","TRUST","TRUTH","TULIP","TUTOR","TWICE","TWIST","ULTRA",
  "UNDER","UNION","UNITE","UPPER","UPSET","URBAN","USAGE","UTTER","VALID",
  "VALOR","VALUE","VALVE","VAPOR","VAULT","VIOLA","VIRAL","VISIT","VITAL",
  "VIVID","VOCAL","VOICE","WASTE","WATCH","WATER","WEAVE","WEDGE","WEIRD",
  "WHEAT","WHITE","WHOLE","WIDER","WITTY","WOODS","WORLD","WORRY","WORTH",
  "YACHT","YIELD","YOUNG","YOUTH","ZEBRA",
  // 4-letter fillers
  "ACID","ACRE","AGED","ALSO","ALTO","ARCH","AREA","ARMY","ARTS","AVID",
  "AWAY","BACK","BAKE","BALD","BALL","BAND","BANK","BARE","BARK","BARN",
  "BASE","BATH","BEAM","BEAN","BEAR","BEAT","BEER","BELL","BELT","BEND",
  "BEST","BIRD","BITE","BLOW","BOAT","BODY","BOLD","BOLT","BOND","BONE",
  "BOOK","BOOM","BOOT","BORE","BORN","BOSS","BOTH","BOWL","BURN","CAGE",
  "CAKE","CALL","CALM","CAMP","CARD","CARE","CART","CASE","CASH","CAST",
  "CAVE","CELL","CENT","CHAT","CHIP","CITY","CLAM","CLAY","CLIP","CLUB",
  "CLUE","COAL","COAT","CODE","COIN","COLD","COME","CONE","COOK","COOL",
  "COPE","COPY","CORD","CORE","CORK","CORN","COST","COVE","CREW","CROP",
  "CROW","CUBE","CURB","CURE","CURL","CUTE","DALE","DAME","DARE","DARK",
  "DART","DATA","DATE","DAWN","DAYS","DEAD","DEAF","DEAL","DEAR","DECK",
  "DEED","DEEP","DEER","DENY","DESK","DIAL","DIET","DIGS","DIME","DINE",
  "DIRT","DISH","DISK","DOCK","DONE","DOOR","DOSE","DOVE","DOWN","DROP",
  "DRUM","DUAL","DUKE","DULL","DUSK","DUST","DUTY","EARL","EARN","EASE",
  "EAST","EDGE","ELSE","EMIT","EPIC","EVEN","EVER","EVIL","EXAM","EXIT",
  "FACE","FACT","FAIL","FAIR","FALL","FAME","FARM","FAST","FATE","FEED",
  "FEEL","FEET","FILE","FILL","FILM","FINE","FIRE","FISH","FIST","FLAG",
  "FLAT","FLAW","FLEW","FLEX","FLIP","FLOW","FOAM","FOLD","FOLK","FOND",
  "FONT","FOOD","FOOL","FORD","FORE","FORK","FORM","FORT","FOUL","FREE",
  "FROM","FROG","FUEL","FULL","FUND","FURY","FUSE","GAIN","GALE","GALL",
  "GAZE","GEAR","GENE","GIFT","GILT","GIVE","GLAD","GLEN","GLOW","GLUE",
  "GOAL","GOAT","GOLD","GOLF","GOOD","GORE","GOWN","GRAB","GRAY","GREW",
  "GRID","GRIM","GRIN","GRIP","GRIT","GROW","GULF","GUST","HACK","HAIL",
  "HAIR","HALF","HALL","HALT","HAND","HANG","HARD","HARE","HARM","HATE",
  "HAVE","HAZE","HEAD","HEAL","HEAP","HEAR","HEAT","HEEL","HEIR","HELD",
  "HELM","HELP","HERD","HERE","HERO","HIGH","HINT","HIRE","HOLD","HOLE",
  "HOME","HOOD","HOOK","HOPE","HORN","HOST","HOUR","HUNG","HUNT","HURT",
].map((w) => ({ word: w, local: false as const }));

// Dedupe — local words take precedence
const localSet = new Set(KT_WORDS.map((w) => w.word));
const FILLER_DEDUPED = FILLER_WORDS.filter((f) => !localSet.has(f.word));
const WORD_POOL: { word: string; local: boolean; hint?: string }[] = [
  ...KT_WORDS,
  ...FILLER_DEDUPED,
];

// ── Crossword compiler ─────────────────────────────────────────────────────────
type Grid = string[][];
type Placement = {
  word: string;
  local: boolean;
  hint?: string;
  direction: "across" | "down";
  row: number;
  col: number;
};

function emptyGrid(): Grid {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill(" "));
}

function canPlace(
  grid: Grid,
  word: string,
  direction: "across" | "down",
  row: number,
  col: number,
  isFirst: boolean
): boolean {
  const len = word.length;
  if (direction === "across" && col + len > SIZE) return false;
  if (direction === "down" && row + len > SIZE) return false;

  let intersections = 0;
  for (let i = 0; i < len; i++) {
    const r = direction === "across" ? row : row + i;
    const c = direction === "across" ? col + i : col;
    const cell = grid[r][c];
    if (cell === " ") {
      if (direction === "across") {
        if (r > 0 && grid[r - 1][c] !== " " && grid[r - 1][c] !== "#") return false;
        if (r < SIZE - 1 && grid[r + 1][c] !== " " && grid[r + 1][c] !== "#") return false;
      } else {
        if (c > 0 && grid[r][c - 1] !== " " && grid[r][c - 1] !== "#") return false;
        if (c < SIZE - 1 && grid[r][c + 1] !== " " && grid[r][c + 1] !== "#") return false;
      }
    } else if (cell === word[i]) {
      intersections++;
    } else {
      return false;
    }
  }

  if (direction === "across") {
    if (col > 0 && grid[row][col - 1] !== " ") return false;
    if (col + len < SIZE && grid[row][col + len] !== " ") return false;
  } else {
    if (row > 0 && grid[row - 1][col] !== " ") return false;
    if (row + len < SIZE && grid[row + len][col] !== " ") return false;
  }

  return isFirst || intersections > 0;
}

function placeWord(
  grid: Grid,
  word: string,
  direction: "across" | "down",
  row: number,
  col: number
): Grid {
  const next = grid.map((r) => [...r]);
  for (let i = 0; i < word.length; i++) {
    const r = direction === "across" ? row : row + i;
    const c = direction === "across" ? col + i : col;
    next[r][c] = word[i];
  }
  return next;
}

function buildCrossword(): { grid: Grid; placements: Placement[] } | null {
  // Shuffle local words, then fillers
  const ktShuffled = [...KT_WORDS].sort(() => Math.random() - 0.5);
  const fillShuffled = [...FILLER_DEDUPED].sort(() => Math.random() - 0.5);
  // 80% chance of picking from local pool each attempt
  const weightedPool = [
    ...ktShuffled, ...ktShuffled, ...ktShuffled, ...ktShuffled,
    ...fillShuffled,
  ];

  const used = new Set<string>();
  let grid = emptyGrid();
  const placements: Placement[] = [];

  // First word: always a local word, 6–10 letters, placed horizontally near the centre
  const starters = KT_WORDS.filter((w) => w.word.length >= 6 && w.word.length <= 10);
  if (starters.length === 0) return null;
  const first = starters[Math.floor(Math.random() * starters.length)];
  const startRow = 3 + Math.floor(Math.random() * 5); // rows 3–7 (centre-ish)
  const startCol = Math.max(0, Math.floor((SIZE - first.word.length) / 2) + Math.floor(Math.random() * 3) - 1);
  if (startCol + first.word.length > SIZE) return null;

  grid = placeWord(grid, first.word, "across", startRow, startCol);
  placements.push({ word: first.word, local: true, hint: first.hint, direction: "across", row: startRow, col: startCol });
  used.add(first.word);

  const maxWords = 26;
  let attempts = 0;
  const maxAttempts = 8000;

  while (placements.length < maxWords && attempts < maxAttempts) {
    attempts++;
    const entry = weightedPool[Math.floor(Math.random() * weightedPool.length)];
    if (used.has(entry.word)) continue;

    const possiblePlacements: { direction: "across" | "down"; row: number; col: number }[] = [];

    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const cell = grid[r][c];
        if (cell === " ") continue;
        for (let i = 0; i < entry.word.length; i++) {
          if (entry.word[i] !== cell) continue;
          for (const dir of ["across", "down"] as const) {
            const row = dir === "across" ? r : r - i;
            const col = dir === "down" ? c : c - i;
            if (row < 0 || col < 0) continue;
            if (canPlace(grid, entry.word, dir, row, col, false)) {
              possiblePlacements.push({ direction: dir, row, col });
            }
          }
        }
      }
    }

    if (possiblePlacements.length === 0) continue;

    const pick = possiblePlacements[Math.floor(Math.random() * possiblePlacements.length)];
    grid = placeWord(grid, entry.word, pick.direction, pick.row, pick.col);
    placements.push({
      word: entry.word,
      local: entry.local,
      hint: (entry as any).hint,
      direction: pick.direction,
      row: pick.row,
      col: pick.col,
    });
    used.add(entry.word);
  }

  const localCount = placements.filter((p) => p.local).length;
  const total = placements.length;
  // Need 40%+ local AND at least 10 words total
  if (total < 10 || localCount / total < 0.4) return null;

  const finalGrid = grid.map((row) => row.map((cell) => (cell === " " ? "#" : cell)));

  return { grid: finalGrid, placements };
}

// ── Number the grid ────────────────────────────────────────────────────────────
function extractEntries(placements: Placement[], grid: string[][]) {
  const numbers: number[][] = Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
  let num = 0;

  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (grid[r][c] === "#") continue;
      const startsAcross =
        (c === 0 || grid[r][c - 1] === "#") && c + 1 < SIZE && grid[r][c + 1] !== "#";
      const startsDown =
        (r === 0 || grid[r - 1][c] === "#") && r + 1 < SIZE && grid[r + 1][c] !== "#";
      if (startsAcross || startsDown) {
        numbers[r][c] = ++num;
      }
    }
  }

  const across = placements
    .filter((p) => p.direction === "across")
    .map((p) => ({ number: numbers[p.row][p.col], row: p.row, col: p.col, answer: p.word, local: p.local, hint: p.hint }))
    .filter((e) => e.number > 0)
    .sort((a, b) => a.number - b.number);

  const down = placements
    .filter((p) => p.direction === "down")
    .map((p) => ({ number: numbers[p.row][p.col], row: p.row, col: p.col, answer: p.word, local: p.local, hint: p.hint }))
    .filter((e) => e.number > 0)
    .sort((a, b) => a.number - b.number);

  return { across, down };
}

// ── Clue generation ────────────────────────────────────────────────────────────
async function generateClues(
  entries: { direction: string; number: number; answer: string; local: boolean; hint?: string }[],
  date: string
): Promise<Record<string, string>> {
  const wordList = entries
    .map((e) => {
      const key = `${e.number}${e.direction === "across" ? "A" : "D"}`;
      const localTag = e.hint ? ` [LOCAL: ${e.hint}]` : "";
      return `${key}: ${e.answer}${localTag}`;
    })
    .join("\n");

  const response = await client.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 2500,
    messages: [
      {
        role: "user",
        content: `You are writing clues for a daily crossword published in Kentish Town, London NW5 (${date}).

RULES:
- For words marked [LOCAL: ...], use the provided context to write a witty, specific clue about that exact pub/street/landmark. Make the clue feel like it comes from someone who genuinely lives there — warm, knowing, slightly cheeky. The clue should REWARD local knowledge.
- For other words, write a standard short crossword clue (cryptic or straight, under 8 words).
- Never use the answer word in the clue.
- Keep it fun — this is a gift for a Kentish Town obsessive.

Return ONLY a JSON object: {"1A": "clue text", "2D": "clue text", ...}

Words:
${wordList}`,
      },
    ],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "{}";
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return {};
  try {
    return JSON.parse(match[0]);
  } catch {
    return {};
  }
}

// ── Generate full puzzle ────────────────────────────────────────────────────────
async function generatePuzzle(date: string): Promise<object> {
  let result = null;
  for (let attempt = 0; attempt < 120; attempt++) {
    result = buildCrossword();
    if (result) break;
  }
  if (!result) throw new Error("Could not build crossword after 40 attempts");

  const { grid, placements } = result;
  const { across, down } = extractEntries(placements, grid);

  const localWords = placements.filter((p) => p.local).map((p) => p.word);
  const pct = Math.round((localWords.length / placements.length) * 100);
  console.log(`  ${placements.length} words, ${pct}% local: ${localWords.join(", ")}`);

  const allEntries = [
    ...across.map((e) => ({ ...e, direction: "across" })),
    ...down.map((e) => ({ ...e, direction: "down" })),
  ];

  const clues = await generateClues(allEntries, date);

  return {
    date,
    title: "Kentish Town Daily Crossword",
    size: SIZE,
    grid,
    across: across.map((e) => ({
      number: e.number,
      row: e.row,
      col: e.col,
      answer: e.answer,
      clue: clues[`${e.number}A`] || e.answer,
    })),
    down: down.map((e) => ({
      number: e.number,
      row: e.row,
      col: e.col,
      answer: e.answer,
      clue: clues[`${e.number}D`] || e.answer,
    })),
  };
}

// ── Main ────────────────────────────────────────────────────────────────────────
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
      console.log(`${date} already exists, skipping.`);
      continue;
    }
    console.log(`Generating ${date}...`);
    try {
      const puzzle = await generatePuzzle(date);
      fs.writeFileSync(filePath, JSON.stringify(puzzle, null, 2));
      console.log(`✓ ${date}`);
    } catch (err) {
      console.error(`✗ ${date}:`, (err as Error).message);
    }
  }
}

main();
