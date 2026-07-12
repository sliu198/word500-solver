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
    if (curr >= 0) return prev;

    return prev - curr;
  }, 0);

  const yellow = candidate.length - green - red;

  return green * 100 + yellow * 10 + red;
};

export const computeScoreMap = (
  word: string,
  candidates: Array<string>,
): Record<number, Array<string>> => {
  const scoreMap: Record<number, Array<string>> = {};
  const scoreMapProxy = new Proxy<Record<string | symbol, Array<string>>>(
    scoreMap,
    {
      get(target, property) {
        const current = target[property];
        return current || (target[property] = []);
      },
    },
  );

  for (const candidate of candidates) {
    const score = compare(word, candidate);
    scoreMapProxy[score].push(candidate);
  }

  return scoreMap;
};

export const computeEntropy = (
  scoreMap: Record<number, Array<string>>,
): number => {
  return Object.values(scoreMap).reduce((prev, curr) => {
    return prev -= curr.length * Math.log(curr.length);
  }, 0);
};

export const computeBestWord = (
  candidateList: Array<string>,
  wordList?: Array<string>,
): {
  word: string;
  scoreMap: Record<number, Array<string>>;
} => {
  if (!candidateList.length) {
    throw new Error("empty word list");
  }
  if (!wordList) wordList = candidateList;
  let bestWord: string = "";
  let bestScoreMap: Record<number, Array<string>> = {};
  let bestEntropy = -Infinity;
  for (const word of wordList) {
    const scoreMap = computeScoreMap(word, candidateList);
    const entropy = computeEntropy(scoreMap);
    if (entropy > bestEntropy) {
      bestWord = word;
      bestScoreMap = scoreMap;
      bestEntropy = entropy;
    }
  }

  return {
    word: bestWord,
    scoreMap: bestScoreMap,
  };
};
