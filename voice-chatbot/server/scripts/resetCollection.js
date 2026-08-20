const { ChromaClient } = require("chromadb");

const client = new ChromaClient({
  host: "localhost",
  port: 8000,
  ssl: false,
});

const COLLECTION_NAME =
  process.env.CHROMA_COLLECTION || "voice_chatbot";

async function resetCollection() {
  try {
    console.log(`Deleting collection: ${COLLECTION_NAME}`);

    try {
      await client.deleteCollection({
        name: COLLECTION_NAME,
      });

      console.log("Old collection deleted.");
    } catch (error) {
      console.log("Collection did not exist yet.");
    }

    const collection = await client.getOrCreateCollection({
      name: COLLECTION_NAME,
      embeddingFunction: null,
    });

    console.log("New collection created successfully.");
    console.log("Collection:", collection.name);

    process.exit(0);
  } catch (error) {
    console.error("Reset failed:", error);
    process.exit(1);
  }
}

resetCollection();