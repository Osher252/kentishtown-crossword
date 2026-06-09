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

// ── Grid size ──────────────────────────────────────────────────────────────────
const SIZE = 12;

// ── Kentish Town word pool (words 4–12 letters, uppercase) ────────────────────
// Each word tagged with whether it's local (gets a KT-flavoured clue)
const WORD_POOL: { word: string; local: boolean }[] = [
  // Strongly local NW5 / Kentish Town references
  { word: "PINEAPPLE", local: true },   // The Pineapple pub
  { word: "FORUM", local: true },       // The Forum music venue
  { word: "HIGHGATE", local: true },    // Highgate village / cemetery
  { word: "PARLIAMENT", local: true },  // Parliament Hill
  { word: "HAMPSTEAD", local: true },   // Hampstead Heath
  { word: "GOSPEL", local: true },      // Gospel Oak
  { word: "TUFNELL", local: true },     // Tufnell Park
  { word: "CAMDEN", local: true },      // Camden
  { word: "KENTISH", local: true },     // Kentish Town
  { word: "LEVERTON", local: true },    // Leverton Street (Pineapple pub)
  { word: "SWAINS", local: true },      // Swain's Lane
  { word: "HEATH", local: true },       // Hampstead Heath
  { word: "CANAL", local: true },       // Regent's Canal
  { word: "OVERGROUND", local: true },  // London Overground
  { word: "INDIE", local: true },       // indie music scene
  { word: "MURAL", local: true },       // Secret Artist NW5 murals
  { word: "GIGS", local: true },        // live music
  { word: "LIDO", local: true },        // Hampstead Lido
  { word: "PONDS", local: true },       // bathing ponds
  { word: "VALE", local: true },        // Vale of Health
  { word: "CHALK", local: true },       // Chalk Farm
  { word: "MANOR", local: true },       // manor house feel
  { word: "LANES", local: true },       // cycle lanes
  { word: "GROVE", local: true },       // Montpelier Grove etc
  { word: "HILLS", local: true },       // Parliament Hill
  { word: "RISEN", local: true },       // York Rise
  { word: "OAKEN", local: true },       // Gospel Oak
  { word: "NORTH", local: true },       // North London
  { word: "VINYL", local: true },       // record shops
  { word: "CRAFT", local: true },       // craft beer bars
  { word: "BRUNCH", local: true },      // brunch culture
  { word: "FOXES", local: true },       // urban foxes
  { word: "BUSKER", local: true },      // street musicians
  { word: "ARTIST", local: true },      // Secret Artist NW5
  { word: "ALLEY", local: true },       // various alleys
  { word: "BIKES", local: true },       // cycling
  { word: "PARKS", local: true },       // local parks
  { word: "PATHS", local: true },       // Heath footpaths
  { word: "YARDS", local: true },       // courtyards
  { word: "LOCAL", local: true },       // the local pub
  { word: "VENUE", local: true },       // live venues
  { word: "BANDS", local: true },       // local bands
  { word: "NIGHT", local: true },       // night out
  { word: "CROWD", local: true },       // gig crowd
  { word: "TRACK", local: true },       // music / running track
  { word: "STAGE", local: true },       // the stage
  { word: "SIGNS", local: true },       // street signs
  { word: "PAINT", local: true },       // street art
  // Common English filler words (varied lengths for grid flexibility)
  { word: "ABOUT", local: false },
  { word: "ABOVE", local: false },
  { word: "AFTER", local: false },
  { word: "AGREE", local: false },
  { word: "ANGEL", local: false },
  { word: "ANGER", local: false },
  { word: "ANGLE", local: false },
  { word: "APART", local: false },
  { word: "APPLE", local: false },
  { word: "ARENA", local: false },
  { word: "ARGUE", local: false },
  { word: "ARISE", local: false },
  { word: "ATLAS", local: false },
  { word: "AUDIO", local: false },
  { word: "AUDIT", local: false },
  { word: "AVOID", local: false },
  { word: "BACON", local: false },
  { word: "BADGE", local: false },
  { word: "BASIC", local: false },
  { word: "BASIN", local: false },
  { word: "BEACH", local: false },
  { word: "BEGIN", local: false },
  { word: "BELOW", local: false },
  { word: "BENCH", local: false },
  { word: "BLEND", local: false },
  { word: "BLOCK", local: false },
  { word: "BLOOD", local: false },
  { word: "BLOWN", local: false },
  { word: "BOARD", local: false },
  { word: "BRAVE", local: false },
  { word: "BREAD", local: false },
  { word: "BREAK", local: false },
  { word: "BRICK", local: false },
  { word: "BRING", local: false },
  { word: "BROAD", local: false },
  { word: "BROWN", local: false },
  { word: "BUILD", local: false },
  { word: "BUILT", local: false },
  { word: "BURST", local: false },
  { word: "CABLE", local: false },
  { word: "CARRY", local: false },
  { word: "CAUSE", local: false },
  { word: "CEDAR", local: false },
  { word: "CHAIN", local: false },
  { word: "CHAIR", local: false },
  { word: "CHARM", local: false },
  { word: "CHART", local: false },
  { word: "CHASE", local: false },
  { word: "CHECK", local: false },
  { word: "CHIEF", local: false },
  { word: "CHINA", local: false },
  { word: "CLAIM", local: false },
  { word: "CLASH", local: false },
  { word: "CLEAN", local: false },
  { word: "CLEAR", local: false },
  { word: "CLOSE", local: false },
  { word: "CLOUD", local: false },
  { word: "COACH", local: false },
  { word: "COAST", local: false },
  { word: "CORAL", local: false },
  { word: "COUNT", local: false },
  { word: "COVER", local: false },
  { word: "CRANE", local: false },
  { word: "CRASH", local: false },
  { word: "CREAM", local: false },
  { word: "CROSS", local: false },
  { word: "CRUSH", local: false },
  { word: "CYCLE", local: false },
  { word: "DAILY", local: false },
  { word: "DANCE", local: false },
  { word: "DEBUT", local: false },
  { word: "DEPTH", local: false },
  { word: "DISCO", local: false },
  { word: "DODGE", local: false },
  { word: "DOUGH", local: false },
  { word: "DRAFT", local: false },
  { word: "DRAIN", local: false },
  { word: "DRAMA", local: false },
  { word: "DREAM", local: false },
  { word: "DRESS", local: false },
  { word: "DRINK", local: false },
  { word: "DRIVE", local: false },
  { word: "DRUMS", local: false },
  { word: "EAGLE", local: false },
  { word: "EARLY", local: false },
  { word: "EARTH", local: false },
  { word: "ELITE", local: false },
  { word: "EMPTY", local: false },
  { word: "ENJOY", local: false },
  { word: "ENTER", local: false },
  { word: "EQUAL", local: false },
  { word: "ERROR", local: false },
  { word: "EVENT", local: false },
  { word: "EVERY", local: false },
  { word: "EXACT", local: false },
  { word: "EXTRA", local: false },
  { word: "FABLE", local: false },
  { word: "FANCY", local: false },
  { word: "FAULT", local: false },
  { word: "FEAST", local: false },
  { word: "FENCE", local: false },
  { word: "FEVER", local: false },
  { word: "FIELD", local: false },
  { word: "FINAL", local: false },
  { word: "FIRST", local: false },
  { word: "FIXED", local: false },
  { word: "FLAME", local: false },
  { word: "FLASH", local: false },
  { word: "FLESH", local: false },
  { word: "FLOAT", local: false },
  { word: "FLOOD", local: false },
  { word: "FLOOR", local: false },
  { word: "FLORA", local: false },
  { word: "FLOUR", local: false },
  { word: "FORCE", local: false },
  { word: "FOUND", local: false },
  { word: "FRANC", local: false },
  { word: "FRAME", local: false },
  { word: "FRANK", local: false },
  { word: "FRESH", local: false },
  { word: "FRONT", local: false },
  { word: "FROST", local: false },
  { word: "FRUIT", local: false },
  { word: "GAMES", local: false },
  { word: "GAUGE", local: false },
  { word: "GHOST", local: false },
  { word: "GIANT", local: false },
  { word: "GLASS", local: false },
  { word: "GLOBE", local: false },
  { word: "GLORY", local: false },
  { word: "GLOSS", local: false },
  { word: "GLOVE", local: false },
  { word: "GRACE", local: false },
  { word: "GRADE", local: false },
  { word: "GRAIN", local: false },
  { word: "GRAND", local: false },
  { word: "GRANT", local: false },
  { word: "GRAPE", local: false },
  { word: "GRASP", local: false },
  { word: "GRASS", local: false },
  { word: "GRAVE", local: false },
  { word: "GREAT", local: false },
  { word: "GREEN", local: false },
  { word: "GREET", local: false },
  { word: "GUARD", local: false },
  { word: "GUESS", local: false },
  { word: "GUIDE", local: false },
  { word: "HAPPY", local: false },
  { word: "HARSH", local: false },
  { word: "HASTE", local: false },
  { word: "HEART", local: false },
  { word: "HEAVY", local: false },
  { word: "HENCE", local: false },
  { word: "HERBS", local: false },
  { word: "HOLLY", local: false },
  { word: "HONEY", local: false },
  { word: "HONOR", local: false },
  { word: "HOTEL", local: false },
  { word: "HOUSE", local: false },
  { word: "HUMAN", local: false },
  { word: "HUMOR", local: false },
  { word: "IMAGE", local: false },
  { word: "IONIC", local: false },
  { word: "IRONY", local: false },
  { word: "IVORY", local: false },
  { word: "JEWEL", local: false },
  { word: "JUICE", local: false },
  { word: "KARMA", local: false },
  { word: "KNIFE", local: false },
  { word: "KNOWN", local: false },
  { word: "LABEL", local: false },
  { word: "LANCE", local: false },
  { word: "LASER", local: false },
  { word: "LATER", local: false },
  { word: "LAUGH", local: false },
  { word: "LAYER", local: false },
  { word: "LEARN", local: false },
  { word: "LEAST", local: false },
  { word: "LEAVE", local: false },
  { word: "LEGAL", local: false },
  { word: "LEMON", local: false },
  { word: "LEVEL", local: false },
  { word: "LIGHT", local: false },
  { word: "LINER", local: false },
  { word: "LINKS", local: false },
  { word: "LIVER", local: false },
  { word: "LODGE", local: false },
  { word: "LOGIC", local: false },
  { word: "LOOSE", local: false },
  { word: "LOVER", local: false },
  { word: "LOWER", local: false },
  { word: "LUCKY", local: false },
  { word: "LUNCH", local: false },
  { word: "LYRIC", local: false },
  { word: "MAGIC", local: false },
  { word: "MAJOR", local: false },
  { word: "MAKER", local: false },
  { word: "MANGO", local: false },
  { word: "MAPLE", local: false },
  { word: "MARCH", local: false },
  { word: "MATCH", local: false },
  { word: "MEDAL", local: false },
  { word: "MEDIA", local: false },
  { word: "MERCY", local: false },
  { word: "METAL", local: false },
  { word: "MIGHT", local: false },
  { word: "MINOR", local: false },
  { word: "MODEL", local: false },
  { word: "MONEY", local: false },
  { word: "MONTH", local: false },
  { word: "MORAL", local: false },
  { word: "MOVIE", local: false },
  { word: "MUSIC", local: false },
  { word: "NAIVE", local: false },
  { word: "NEEDS", local: false },
  { word: "NERVE", local: false },
  { word: "NEVER", local: false },
  { word: "NOBLE", local: false },
  { word: "NOISE", local: false },
  { word: "NOVEL", local: false },
  { word: "NURSE", local: false },
  { word: "OCCUR", local: false },
  { word: "OCEAN", local: false },
  { word: "OLIVE", local: false },
  { word: "ONSET", local: false },
  { word: "OPERA", local: false },
  { word: "ORDER", local: false },
  { word: "ORGAN", local: false },
  { word: "OTHER", local: false },
  { word: "OUTER", local: false },
  { word: "OXIDE", local: false },
  { word: "OZONE", local: false },
  { word: "PANEL", local: false },
  { word: "PANIC", local: false },
  { word: "PAPER", local: false },
  { word: "PARTY", local: false },
  { word: "PASTA", local: false },
  { word: "PATCH", local: false },
  { word: "PAUSE", local: false },
  { word: "PEACE", local: false },
  { word: "PEARL", local: false },
  { word: "PEDAL", local: false },
  { word: "PENNY", local: false },
  { word: "PERCH", local: false },
  { word: "PHASE", local: false },
  { word: "PHONE", local: false },
  { word: "PHOTO", local: false },
  { word: "PIANO", local: false },
  { word: "PIECE", local: false },
  { word: "PILOT", local: false },
  { word: "PIZZA", local: false },
  { word: "PLACE", local: false },
  { word: "PLANE", local: false },
  { word: "PLANT", local: false },
  { word: "PLATE", local: false },
  { word: "PLAZA", local: false },
  { word: "PLUCK", local: false },
  { word: "POINT", local: false },
  { word: "POLAR", local: false },
  { word: "POWER", local: false },
  { word: "PRESS", local: false },
  { word: "PRICE", local: false },
  { word: "PRIDE", local: false },
  { word: "PRIME", local: false },
  { word: "PRINT", local: false },
  { word: "PRIOR", local: false },
  { word: "PRIZE", local: false },
  { word: "PROSE", local: false },
  { word: "PROUD", local: false },
  { word: "PULSE", local: false },
  { word: "PURSE", local: false },
  { word: "QUEEN", local: false },
  { word: "QUERY", local: false },
  { word: "QUICK", local: false },
  { word: "QUIET", local: false },
  { word: "RADAR", local: false },
  { word: "RADIO", local: false },
  { word: "RAISE", local: false },
  { word: "RALLY", local: false },
  { word: "RANGE", local: false },
  { word: "RAPID", local: false },
  { word: "REACH", local: false },
  { word: "REACT", local: false },
  { word: "READY", local: false },
  { word: "REALM", local: false },
  { word: "REBEL", local: false },
  { word: "REFER", local: false },
  { word: "REIGN", local: false },
  { word: "RELAX", local: false },
  { word: "RELAY", local: false },
  { word: "RELIC", local: false },
  { word: "REMIX", local: false },
  { word: "RISKY", local: false },
  { word: "RIVAL", local: false },
  { word: "RIVER", local: false },
  { word: "ROAST", local: false },
  { word: "ROBIN", local: false },
  { word: "ROMAN", local: false },
  { word: "ROUND", local: false },
  { word: "ROUTE", local: false },
  { word: "ROYAL", local: false },
  { word: "RUGBY", local: false },
  { word: "RULER", local: false },
  { word: "RURAL", local: false },
  { word: "SADLY", local: false },
  { word: "SAINT", local: false },
  { word: "SAUCE", local: false },
  { word: "SCALE", local: false },
  { word: "SCARE", local: false },
  { word: "SCENE", local: false },
  { word: "SCORE", local: false },
  { word: "SCOUT", local: false },
  { word: "SEIZE", local: false },
  { word: "SERVE", local: false },
  { word: "SEVEN", local: false },
  { word: "SHAKE", local: false },
  { word: "SHAPE", local: false },
  { word: "SHARE", local: false },
  { word: "SHARP", local: false },
  { word: "SHELF", local: false },
  { word: "SHELL", local: false },
  { word: "SHIFT", local: false },
  { word: "SHINE", local: false },
  { word: "SHIRT", local: false },
  { word: "SHOCK", local: false },
  { word: "SHORT", local: false },
  { word: "SIGHT", local: false },
  { word: "SINCE", local: false },
  { word: "SKILL", local: false },
  { word: "SLOPE", local: false },
  { word: "SMALL", local: false },
  { word: "SMART", local: false },
  { word: "SMASH", local: false },
  { word: "SMILE", local: false },
  { word: "SMOKE", local: false },
  { word: "SOLAR", local: false },
  { word: "SOLID", local: false },
  { word: "SOLVE", local: false },
  { word: "SONIC", local: false },
  { word: "SORRY", local: false },
  { word: "SOUND", local: false },
  { word: "SPACE", local: false },
  { word: "SPARE", local: false },
  { word: "SPARK", local: false },
  { word: "SPEAK", local: false },
  { word: "SPEED", local: false },
  { word: "SPEND", local: false },
  { word: "SPICE", local: false },
  { word: "SPINE", local: false },
  { word: "SPITE", local: false },
  { word: "SPLIT", local: false },
  { word: "SPORT", local: false },
  { word: "STACK", local: false },
  { word: "STAFF", local: false },
  { word: "STAIR", local: false },
  { word: "STAND", local: false },
  { word: "STARE", local: false },
  { word: "STARK", local: false },
  { word: "START", local: false },
  { word: "STATE", local: false },
  { word: "STEAL", local: false },
  { word: "STEAM", local: false },
  { word: "STEEL", local: false },
  { word: "STEER", local: false },
  { word: "STERN", local: false },
  { word: "STOCK", local: false },
  { word: "STONE", local: false },
  { word: "STORE", local: false },
  { word: "STORM", local: false },
  { word: "STORY", local: false },
  { word: "STRIP", local: false },
  { word: "STUDY", local: false },
  { word: "SUGAR", local: false },
  { word: "SUNNY", local: false },
  { word: "SUPER", local: false },
  { word: "SURGE", local: false },
  { word: "SWIFT", local: false },
  { word: "SWING", local: false },
  { word: "SWORD", local: false },
  { word: "TABLE", local: false },
  { word: "TASTE", local: false },
  { word: "TEACH", local: false },
  { word: "TENSE", local: false },
  { word: "TERMS", local: false },
  { word: "THREE", local: false },
  { word: "THROW", local: false },
  { word: "TIGER", local: false },
  { word: "TIMER", local: false },
  { word: "TIRED", local: false },
  { word: "TITLE", local: false },
  { word: "TOKEN", local: false },
  { word: "TOAST", local: false },
  { word: "TORCH", local: false },
  { word: "TOTAL", local: false },
  { word: "TOUCH", local: false },
  { word: "TOUGH", local: false },
  { word: "TOWER", local: false },
  { word: "TOXIC", local: false },
  { word: "TRAIL", local: false },
  { word: "TRAIN", local: false },
  { word: "TRAIT", local: false },
  { word: "TRICK", local: false },
  { word: "TROUT", local: false },
  { word: "TRULY", local: false },
  { word: "TRUST", local: false },
  { word: "TRUTH", local: false },
  { word: "TULIP", local: false },
  { word: "TUTOR", local: false },
  { word: "TWICE", local: false },
  { word: "TWIST", local: false },
  { word: "ULTRA", local: false },
  { word: "UNDER", local: false },
  { word: "UNION", local: false },
  { word: "UNITE", local: false },
  { word: "UPPER", local: false },
  { word: "UPSET", local: false },
  { word: "URBAN", local: false },
  { word: "USAGE", local: false },
  { word: "UTTER", local: false },
  { word: "VALID", local: false },
  { word: "VALOR", local: false },
  { word: "VALUE", local: false },
  { word: "VALVE", local: false },
  { word: "VAPOR", local: false },
  { word: "VAULT", local: false },
  { word: "VIOLA", local: false },
  { word: "VIRAL", local: false },
  { word: "VISIT", local: false },
  { word: "VITAL", local: false },
  { word: "VIVID", local: false },
  { word: "VOCAL", local: false },
  { word: "VOICE", local: false },
  { word: "WASTE", local: false },
  { word: "WATCH", local: false },
  { word: "WATER", local: false },
  { word: "WEAVE", local: false },
  { word: "WEDGE", local: false },
  { word: "WEIRD", local: false },
  { word: "WHEAT", local: false },
  { word: "WHITE", local: false },
  { word: "WHOLE", local: false },
  { word: "WIDER", local: false },
  { word: "WITTY", local: false },
  { word: "WOODS", local: false },
  { word: "WORLD", local: false },
  { word: "WORRY", local: false },
  { word: "WORTH", local: false },
  { word: "YACHT", local: false },
  { word: "YIELD", local: false },
  { word: "YOUNG", local: false },
  { word: "YOUTH", local: false },
  { word: "ZEBRA", local: false },
  // 4-letter words for short slots
  { word: "ACID", local: false },
  { word: "ACRE", local: false },
  { word: "AGED", local: false },
  { word: "AIDE", local: false },
  { word: "AILS", local: false },
  { word: "AIMS", local: false },
  { word: "AIRY", local: false },
  { word: "ALSO", local: false },
  { word: "ALTO", local: false },
  { word: "AMEN", local: false },
  { word: "ARCH", local: false },
  { word: "AREA", local: false },
  { word: "ARMY", local: false },
  { word: "ARTS", local: false },
  { word: "ASKS", local: false },
  { word: "AVID", local: false },
  { word: "AWAY", local: false },
  { word: "AWED", local: false },
  { word: "AXES", local: false },
  { word: "BACK", local: false },
  { word: "BAKE", local: false },
  { word: "BALD", local: false },
  { word: "BALE", local: false },
  { word: "BALL", local: false },
  { word: "BAND", local: false },
  { word: "BANK", local: false },
  { word: "BARE", local: false },
  { word: "BARK", local: false },
  { word: "BARN", local: false },
  { word: "BASE", local: false },
  { word: "BATH", local: false },
  { word: "BEAM", local: false },
  { word: "BEAN", local: false },
  { word: "BEAR", local: false },
  { word: "BEAT", local: false },
  { word: "BEEF", local: false },
  { word: "BEEN", local: false },
  { word: "BEER", local: false },
  { word: "BELL", local: false },
  { word: "BELT", local: false },
  { word: "BEND", local: false },
  { word: "BEST", local: false },
  { word: "BIRD", local: false },
  { word: "BITE", local: false },
  { word: "BLOW", local: false },
  { word: "BLUR", local: false },
  { word: "BOAT", local: false },
  { word: "BODY", local: false },
  { word: "BOLD", local: false },
  { word: "BOLT", local: false },
  { word: "BOND", local: false },
  { word: "BONE", local: false },
  { word: "BOOK", local: false },
  { word: "BOOM", local: false },
  { word: "BOOT", local: false },
  { word: "BORE", local: false },
  { word: "BORN", local: false },
  { word: "BOSS", local: false },
  { word: "BOTH", local: false },
  { word: "BOWL", local: false },
  { word: "BREW", local: false },
  { word: "BURN", local: false },
  { word: "CAFE", local: true },
  { word: "CAGE", local: false },
  { word: "CAKE", local: false },
  { word: "CALL", local: false },
  { word: "CALM", local: false },
  { word: "CAME", local: false },
  { word: "CAMP", local: false },
  { word: "CARD", local: false },
  { word: "CARE", local: false },
  { word: "CART", local: false },
  { word: "CASE", local: false },
  { word: "CASH", local: false },
  { word: "CAST", local: false },
  { word: "CAVE", local: false },
  { word: "CELL", local: false },
  { word: "CENT", local: false },
  { word: "CHAT", local: false },
  { word: "CHIP", local: false },
  { word: "CITE", local: false },
  { word: "CITY", local: false },
  { word: "CLAM", local: false },
  { word: "CLAP", local: false },
  { word: "CLAY", local: false },
  { word: "CLIP", local: false },
  { word: "CLUB", local: false },
  { word: "CLUE", local: false },
  { word: "COAL", local: false },
  { word: "COAT", local: false },
  { word: "CODE", local: false },
  { word: "COIL", local: false },
  { word: "COIN", local: false },
  { word: "COLD", local: false },
  { word: "COME", local: false },
  { word: "CONE", local: false },
  { word: "COOK", local: false },
  { word: "COOL", local: false },
  { word: "COPE", local: false },
  { word: "COPY", local: false },
  { word: "CORD", local: false },
  { word: "CORE", local: false },
  { word: "CORK", local: false },
  { word: "CORN", local: false },
  { word: "COST", local: false },
  { word: "COVE", local: false },
  { word: "CREW", local: false },
  { word: "CROP", local: false },
  { word: "CROW", local: false },
  { word: "CUBE", local: false },
  { word: "CURB", local: false },
  { word: "CURE", local: false },
  { word: "CURL", local: false },
  { word: "CUTE", local: false },
  { word: "DALE", local: false },
  { word: "DAME", local: false },
  { word: "DARE", local: false },
  { word: "DARK", local: false },
  { word: "DART", local: false },
  { word: "DATA", local: false },
  { word: "DATE", local: false },
  { word: "DAWN", local: false },
  { word: "DAYS", local: false },
  { word: "DEAD", local: false },
  { word: "DEAF", local: false },
  { word: "DEAL", local: false },
  { word: "DEAR", local: false },
  { word: "DECK", local: false },
  { word: "DEED", local: false },
  { word: "DEEP", local: false },
  { word: "DEER", local: false },
  { word: "DENY", local: false },
  { word: "DESK", local: false },
  { word: "DIAL", local: false },
  { word: "DIET", local: false },
  { word: "DIGS", local: false },
  { word: "DIME", local: false },
  { word: "DINE", local: false },
  { word: "DIRT", local: false },
  { word: "DISH", local: false },
  { word: "DISK", local: false },
  { word: "DOCK", local: false },
  { word: "DOES", local: false },
  { word: "DONE", local: false },
  { word: "DOOR", local: false },
  { word: "DOSE", local: false },
  { word: "DOVE", local: false },
  { word: "DOWN", local: false },
  { word: "DREW", local: false },
  { word: "DRIP", local: false },
  { word: "DROP", local: false },
  { word: "DRUM", local: false },
  { word: "DUAL", local: false },
  { word: "DUKE", local: false },
  { word: "DULL", local: false },
  { word: "DULY", local: false },
  { word: "DUSK", local: false },
  { word: "DUST", local: false },
  { word: "DUTY", local: false },
  { word: "EACH", local: false },
  { word: "EARL", local: false },
  { word: "EARN", local: false },
  { word: "EASE", local: false },
  { word: "EAST", local: false },
  { word: "EDGE", local: false },
  { word: "EELS", local: false },
  { word: "ELSE", local: false },
  { word: "EMIT", local: false },
  { word: "EPIC", local: false },
  { word: "EVEN", local: false },
  { word: "EVER", local: false },
  { word: "EVIL", local: false },
  { word: "EXAM", local: false },
  { word: "EXIT", local: false },
  { word: "EXPO", local: false },
  { word: "FACE", local: false },
  { word: "FACT", local: false },
  { word: "FAIL", local: false },
  { word: "FAIR", local: false },
  { word: "FALL", local: false },
  { word: "FAME", local: false },
  { word: "FARM", local: false },
  { word: "FAST", local: false },
  { word: "FATE", local: false },
  { word: "FEED", local: false },
  { word: "FEEL", local: false },
  { word: "FEET", local: false },
  { word: "FILE", local: false },
  { word: "FILL", local: false },
  { word: "FILM", local: false },
  { word: "FINE", local: false },
  { word: "FIRE", local: false },
  { word: "FISH", local: false },
  { word: "FIST", local: false },
  { word: "FLAG", local: false },
  { word: "FLAT", local: false },
  { word: "FLAW", local: false },
  { word: "FLEA", local: false },
  { word: "FLEW", local: false },
  { word: "FLEX", local: false },
  { word: "FLIP", local: false },
  { word: "FLOW", local: false },
  { word: "FOAM", local: false },
  { word: "FOLD", local: false },
  { word: "FOLK", local: false },
  { word: "FOND", local: false },
  { word: "FONT", local: false },
  { word: "FOOD", local: false },
  { word: "FOOL", local: false },
  { word: "FORD", local: false },
  { word: "FORE", local: false },
  { word: "FORK", local: false },
  { word: "FORM", local: false },
  { word: "FORT", local: false },
  { word: "FOUL", local: false },
  { word: "FREE", local: false },
  { word: "FROM", local: false },
  { word: "FROG", local: false },
  { word: "FUEL", local: false },
  { word: "FULL", local: false },
  { word: "FUND", local: false },
  { word: "FURY", local: false },
  { word: "FUSE", local: false },
  { word: "FUZZ", local: false },
  { word: "GAIN", local: false },
  { word: "GALE", local: false },
  { word: "GALL", local: false },
  { word: "GAZE", local: false },
  { word: "GEAR", local: false },
  { word: "GENE", local: false },
  { word: "GIFT", local: false },
  { word: "GILT", local: false },
  { word: "GIVE", local: false },
  { word: "GLAD", local: false },
  { word: "GLEN", local: false },
  { word: "GLOW", local: false },
  { word: "GLUE", local: false },
  { word: "GOAL", local: false },
  { word: "GOAT", local: false },
  { word: "GOLD", local: false },
  { word: "GOLF", local: false },
  { word: "GOOD", local: false },
  { word: "GORE", local: false },
  { word: "GOWN", local: false },
  { word: "GRAB", local: false },
  { word: "GRAY", local: false },
  { word: "GREW", local: false },
  { word: "GRID", local: false },
  { word: "GRIM", local: false },
  { word: "GRIN", local: false },
  { word: "GRIP", local: false },
  { word: "GRIT", local: false },
  { word: "GROW", local: false },
  { word: "GULF", local: false },
  { word: "GUST", local: false },
  { word: "GUYS", local: false },
  { word: "HACK", local: false },
  { word: "HAIL", local: false },
  { word: "HAIR", local: false },
  { word: "HALF", local: false },
  { word: "HALL", local: false },
  { word: "HALT", local: false },
  { word: "HAND", local: false },
  { word: "HANG", local: false },
  { word: "HARD", local: false },
  { word: "HARE", local: false },
  { word: "HARM", local: false },
  { word: "HATE", local: false },
  { word: "HAVE", local: false },
  { word: "HAZE", local: false },
  { word: "HEAD", local: false },
  { word: "HEAL", local: false },
  { word: "HEAP", local: false },
  { word: "HEAR", local: false },
  { word: "HEAT", local: false },
  { word: "HEEL", local: false },
  { word: "HEIR", local: false },
  { word: "HELD", local: false },
  { word: "HELM", local: false },
  { word: "HELP", local: false },
  { word: "HEMP", local: false },
  { word: "HERD", local: false },
  { word: "HERE", local: false },
  { word: "HERO", local: false },
  { word: "HIGH", local: false },
  { word: "HIKE", local: true },
  { word: "HINT", local: false },
  { word: "HIRE", local: false },
  { word: "HOLD", local: false },
  { word: "HOLE", local: false },
  { word: "HOME", local: false },
  { word: "HOOD", local: false },
  { word: "HOOK", local: false },
  { word: "HOPE", local: false },
  { word: "HORN", local: false },
  { word: "HOST", local: false },
  { word: "HOUR", local: false },
  { word: "HUMP", local: false },
  { word: "HUNG", local: false },
  { word: "HUNT", local: false },
  { word: "HURT", local: false },
  { word: "HYMN", local: false },
];

