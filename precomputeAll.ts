#!/usr/bin/env -S deno run --allow-read --allow-write

import { readFileSync, writeFileSync } from "node:fs";
import { join as joinPath } from "node:path";
import { setTimeout } from "node:timers/promises";
import { computeBestWord } from "./wordHelpers.ts";
import { ProgressBar } from "@std/cli/unstable-progress-bar";

type WordTree = string | {
  word: string;
  scoreMap: Record<number, WordTree>;
};

const allWords = readFileSync(
  joinPath(import.meta.dirname || "", "word500.txt"),
  {
    encoding: "utf8",
  },
).split("\n").map((word) => word.trim()).filter(Boolean);

if (!allWords.length) {
  console.log("Empty word list. Exiting");
  Deno.exit();
}

const progress = new ProgressBar({
  max: allWords.length,
  formatter(formatter) {
    return `${formatter.value} / ${formatter.max}`;
  },
});
const triedWords = new Set<string>();

await setTimeout();
const { word, scoreMap } = computeBestWord(allWords);
const result: WordTree = {
  word,
  scoreMap: {},
};
delete scoreMap[500];
triedWords.add(word);
progress.value = triedWords.size;
const pending: Array<
  [Record<number, WordTree>, Record<number, Array<string>>]
> = [[result.scoreMap, scoreMap]];
do {
  const next = pending.shift();
  if (!next) break;

  const [result, scoreMap] = next;

  for (
    const [score, words] of Object.entries(scoreMap).sort((
      [scoreA],
      [scoreB],
    ) => Number(scoreB) - Number(scoreA))
  ) {
    if (words.length === 1) {
      result[Number(score)] = words[0];
      triedWords.add(words[0]);
      progress.value = triedWords.size;
      continue;
    }

    await setTimeout();
    const {
      word,
      scoreMap,
    } = computeBestWord(
      words,
      Array.from(
        new Set([
          ...words,
          ...allWords,
        ]),
      ),
    );

    delete scoreMap[500];
    triedWords.add(words[0]);
    progress.value = triedWords.size;

    const nextScoreMap: Record<number, WordTree> = {};
    result[Number(score)] = {
      word,
      scoreMap: nextScoreMap,
    };
    pending.push([nextScoreMap, scoreMap]);
  }
} while (pending.length);

writeFileSync(
  joinPath(import.meta.dirname || "", ".word500.map.json"),
  JSON.stringify(
    result,
    null,
    2,
  ),
);

await progress.stop();
