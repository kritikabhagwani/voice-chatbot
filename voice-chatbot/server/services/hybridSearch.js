// services/hybridSearch.js

function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}


// Calculate BM25 score
function bm25Score(queryTokens, documentTokens, allDocuments) {
  const k1 = 1.5;
  const b = 0.75;

  const documentLength = documentTokens.length;

  const averageLength =
    allDocuments.reduce(
      (sum, doc) => sum + doc.length,
      0
    ) / allDocuments.length;

  let score = 0;

  const termFrequency = {};

  documentTokens.forEach((token) => {
    termFrequency[token] =
      (termFrequency[token] || 0) + 1;
  });

  for (const term of queryTokens) {
    const tf = termFrequency[term] || 0;

    if (tf === 0) continue;

    const documentFrequency =
      allDocuments.filter((doc) =>
        doc.includes(term)
      ).length;

    const totalDocuments = allDocuments.length;

    const idf = Math.log(
      1 +
        (totalDocuments - documentFrequency + 0.5) /
        (documentFrequency + 0.5)
    );

    const numerator =
      tf * (k1 + 1);

    const denominator =
      tf +
      k1 *
        (1 -
          b +
          b *
            (documentLength /
              averageLength));

    score +=
      idf *
      (numerator / denominator);
  }

  return score;
}


// Reciprocal Rank Fusion
function reciprocalRankFusion(
  semanticResults,
  keywordResults,
  k = 60
) {
  const scores = new Map();

  semanticResults.forEach((item, index) => {
    const id = item.id;

    const score =
      1 / (k + index + 1);

    scores.set(
      id,
      (scores.get(id) || 0) + score
    );
  });

  keywordResults.forEach((item, index) => {
    const id = item.id;

    const score =
      1 / (k + index + 1);

    scores.set(
      id,
      (scores.get(id) || 0) + score
    );
  });

  return scores;
}


module.exports = {
  tokenize,
  bm25Score,
  reciprocalRankFusion,
};