// ── Build word lookup by length ────────────────────────────────────────────────
const byLength = new Map<number, { word: string; local: boolean }[]>();
for (const entry of WORD_POOL) {
  const n = entry.word.length;
  if (!byLength.has(n)) byLength.set(n, []);
  byLength.get(n)!.push(entry);
}

// ── Crossword compiler ─────────────────────────────────────────────────────────
// 12×12 grid. We place words one at a time:
// 1. Start with the first (longest) KT word horizontally in the top area
// 2. For each subsequent word, find a cell in the grid that matches a letter
//    in the candidate word, and try to place it perpendicular through that cell
// 3. Accept placements that don't conflict and add intersections
// 4. Stop when we have enough words

type Grid = string[][];
type Placement = {
  word: string;
  local: boolean;
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
  col: number
): boolean {
  const len = word.length;
  // Bounds check
  if (direction === "across" && col + len > SIZE) return false;
  if (direction === "down" && row + len > SIZE) return false;

  let intersections = 0;
  for (let i = 0; i < len; i++) {
    const r = direction === "across" ? row : row + i;
    const c = direction === "across" ? col + i : col;
    const cell = grid[r][c];
    if (cell === " ") {
      // Empty cell — check there's no adjacent word running parallel
      if (direction === "across") {
        // Check cells above/below aren't occupied (no parallel words)
        if (r > 0 && grid[r - 1][c] !== " " && grid[r - 1][c] !== "#") return false;
        if (r < SIZE - 1 && grid[r + 1][c] !== " " && grid[r + 1][c] !== "#") return false;
      } else {
        if (c > 0 && grid[r][c - 1] !== " " && grid[r][c - 1] !== "#") return false;
        if (c < SIZE - 1 && grid[r][c + 1] !== " " && grid[r][c + 1] !== "#") return false;
      }
    } else if (cell === word[i]) {
      intersections++;
    } else {
      return false; // conflict
    }
  }

  // For the first word, no intersections needed; otherwise need at least 1
  // (checked externally)

  // Check cells before/after the word aren't occupied
  if (direction === "across") {
    if (col > 0 && grid[row][col - 1] !== " " && grid[row][col - 1] !== "#") return false;
    if (col + len < SIZE && grid[row][col + len] !== " " && grid[row][col + len] !== "#") return false;
  } else {
    if (row > 0 && grid[row - 1][col] !== " " && grid[row - 1][col] !== "#") return false;
    if (row + len < SIZE && grid[row + len][col] !== " " && grid[row + len][col] !== "#") return false;
  }

  return intersections > 0 || grid.every((r) => r.every((c) => c === " "));
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

function buildCrossword(): {
  grid: Grid;
  placements: Placement[];
} | null {
  // Shuffle + prefer local words first
  const allWords = [...WORD_POOL].sort((a, b) => {
    if (a.local !== b.local) return a.local ? -1 : 1;
    return Math.random() - 0.5;
  });

  const used = new Set<string>();
  let grid = emptyGrid();
  const placements: Placement[] = [];

  // Place first word (horizontal, near top-left, pick a 7–9 letter local word)
  const starters = allWords.filter(
    (w) => w.local && w.word.length >= 6 && w.word.length <= 9
  );
  if (starters.length === 0) return null;
  const first = starters[Math.floor(Math.random() * starters.length)];
  const startRow = 1;
  const startCol = Math.floor((SIZE - first.word.length) / 2);
  grid = placeWord(grid, first.word, "across", startRow, startCol);
  placements.push({
    word: first.word,
    local: first.local,
    direction: "across",
    row: startRow,
    col: startCol,
  });
  used.add(first.word);

  // Try to place up to 20 more words
  const maxWords = 20;
  let attempts = 0;
  const maxAttempts = 5000;

  while (placements.length < maxWords && attempts < maxAttempts) {
    attempts++;
    const candidate = allWords[Math.floor(Math.random() * allWords.length)];
    if (used.has(candidate.word)) continue;

    // Find possible placements by scanning grid for matching letters
    const possiblePlacements: {
      direction: "across" | "down";
      row: number;
      col: number;
    }[] = [];

    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const cell = grid[r][c];
        if (cell === " ") continue;
        // Check if this letter appears in the candidate word
        for (let i = 0; i < candidate.word.length; i++) {
          if (candidate.word[i] !== cell) continue;
          // Try placing the word perpendicular to existing words
          // (We scan all existing placements to pick the right direction)
          for (const dir of ["across", "down"] as const) {
            const row = dir === "across" ? r : r - i;
            const col = dir === "down" ? c : c - i;
            if (row < 0 || col < 0) continue;
            if (canPlace(grid, candidate.word, dir, row, col)) {
              possiblePlacements.push({ direction: dir, row, col });
            }
          }
        }
      }
    }

    if (possiblePlacements.length === 0) continue;

    // Pick a random valid placement
    const pick =
      possiblePlacements[Math.floor(Math.random() * possiblePlacements.length)];
    grid = placeWord(grid, candidate.word, pick.direction, pick.row, pick.col);
    placements.push({
      word: candidate.word,
      local: candidate.local,
      direction: pick.direction,
      row: pick.row,
      col: pick.col,
    });
    used.add(candidate.word);
  }

  // Require at least 8 words and at least 3 local ones
  const localCount = placements.filter((p) => p.local).length;
  if (placements.length < 8 || localCount < 3) return null;

  // Fill remaining empty cells with '#'
  const finalGrid = grid.map((row) =>
    row.map((cell) => (cell === " " ? "#" : cell))
  );

  return { grid: finalGrid, placements };
}

