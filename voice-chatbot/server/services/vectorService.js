const { ChromaClient } = require("chromadb");
const { generateEmbedding } = require("./embeddingService");

const {
  tokenize,
  bm25Score,
  reciprocalRankFusion,
} = require("./hybridSearch");


// =====================================================
// CHROMA CLIENT
// =====================================================

const client = new ChromaClient({
  host: "localhost",
  port: 8000,
  ssl: false,
});

const COLLECTION_NAME =
  process.env.CHROMA_COLLECTION || "voice_chatbot";


// =====================================================
// GET COLLECTION
// =====================================================

const getCollection = async () => {
  const collection = await client.getOrCreateCollection({
    name: COLLECTION_NAME,
    embeddingFunction: null,
  });

  return collection;
};


// =====================================================
// ADD DOCUMENTS
// =====================================================

const addDocuments = async (documents) => {
  const collection = await getCollection();

  const ids = [];
  const embeddings = [];
  const metadatas = [];
  const texts = [];

  for (let i = 0; i < documents.length; i++) {
    const document = documents[i];

    console.log(
      `Creating embedding ${i + 1}/${documents.length}`
    );

    const embedding = await generateEmbedding(
      document.text
    );

    ids.push(`doc-${Date.now()}-${i}`);

    embeddings.push(embedding);

    metadatas.push({
      source: document.source || "unknown",
    });

    texts.push(document.text);
  }

  await collection.add({
    ids,
    embeddings,
    metadatas,
    documents: texts,
  });

  const count = await collection.count();

  console.log(
    `${documents.length} documents added to ChromaDB.`
  );

  console.log(
    `Chroma collection now contains ${count} documents.`
  );
};


// =====================================================
// VECTOR SEARCH
// =====================================================

const vectorSearch = async (query, topK = 5) => {
  const collection = await getCollection();

  const count = await collection.count();

  console.log(
    "Chroma document count:",
    count
  );

  // No documents available
  if (count === 0) {
    console.log(
      "Chroma collection is empty."
    );

    return [];
  }

  const queryEmbedding =
    await generateEmbedding(query);

  const results = await collection.query({
    queryEmbeddings: [queryEmbedding],
    nResults: Math.min(topK, count),
  });

  const documents =
    results.documents?.[0] || [];

  const ids =
    results.ids?.[0] || [];

  const distances =
    results.distances?.[0] || [];

  console.log(
    "\n========== VECTOR SEARCH =========="
  );

  console.log(
    "Query:",
    query
  );

  console.log(
    "Distances:",
    distances
  );

  const MAX_DISTANCE = 0.8;

  const filteredResults = documents
    .map((document, index) => ({
      id: ids[index],
      text: document,
      distance: distances[index],
    }))
    .filter(
      (result) =>
        result.distance <= MAX_DISTANCE
    );

  console.log(
    "Vector results:",
    filteredResults.length
  );

  return filteredResults;
};


// =====================================================
// KEYWORD / BM25 SEARCH
// =====================================================

const keywordSearch = async (
  query,
  topK = 5
) => {
  const collection = await getCollection();

  const results = await collection.get();

  const documents =
    results.documents || [];

  const ids =
    results.ids || [];

  if (documents.length === 0) {
    console.log(
      "No documents available for BM25 search."
    );

    return [];
  }

  const queryTokens =
    tokenize(query);

  const tokenizedDocuments =
    documents.map((document) =>
      tokenize(document)
    );

  const scoredDocuments =
    documents.map(
      (document, index) => {

        const score =
          bm25Score(
            queryTokens,
            tokenizedDocuments[index],
            tokenizedDocuments
          );

        return {
          id: ids[index],
          text: document,
          score,
        };
      }
    );

  const keywordResults =
    scoredDocuments
      .filter(
        (item) =>
          item.score > 0
      )
      .sort(
        (a, b) =>
          b.score - a.score
      )
      .slice(0, topK);

  console.log(
    "\n========== BM25 SEARCH =========="
  );

  console.log(
    "Query:",
    query
  );

  console.log(
    "Keyword results:",
    keywordResults.map(
      (item) => ({
        id: item.id,
        score: item.score,
        text: item.text.substring(
          0,
          100
        ),
      })
    )
  );

  return keywordResults;
};


// =====================================================
// HYBRID SEARCH
// =====================================================

const hybridSearch = async (
  query,
  topK = 5
) => {
  console.log("\n");
  console.log(
    "======================================"
  );

  console.log(
    "         HYBRID SEARCH STARTED"
  );

  console.log(
    "======================================"
  );


  // ---------------------------------------------------
  // Run vector + BM25 search in parallel
  // ---------------------------------------------------

  const [
    vectorResults,
    keywordResults,
  ] = await Promise.all([
    vectorSearch(query, topK),
    keywordSearch(query, topK),
  ]);


  console.log(
    "\nVector results:",
    vectorResults.length
  );

  console.log(
    "Keyword results:",
    keywordResults.length
  );


  // ---------------------------------------------------
  // RRF SCORE
  // ---------------------------------------------------

  const rrfScores =
    reciprocalRankFusion(
      vectorResults,
      keywordResults
    );


  // ---------------------------------------------------
  // COMBINE UNIQUE DOCUMENTS
  // ---------------------------------------------------

  const combinedDocuments =
    new Map();


  vectorResults.forEach(
    (result) => {
      combinedDocuments.set(
        result.id,
        result.text
      );
    }
  );


  keywordResults.forEach(
    (result) => {
      combinedDocuments.set(
        result.id,
        result.text
      );
    }
  );


  // ---------------------------------------------------
  // FINAL RANKING
  // ---------------------------------------------------

  const finalResults =
    [...combinedDocuments.entries()]
      .map(([id, text]) => ({
        id,
        text,
        score:
          rrfScores.get(id) || 0,
      }))
      .sort(
        (a, b) =>
          b.score - a.score
      )
      .slice(0, topK);


  // ---------------------------------------------------
  // LOG FINAL RESULTS
  // ---------------------------------------------------

  console.log(
    "\n========== FINAL HYBRID RESULTS =========="
  );

  finalResults.forEach(
    (result, index) => {

      console.log(
        `\n${index + 1}. ID: ${result.id}`
      );

      console.log(
        `RRF Score: ${result.score}`
      );

      console.log(
        `Text: ${result.text.substring(
          0,
          150
        )}...`
      );
    }
  );


  console.log(
    "\n======================================"
  );

  console.log(
    "         HYBRID SEARCH FINISHED"
  );

  console.log(
    "======================================"
  );


  return finalResults;
};


// =====================================================
// EXPORTS
// =====================================================

module.exports = {
  addDocuments,
  searchDocuments: vectorSearch,
  vectorSearch,
  keywordSearch,
  hybridSearch,
};