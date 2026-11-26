/**
 * Midnight Fridge Roast — entry picker.
 *
 * Bounty: write one line of at most 200 characters roasting a smart
 * fridge that refuses to open after midnight. A house judge compares
 * entries two at a time and keeps the funnier one, weighing the
 * criteria in the brief's own order:
 *
 *   1. It is a one-line roast of a smart fridge that refuses to open
 *      after midnight; a line about some other appliance, or about
 *      nothing in particular, loses to any one-line roast of a smart
 *      fridge that refuses to open after midnight.
 *   2. It lands a real joke, with a turn or a punchline that
 *      surprises, rather than a mild complaint about the fridge.
 *   3. It is tight: one line that reads cleanly aloud, with no
 *      wasted words and no second joke crowding the first.
 *   4. It makes the midnight refusal itself the target, so the laugh
 *      comes from the fridge's petty rule rather than from generic
 *      smart-home grumbling.
 *   5. It stays inside the character limit and still sounds like
 *      something a person would actually say out loud at the door.
 *
 * Length for its own sake does not count, and a line that gets the
 * fridge's petty rule is worth more than one that only grumbles
 * about smart homes.
 *
 * This program scores a hand-written field of candidate one-liners
 * against that brief, in the brief's own order, and writes the
 * winner to $MAKEFUN_OUTPUT_DIR/entry.txt (fallback
 * /output/entry.txt). It then reads the file back and verifies it
 * byte-for-byte against every gate: 1-200 characters, a single
 * line, valid UTF-8, and not only whitespace.
 *
 * Scoring is deliberately lexicographic, mirroring the judge's own
 * instruction: go through the criteria in order, let the first
 * difference decide. Ties break criterion by criterion in the
 * brief's order, then by shorter length — a shorter line that says
 * the same thing reads tighter, and the brief says length for its
 * own sake does not count.
 *
 * Four sharpening rules sit on top of the flat rubric:
 *
 *   - A line with no midnight refusal — no midnight and no lock,
 *     curfew or denial — is capped at 2 on the target criterion
 *     and on the petty-rule criterion alike, however funny it is.
 *   - A complaint with no turn is capped at 1 on the joke
 *     criterion: mild grumbling is not a punchline.
 *   - A second joke crowding the first caps tightness at 2: one
 *     line, one joke.
 *   - The punchline bonus only counts when the turn lands inside
 *     the final six words, so the sentence ends on the laugh
 *     instead of trailing off into logistics.
 *
 * Node 22, standard library only, no network, fully deterministic:
 * the same candidates always produce the same winner.
 */

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// ---------------------------------------------------------------------------
// The field: 20 hand-written candidate roasts.
// ---------------------------------------------------------------------------

const CANDIDATES: string[] = [
  // The intended winner: the refusal is the whole joke, the turn is
  // the age, and it ends on the punchline in eight words flat.
  "My fridge locks at midnight. I am thirty-four.",

  // Strong personification: the fridge gloats about the lock.
  "My fridge locks itself at midnight, then hums smugly like it just saved my life.",

  // Bouncer turn: the leftovers become the VIPs.
  "At midnight my fridge turns into a bouncer, and suddenly the leftovers are VIPs.",

  // The fridge acts like the landlord.
  "My fridge locks at midnight like it pays the rent — I just live here.",

  // Absurd escalation: hunger as a parole hearing.
  "I stood at midnight explaining my hunger to a touchscreen like it was a parole hearing.",

  // Legal-threat turn, but the second clause crowds the first joke.
  "My smart fridge locks after midnight — apparently the ice cream filed a restraining order.",

  // Diet-advice framing: the lock dressed up as virtue.
  "The fridge's idea of health advice is locking the door and calling it willpower.",

  // Locked, lit and judging: personification, but it lists rather than turns.
  "My fridge after midnight: locked, lit, and judging me through the glass.",

  // Velvet-rope turn, close cousin of the bouncer line.
  "My fridge treats midnight like a velvet rope, and I am not on the list.",

  // The fridge decides the eater is the dumb one.
  "I bought a smart fridge and it decided I'm not smart enough to eat after midnight.",

  // Same bouncer joke as #3, told longer and flatter.
  "My fridge goes from appliance to bouncer at 12:01, and the leftovers are suddenly VIPs.",

  // Heist framing: meal prep as a crime.
  "The fridge locked at midnight, so now I meal-prep like a criminal planning a heist.",

  // Self-care framing: the lock as wellness.
  "My fridge is so smart it locks me out after midnight and calls it self-care.",

  // Personification with no refusal in it: the ice maker sighs, but
  // nothing is locked, so the petty rule is never the target.
  "The ice maker sighs at midnight like it's disappointed in my life choices.",

  // Generic smart-home grumble: wifi, lights, judgement — but no
  // midnight refusal anywhere.
  "My smart home is useless: the wifi drops, the lights flicker, and the fridge judges me.",

  // Wrong appliance entirely: a toaster and a kettle, no fridge.
  "My toaster refuses to pop after midnight and the kettle just laughs at me.",

  // Pure complaint: hate, never, always — and an app update for garnish.
  "I hate my fridge, it never lets me eat when I want and the app is always updating.",

  // Three jokes and a ramble in one breath: heist, flicker, diet,
  // sleep schedule — the first joke never gets room.
  "My fridge locks at midnight, and also the ice maker is loud, and the light flickers, and honestly the whole kitchen is against me and my diet and my sleep schedule and everything.",

  // Raccoon turn: a vivid image, but the joke is the costume, not
  // the rule — the lock is scenery, not the butt.
  "My fridge locked at midnight, so I ate standing up like a raccoon in a tuxedo.",

  // Short and punchy, but "one setting: no" never names the lock,
  // so the refusal reads as a shrug, not a petty rule.
  "The fridge after midnight has one setting: no.",
];