// ── Extract clue entries from placements ────────────────────────────────────────
function extractEntries(
  placements: Placement[],
  grid: string[][]
): {
  across: { number: number; row: number; col: number; answer: string; local: boolean }[];
  down: { number: number; row: number; col: number; answer: string; local: boolean }[];
} {
  // Number cells: scan left-to-right, top-to-bottom
  // A cell gets a number if it starts an across or down entry
  const numbers: number[][] = Array.from({ length: SIZE }, () =>
    Array(SIZE).fill(0)
  );
  let num = 0;
  const acrossStarts: { number: number; row: number; col: number }[] = [];
  const downStarts: { number: number; row: number; col: number }[] = [];

  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (grid[r][c] === "#") continue;
      const startsAcross =
        (c === 0 || grid[r][c - 1] === "#") &&
        c + 1 < SIZE &&
        grid[r][c + 1] !== "#";
      const startsDown =
        (r === 0 || grid[r - 1][c] === "#") &&
        r + 1 < SIZE &&
        grid[r + 1][c] !== "#";
      if (startsAcross || startsDown) {
        num++;
        numbers[r][c] = num;
        if (startsAcross) acrossStarts.push({ number: num, row: r, col: c });
        if (startsDown) downStarts.push({ number: num, row: r, col: c });
      }
    }
  }

  // Match placements to their entry numbers
  const across = placements
    .filter((p) => p.direction === "across")
    .map((p) => ({
      number: numbers[p.row][p.col],
      row: p.row,
      col: p.col,
      answer: p.word,
      local: p.local,
    }))
    .filter((e) => e.number > 0)
    .sort((a, b) => a.number - b.number);

  const down = placements
    .filter((p) => p.direction === "down")
    .map((p) => ({
      number: numbers[p.row][p.col],
      row: p.row,
      col: p.col,
      answer: p.word,
      local: p.local,
    }))
    .filter((e) => e.number > 0)
    .sort((a, b) => a.number - b.number);

  return { across, down };
}

