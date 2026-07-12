export type WordTree = string | {
  word: string;
  scoreMap: Record<number, WordTree>;
};
