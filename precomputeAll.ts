#!/usr/bin/env -S deno run --allow-read --allow-write

import { readFileSync, writeFileSync } from "node:fs";
import { join as joinPath } from "node:path";
import { setTimeout } from "node:timers/promises";
import { compare, computeBestWord } from "./wordHelpers.ts";
import { ProgressBar } from "@std/cli/unstable-progress-bar";
import { WordTree } from "./types.ts";

const allCandidates = new  Set(readFileSync(
  joinPath(import.meta.dirname || "", "candidates.txt"),
  {
    encoding: "utf8",
  },
).split("\n").map((word) => word.trim()).filter(Boolean));

if (!allCandidates.size) {
  console.log("Empty candidates list. Exiting");
  Deno.exit();
}

const validWords = new Set(readFileSync(
  joinPath(import.meta.dirname || "", "words.txt"),
  {
    encoding: "utf8",
  },
).split("\n").map((word) => word.trim()).filter(Boolean));

if (!validWords.size) {
  console.log("Empty words list. Exiting");
  Deno.exit();
}

let progress = new ProgressBar({
  max: validWords.size * allCandidates.size,
  formatter(formatter) {
    return `Computing word scores [${formatter.progressBar}] ${formatter.value} / ${formatter.max}`;
  },
});
await setTimeout()

const wordScores: Record<string, Record<string, number>> = {}

for (const word of validWords) {
    wordScores[word] = {}
    for (const candidate of allCandidates) {
        wordScores[word][candidate] = compare(word, candidate)
        progress.value += 1
        if (progress.value % 1e5 === 0)
          await setTimeout()
    }
}
await progress.stop()

progress = new ProgressBar({
  max: allCandidates.size,
  formatter(formatter) {
    return `Building decision tree [${formatter.progressBar}] ${formatter.value} / ${formatter.max}`;
  },
});
await setTimeout()

const remainingCandidates = new Set(allCandidates)

const { word, scoreCandidates } = computeBestWord(wordScores, allCandidates);
const result: WordTree = {
  word,
  scoreMap: {},
};
delete scoreCandidates[500];
remainingCandidates.delete(word);
progress.value = allCandidates.size - remainingCandidates.size;
const pending: Array<
  [Record<number, WordTree>, Record<number, Set<string>>]
> = [[result.scoreMap, scoreCandidates]];
while (true) {
  const next = pending.shift();
  if (!next) break;

  const [scoreMap, scoreCandidates] = next;

  for (
    const [score, candidates] of Object.entries(scoreCandidates).sort((
      [scoreA],
      [scoreB],
    ) => Number(scoreB) - Number(scoreA))
  ) {
    if (candidates.size === 1) {
      const word = [...candidates].pop()!
      scoreMap[Number(score)] = word;
      remainingCandidates.delete(word);
      progress.value = allCandidates.size - remainingCandidates.size;
      await setTimeout();
      continue;
    }

    const {
      word,
      scoreCandidates,
    } = computeBestWord(
      wordScores,
      candidates
    );

    delete scoreCandidates[500];
    remainingCandidates.delete(word);
    progress.value = allCandidates.size - remainingCandidates.size;
    await setTimeout()

    const nextScoreMap: Record<number, WordTree> = {};
    scoreMap[Number(score)] = {
      word,
      scoreMap: nextScoreMap,
    };
    pending.push([nextScoreMap, scoreCandidates]);
  }
}

writeFileSync(
  joinPath(import.meta.dirname || "", ".word500.map.json"),
  JSON.stringify(
    result,
    null,
    2,
  ),
);

await progress.stop();