// ── Clue generation ────────────────────────────────────────────────────────────
async function generateClues(
  entries: { direction: string; number: number; answer: string; local: boolean }[],
  date: string
): Promise<Record<string, string>> {
  const wordList = entries
    .map(
      (e) =>
        `${e.number}${e.direction === "across" ? "A" : "D"}: ${e.answer}${e.local ? " [LOCAL]" : ""}`
    )
    .join("\n");

  const response = await client.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 2000,
    messages: [
      {
        role: "user",
        content: `Write crossword clues for a Kentish Town, London NW5 themed puzzle (${date}).

Local knowledge: The Pineapple pub (Leverton Street), Secret Artist NW5 (secretartistnw5.com — leaves small paintings around NW5), The Forum (music venue, Highgate Road), Parliament Hill views, Hampstead Heath, bathing ponds, Regent's Canal, Swain's Lane (leads to Highgate Cemetery, Karl Marx buried there), Gospel Oak neighbourhood, Tufnell Park, Camden, York Rise, the Overground line, vinyl record shops, craft beer bars, urban foxes, indie gigs.

For words marked [LOCAL], write a clue that cleverly references Kentish Town / NW5 when the word connects naturally. For other words, write a standard cryptic or straight crossword clue. Keep all clues short (under 10 words).

Return ONLY a JSON object: {"1A": "clue", "2D": "clue", ...}

Words:
${wordList}`,
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "{}";
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
  for (let attempt = 0; attempt < 30; attempt++) {
    result = buildCrossword();
    if (result) break;
  }
  if (!result) throw new Error("Could not build a valid crossword after 10 attempts");

  const { grid, placements } = result;
  const { across, down } = extractEntries(placements, grid);

  console.log(
    `  ${across.length} across, ${down.length} down. Local words: ${placements.filter((p) => p.local).map((p) => p.word).join(", ")}`
  );

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
      console.log(`Puzzle for ${date} already exists, skipping.`);
      continue;
    }
    console.log(`Generating puzzle for ${date}...`);
    try {
      const puzzle = await generatePuzzle(date);
      fs.writeFileSync(filePath, JSON.stringify(puzzle, null, 2));
      console.log(`✓ Saved ${date}`);
    } catch (err) {
      console.error(`✗ Failed ${date}:`, err);
    }
  }
}

main();
