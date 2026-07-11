#!/usr/bin/env -S deno run --allow-read --allow-write

import { readFileSync, writeFileSync } from "node:fs";
import { join as joinPath } from "node:path";
import { computeBestWord } from "./wordHelpers.ts";

const words = readFileSync(
  joinPath(import.meta.dirname || "", "word500.txt"),
  {
    encoding: "utf8",
  },
).split("\n").map((word) => word.trim()).filter(Boolean);

if (!words.length) {
  console.log("Empty word list. Exiting");
  Deno.exit();
}

writeFileSync(
  joinPath(import.meta.dirname || "", ".word500.init.json"),
  JSON.stringify(computeBestWord(words)),
);
