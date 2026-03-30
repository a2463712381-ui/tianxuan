const DIMENSION_MAP = [
  { A: "CN", B: "SN", C: "BS", D: "DR" },
  { A: "CN", B: "SN", C: "BS", D: "DR" },
  { A: "CN", B: "SN", C: "AS", D: "DR" },
  { A: "CN", B: "SN", C: "AS", D: "DR" },
  { A: "CN", B: "SN", C: "BS", D: "DR" },
  { A: "CN", B: "SN", C: "BS", D: "DR" },
  { A: "CN", B: "SN", C: "AS", D: "DR" },
  { A: "CN", B: "SN", C: "BS", D: "DR" },
  { A: "CN", B: "SN", C: "AS", D: "DR" },
  { A: "CN", B: "SN", C: "AS", D: "DR" },
  { A: "CN", B: "SN", C: "BS", D: "DR" },
  { A: "CN", B: "SN", C: "AS", D: "DR" },
  { A: "CN", B: "SN", C: "BS", D: "DR" },
  { A: "CN", B: "SN", C: "BS", D: "DR" },
  { A: "CN", B: "SN", C: "AS", D: "DR" },
  { A: "CN", B: "SN", C: "AS", D: "DR" },
  { A: "CN", B: "SN", C: "BS", D: "DR" },
  { A: "CN", B: "SN", C: "BS", D: "DR" },
  { A: "CN", B: "SN", C: "BS", D: "DR" },
  { A: "CN", B: "SN", C: "AS", D: "DR" }
];

const RESULT_KEYS = {
  CN: "companion",
  SN: "steady",
  BS: "boundary",
  AS: "free",
  DR: "resonance",
  GENTLE: "gentle"
};

const TIE_GROUPS = {
  DR_SN: [6, 14, 17, 20],
  BS: [2, 11, 14, 18],
  AS: [3, 7, 9, 16, 20],
  CN: [3, 5, 9, 18, 20],
  SN: [7, 8, 10, 12, 15]
};

const VALID_COMPETITOR_PAIRS = [
  ["DR", "SN"],
  ["CN", "SN"],
  ["BS", "AS"]
];

function createEmptyScores() {
  return { CN: 0, SN: 0, BS: 0, AS: 0, DR: 0 };
}

function countOptionOnQuestions(answers, questionIds, option) {
  return questionIds.reduce(
    (total, questionId) => total + (answers[questionId - 1] === option ? 1 : 0),
    0
  );
}

function getResultKeyByDimension(dimension) {
  return RESULT_KEYS[dimension] || RESULT_KEYS.GENTLE;
}

function getSingleHighestDimension(scores) {
  const { highest } = getTopTier(scores);
  return highest.length === 1 ? highest[0] : null;
}

function getCloseCompetitors(scores, dimension) {
  const { maxScore } = getTopTier(scores);

  return Object.entries(scores)
    .filter(([key]) => key !== dimension)
    .filter(([, score]) => isCloseScore(scores[dimension], score, maxScore))
    .map(([key]) => key);
}

function getMatchingCompetitorPair(dimension, competitors) {
  return VALID_COMPETITOR_PAIRS.find(([left, right]) => {
    return (
      (dimension === left && competitors.includes(right)) ||
      (dimension === right && competitors.includes(left))
    );
  });
}

export function calculateDimensionScores(answers) {
  return answers.reduce((scores, answer, index) => {
    const dimension = DIMENSION_MAP[index]?.[answer];

    if (dimension) {
      scores[dimension] += 1;
    }

    return scores;
  }, createEmptyScores());
}

export function getTopTier(scores) {
  const entries = Object.entries(scores);
  const maxScore = Math.max(...entries.map(([, score]) => score));
  const highest = entries.filter(([, score]) => score === maxScore).map(([key]) => key);
  const topTier = entries
    .filter(([, score]) => maxScore - score <= 1)
    .map(([key]) => key);

  return { maxScore, highest, topTier };
}

export function isCloseScore(scoreA, scoreB, maxScore) {
  return (
    (scoreA === maxScore && scoreB === maxScore) ||
    (maxScore - scoreA <= 1 && maxScore - scoreB <= 1)
  );
}

export function resolveTieByAnswers(answers, scores) {
  const { maxScore } = getTopTier(scores);
  const closePair = (left, right) =>
    isCloseScore(scores[left], scores[right], maxScore);

  if (closePair("DR", "SN")) {
    const drCount = countOptionOnQuestions(answers, TIE_GROUPS.DR_SN, "D");

    if (drCount >= 3) {
      return RESULT_KEYS.DR;
    }

    if (drCount <= 1) {
      return RESULT_KEYS.SN;
    }

    return RESULT_KEYS.GENTLE;
  }

  if (closePair("CN", "SN")) {
    const cnCount = countOptionOnQuestions(answers, TIE_GROUPS.CN, "A");
    const snCount = countOptionOnQuestions(answers, TIE_GROUPS.SN, "B");

    if (cnCount > snCount) return RESULT_KEYS.CN;
    if (snCount > cnCount) return RESULT_KEYS.SN;
    return RESULT_KEYS.GENTLE;
  }

  if (closePair("BS", "AS")) {
    const bsCount = countOptionOnQuestions(answers, TIE_GROUPS.BS, "C");
    const asCount = countOptionOnQuestions(answers, TIE_GROUPS.AS, "C");

    if (bsCount > asCount) return RESULT_KEYS.BS;
    if (asCount > bsCount) return RESULT_KEYS.AS;
    return RESULT_KEYS.GENTLE;
  }

  return RESULT_KEYS.GENTLE;
}

export function determineResult(answers) {
  const scores = calculateDimensionScores(answers);
  const singleHighest = getSingleHighestDimension(scores);

  if (singleHighest) {
    const closeCompetitors = getCloseCompetitors(scores, singleHighest);
    const matchedPair = getMatchingCompetitorPair(singleHighest, closeCompetitors);

    if (!matchedPair) {
      return {
        resultKey: getResultKeyByDimension(singleHighest),
        scores
      };
    }

    const tieResult = resolveTieByAnswers(answers, {
      [matchedPair[0]]: scores[matchedPair[0]],
      [matchedPair[1]]: scores[matchedPair[1]]
    });

    return {
      resultKey: tieResult || RESULT_KEYS.GENTLE,
      scores
    };
  }

  const { highest, topTier } = getTopTier(scores);
  const matchingPair = VALID_COMPETITOR_PAIRS.find(([left, right]) => {
    const leftEligible =
      highest.includes(left) || (topTier.includes(left) && topTier.includes(right));
    const rightEligible =
      highest.includes(right) || (topTier.includes(left) && topTier.includes(right));

    return leftEligible && rightEligible;
  });

  if (matchingPair) {
    return {
      resultKey: resolveTieByAnswers(answers, {
        [matchingPair[0]]: scores[matchingPair[0]],
        [matchingPair[1]]: scores[matchingPair[1]]
      }),
      scores
    };
  }

  return {
    resultKey: RESULT_KEYS.GENTLE,
    scores
  };
}
