#!/usr/bin/env -S deno run --allow-read

import { readFileSync } from "node:fs";
import { join as joinPath } from "node:path";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { computeBestWord } from "./wordHelpers.ts";

const SCORE_REGEXP = /[0-5]{3}/;

let word: string = "";
let scoreMap: Record<number, Array<string>> = {};

try {
  (
    { word, scoreMap } = JSON.parse(readFileSync(
      joinPath(import.meta.dirname || "", ".word500.init.json"),
      {
        encoding: "utf8",
      },
    ))
  );
} catch {
  console.log(
    "Error reading .word500.init.json. File may be missing or malformed.",
  );
  Deno.exit(1);
}

if (!word || !scoreMap) {
  console.log(
    "Unable to load initial state. .word500.init.json may be malformed.",
  );
  Deno.exit(1);
}

const readline = createInterface(stdin, stdout);
const queryScore = async (): Promise<number> => {
  while (true) {
    const scoreString = await readline.question("score: ");
    if (
      !SCORE_REGEXP.test(scoreString) ||
      Math.sumPrecise(scoreString.split("").map(Number)) !== 5
    ) {
      console.log("invalid score");
      continue;
    }

    return parseInt(scoreString);
  }
};

let score = 5;
while (score !== 500) {
  let remainingWords: Array<string> | undefined = undefined;
  console.log(word);

  while (!remainingWords) {
    score = await queryScore();
    if (score === 500) {
      console.log("Congratulations!");
      Deno.exit(0);
    }

    remainingWords = scoreMap[score];
    if (!remainingWords) {
      console.log("Unable to recommend next move. Word list may be incomplete");
    }
  }

  ({ word, scoreMap } = computeBestWord(remainingWords));
}
