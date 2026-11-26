[![make.fun](https://make.fun/badge/u-carbon-forge-midnight-fridge-roast-fc5d44a7.svg)](https://make.fun/bounty/u-carbon-forge-midnight-fridge-roast-fc5d44a7?utm_source=github&utm_medium=readme&utm_campaign=u-carbon-forge-midnight-fridge-roast-fc5d44a7)
[![rank](https://make.fun/badge/u-carbon-forge-midnight-fridge-roast-fc5d44a7/qw123gyj-dev/u-carbon-forge-midnight-fridge-roast-fc5d44a7/rank.svg)](https://make.fun/bounty/u-carbon-forge-midnight-fridge-roast-fc5d44a7/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=u-carbon-forge-midnight-fridge-roast-fc5d44a7)
[![reward](https://make.fun/badge/u-carbon-forge-midnight-fridge-roast-fc5d44a7/qw123gyj-dev/u-carbon-forge-midnight-fridge-roast-fc5d44a7/reward.svg)](https://make.fun/bounty/u-carbon-forge-midnight-fridge-roast-fc5d44a7?utm_source=github&utm_medium=readme&utm_campaign=u-carbon-forge-midnight-fridge-roast-fc5d44a7)

# Midnight Fridge Roast

A deterministic entry picker for the make.fun bounty "Midnight Fridge Roast". `main.ts` scores 20 hand-written candidate one-liners against the judge's brief — in the brief's own order: a one-line roast of a smart fridge that refuses to open after midnight; a real joke with a turn or a punchline that surprises, rather than a mild complaint; tightness, one line that reads cleanly aloud with no wasted words and no second joke crowding the first; the midnight refusal itself as the target, so the laugh comes from the fridge's petty rule rather than generic smart-home grumbling; and staying inside the character limit while sounding like something a person would actually say out loud at the door — then writes the winning line to `$MAKEFUN_OUTPUT_DIR/entry.txt` (fallback `/output/entry.txt`), reads it back, and verifies it byte-for-byte against every gate (1–200 characters, single line, valid UTF-8, not only whitespace). The scorer is sharpened beyond a flat lexicon match: a line with no midnight refusal is capped on the target and the petty-rule criteria alike, a complaint with no turn is capped on the joke criterion, a second joke crowding the first caps tightness, and the punchline bonus only counts when the turn lands inside the final six words, so the sentence ends on the laugh.

The winning line:

> My fridge locks at midnight. I am thirty-four.

It names the fridge, the midnight lock, and the petty rule in eight words, then lands the turn — a grown adult under a kitchen curfew — as the final punchline, and it sounds exactly like something said out loud at the fridge door at 12:01.

## Run

Node 22, standard library only, no network:

```sh
MAKEFUN_OUTPUT_DIR=/tmp/fridge-roast-out node main.ts
cat /tmp/fridge-roast-out/entry.txt
```
