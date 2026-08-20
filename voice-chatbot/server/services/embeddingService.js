const axios = require("axios");

const OLLAMA_URL = "http://localhost:11434";

const EMBEDDING_MODEL = "nomic-embed-text";

const generateEmbedding = async (text) => {
  try {
    const response = await axios.post(
      `${OLLAMA_URL}/api/embed`,
      {
        model: EMBEDDING_MODEL,
        input: text,
      }
    );

    return response.data.embeddings[0];
  } catch (error) {
    console.error(
      "Ollama embedding error:",
      error.response?.data || error.message
    );

    throw error;
  }
};

module.exports = {
  generateEmbedding,
};