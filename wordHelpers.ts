export const compare = (input: string, candidate: string): number => {
  if (input === candidate) {
    return input.length * 100;
  }

  const inputLetters = input.toUpperCase().split("");
  const candidateLetters = candidate.toUpperCase().split("");

  const letterCounts = new Proxy<Record<string | symbol, number>>({}, {
    get(target, property) {
      const current = target[property];
      return current || (target[property] = 0);
    },
  });
  let green = 0;

  inputLetters.forEach((letter, index) => {
    const candidateLetter = candidateLetters[index];
    if (candidateLetter === letter) {
      green += 1;
      return;
    }
    letterCounts[candidateLetter] += 1;
    letterCounts[letter] -= 1;
  });

  candidateLetters.slice(input.length, candidate.length).forEach((letter) => {
    letterCounts[letter] += 1;
  });

  const red = Object.values(letterCounts).reduce((prev, curr) => {
    if (curr <= 0) return prev;

    return prev + curr;
  }, 0);

  const yellow = candidate.length - green - red;

  return green * 100 + yellow * 10 + red;
};

export const computeEntropy = (
  scoreMap: Record<number, Set<string>>,
): number => {
  return Object.values(scoreMap).reduce((prev, curr) => {
    return prev -= curr.size * Math.log(curr.size);
  }, 0);
};

export const computeBestWord = (
  wordScores: Record<string, Record<string, number>>,
  candidates: Set<string>
): {
  word: string;
  scoreCandidates: Record<number, Set<string>>;
} => {
  let topWord = ''
  let topScoreCandidates: Record<number, Set<string>> = {}
  let topEntropy = -Infinity
  for (const [word, candidateScoreMap] of Object.entries(wordScores)) {
    const scoreCandidates: Record<number, Set<string>> = {}
    for (const candidate of candidates) {
      const score = candidateScoreMap[candidate];
      (
        scoreCandidates[score]
        || (scoreCandidates[score] = new Set())
      ).add(candidate)
    }
    const entropy = computeEntropy(scoreCandidates)

    if (entropy < topEntropy) continue;
    else if (
      entropy > topEntropy || candidates.has(word)
    ) {
      topWord = word
      topScoreCandidates = scoreCandidates
      topEntropy = entropy
    }
  }

  return {
    word: topWord,
    scoreCandidates: topScoreCandidates
  }
};