// ---------------------------------------------------------------------------
// Feature detection: small, explicit lexicons, no model, no network.
// ---------------------------------------------------------------------------

const FRIDGE = /\bfridge\b/i;
const MIDNIGHT = /\bmidnight\b/i;
const CLOCK = /\b12:0[01]\b/;
const REFUSAL = /\b(locks?|locked|locking|curfew|refuses?|denied|won't open|will not open|shut|barred)\b/i;

// Turn devices: the joke's engine. Personification verbs make the
// fridge a character; reversal phrases flip who is in charge; absurd
// comparisons escalate a kitchen moment into a courtroom, a club or
// a crime.
const PERSONIFICATION = /\b(hums?|humming|sighs?|judg(e|es|ing)|decided|decides|pretends?|brags?|calls? it|saved my life|disappointed|smugly)\b/i;
const REVERSAL = /\b(i am thirty-four|i just live here|not on the list|not smart enough|restraining order|parole hearing|bouncer|vips?|velvet rope|criminal|heist|willpower|self-care|pays the rent)\b/i;
const ABSURD = /\b(like (it|a|an|the)|as if|apparently|filed a)\b/i;

// Complaint markers: the language of grumbling, not joking.
const COMPLAINT = /\b(hate|useless|never|always|annoying|stupid|worst)\b/i;

// Generic smart-home grumbling: the stuff criterion 4 warns against.
const GENERIC_GRUMBLE = /\b(wifi|wi-fi|app|updat(e|es|ing)|firmware|smart home|lights? flicker|flickers?)\b/i;

// Filler and clutter: words that earn nothing.
const FILLER = /\b(honestly|actually|really|very|just|so|basically|literally)\b/gi;

// Second-joke crowding: a second punchline clause piled onto the
// first, usually after "and also" or a second turn device.
const SECOND_JOKE = /\band also\b/i;

function countMatches(text: string, re: RegExp): number {
  const m = text.match(new RegExp(re.source, re.flags.includes("g") ? re.flags : re.flags + "g"));
  return m ? m.length : 0;
}

function words(text: string): string[] {
  return text.split(/\s+/).filter(Boolean);
}

function lastWords(text: string, n: number): string {
  return words(text).slice(-n).join(" ");
}

// ---------------------------------------------------------------------------
// Scoring: one 0-5 score per criterion, in the brief's own order.
// ---------------------------------------------------------------------------

interface Scores {
  target: number; // 1. one-line roast of the midnight-refusing fridge
  joke: number; // 2. a real joke with a turn, not a mild complaint
  tight: number; // 3. reads cleanly aloud, no waste, one joke only
  pettyRule: number; // 4. the midnight refusal itself is the target
  spoken: number; // 5. inside the limit, sounds said aloud at the door
}

function score(line: string): Scores {
  const lower = line.toLowerCase();
  const wordList = words(line);
  const hasFridge = FRIDGE.test(lower);
  const hasMidnight = MIDNIGHT.test(lower) || CLOCK.test(lower);
  const hasRefusal = REFUSAL.test(lower);
  const hasMidnightRefusal = hasMidnight && hasRefusal;

  // --- 1. Target: fridge + midnight + refusal. -------------------------
  let target = 0;
  if (hasFridge) target += 2;
  if (hasMidnight) target += 1;
  if (hasRefusal) target += 1;
  if (hasFridge && hasMidnight && hasRefusal) target += 1;
  // Sharpening: no midnight refusal, no top marks for targeting it.
  if (!hasMidnightRefusal) target = Math.min(target, 2);

  // --- 2. Joke: a turn that surprises. ----------------------------------
  const personification = PERSONIFICATION.test(lower);
  const reversal = REVERSAL.test(lower);
  const absurd = ABSURD.test(lower);
  const turnCount = [personification, reversal, absurd].filter(Boolean).length;
  const hasComplaint = COMPLAINT.test(lower);
  let joke = 0;
  if (turnCount === 0) {
    joke = hasComplaint ? 1 : 2;
  } else if (turnCount === 1) {
    joke = reversal ? 4 : 3;
  } else {
    joke = 4;
  }
  // Sharpening: a complaint with no turn is not a punchline.
  if (turnCount === 0) joke = Math.min(joke, 1);
  // Sharpening: the punchline bonus only counts when the turn lands
  // inside the final six words, so the line ends on the laugh.
  const tail = lastWords(line, 6).toLowerCase();
  const tailTurn =
    PERSONIFICATION.test(tail) || REVERSAL.test(tail) || ABSURD.test(tail);
  if (tailTurn && turnCount > 0) joke = Math.min(5, joke + 1);

  // --- 3. Tight: clean aloud, no waste, one joke only. -----------------
  let tight = 5;
  const fillerCount = countMatches(line, FILLER);
  tight -= fillerCount;
  if (wordList.length > 25) tight -= 1;
  if (line.length > 130) tight -= 1;
  if (line.length > 160) tight -= 1;
  // Sharpening: a second joke crowding the first caps tightness at 2.
  // A second joke also crowds the first when the line stacks three
  // turn devices: one line, one joke, however good each is alone.
  const secondJoke = SECOND_JOKE.test(lower) || turnCount >= 3 || countMatches(line, /\band\b/g) >= 4;
  if (secondJoke) tight = Math.min(tight, 2);
  tight = Math.max(0, tight);

  // --- 4. Petty rule: the refusal itself is the butt. ------------------
  let pettyRule = 0;
  if (hasRefusal) pettyRule += 2;
  if (hasMidnight) pettyRule += 1;
  if (hasMidnightRefusal) pettyRule += 2;
  // Generic smart-home grumbling docks the rule: the laugh must come
  // from the fridge's petty rule, not from wifi and updates.
  const grumbleCount = countMatches(line, GENERIC_GRUMBLE);
  pettyRule -= grumbleCount * 2;
  // Sharpening: no midnight refusal, no top marks here either.
  if (!hasMidnightRefusal) pettyRule = Math.min(pettyRule, 2);
  pettyRule = Math.max(0, Math.min(5, pettyRule));

  // --- 5. Spoken: sounds said aloud at the door, inside the limit. ----
  let spoken = 3;
  if (/\b(my|i|i'm|i am|we)\b/i.test(line)) spoken += 1;
  if (/\b(i'm|don't|can't|won't|it's|that's)\b/i.test(line)) spoken += 1;
  // Corporate or written-register words do not sound said at a door.
  if (/\b(utilize|implement|therefore|furthermore|henceforth)\b/i.test(line)) spoken -= 2;
  if (line.length > 200) spoken = 0;
  spoken = Math.max(0, Math.min(5, spoken));

  return { target, joke, tight, pettyRule, spoken };
}

function vector(s: Scores): number[] {
  return [s.target, s.joke, s.tight, s.pettyRule, s.spoken];
}

/** Lexicographic compare in the brief's order; shorter line wins ties. */
function compare(a: string, b: string): number {
  const va = vector(score(a));
  const vb = vector(score(b));
  for (let i = 0; i < va.length; i++) {
    if (va[i] !== vb[i]) return vb[i] - va[i];
  }
  return a.length - b.length;
}

// ---------------------------------------------------------------------------
// Gates: the sealed scorer's own checks, reproduced here.
// ---------------------------------------------------------------------------

function gate(line: string): string[] {
  const problems: string[] = [];
  if (line.length < 1) problems.push("empty");
  if (line.length > 200) problems.push(`over 200 characters (${line.length})`);
  if (line.trim().length === 0) problems.push("only whitespace");
  if (line.includes("\n") || line.includes("\r")) problems.push("more than one line");
  try {
    const roundTrip = new TextDecoder("utf-8", { fatal: true }).decode(
      new TextEncoder().encode(line),
    );
    if (roundTrip !== line) problems.push("not valid UTF-8 round-trip");
  } catch {
    problems.push("not valid UTF-8");
  }
  return problems;
}

// ---------------------------------------------------------------------------
// Main: score the field, write the winner, read it back, verify.
// ---------------------------------------------------------------------------

function main(): void {
  const ranked = [...CANDIDATES].sort(compare);

  console.log("candidate scores (target joke tight rule spoken | chars):");
  for (const line of ranked) {
    const s = score(line);
    console.log(
      `  [${s.target} ${s.joke} ${s.tight} ${s.pettyRule} ${s.spoken}] (${line.length}) ${line}`,
    );
  }

  const winner = ranked[0];
  const gateProblems = gate(winner);
  if (gateProblems.length > 0) {
    throw new Error(`winner fails gate: ${gateProblems.join("; ")} — ${winner}`);
  }

  const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
  const outPath = join(outDir, "entry.txt");
  mkdirSync(outDir, { recursive: true });
  writeFileSync(outPath, winner, "utf8");

  // Read it back and verify byte-for-byte against every gate.
  const back = readFileSync(outPath, "utf8");
  if (back !== winner) throw new Error("read-back mismatch");
  const backProblems = gate(back);
  if (backProblems.length > 0) {
    throw new Error(`read-back fails gate: ${backProblems.join("; ")}`);
  }
  const bytes = Buffer.byteLength(back, "utf8");
  console.log(`\nwinner (${back.length} chars, ${bytes} bytes): ${back}`);
  console.log(`wrote ${outPath}`);
}

main();
