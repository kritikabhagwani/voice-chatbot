const { ChromaClient } = require("chromadb");

const client = new ChromaClient({
  host: "localhost",
  port: 8000,
  ssl: false,
});

const clear = async () => {
  try {
    await client.deleteCollection({
      name: "voice_chatbot",
    });

    console.log("voice_chatbot collection deleted.");
  } catch (error) {
    console.log("Collection could not be deleted:", error.message);
  }
};

clear();