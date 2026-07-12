#!/usr/bin/env -S deno run --allow-read

import { readFileSync } from "node:fs";
import { join as joinPath } from "node:path";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { WordTree } from "./types.ts";

const SCORE_REGEXP = /[0-5]{3}/;

let word: string = "";
let scoreMap: Record<number, WordTree> = {};

try {
  (
    { word, scoreMap } = JSON.parse(readFileSync(
      joinPath(import.meta.dirname || "", ".word500.map.json"),
      {
        encoding: "utf8",
      },
    ))
  );
} catch {
  console.log(
    "Error reading .word500.map.json. File may be missing or malformed.",
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
  console.log(word);

  word = "";
  while (!word) {
    score = await queryScore();
    if (score === 500) {
      console.log("Congratulations!");
      Deno.exit(0);
    }

    const nextData = scoreMap[score];
    if (!nextData) {
      console.log("Unable to recommend next move. Word list may be incomplete");
      continue;
    }
    if (typeof nextData === "string") {
      console.log(`Your word is ${nextData}`)
      Deno.exit()
    } else {
      word = nextData.word;
      scoreMap = nextData.scoreMap;
    }
  }
}
