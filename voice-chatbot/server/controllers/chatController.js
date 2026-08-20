const { hybridSearch } = require("../services/vectorService");
const { default: ollama } = require("ollama");

const chatWithAI = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }

    console.log("User question:", message);

    // --------------------------------
    // STEP 1: HYBRID SEARCH
    // --------------------------------

    const results = await hybridSearch(message, 5);

    console.log(
      "Hybrid search results:",
      results
    );

    // --------------------------------
    // STEP 2: BUILD CONTEXT
    // --------------------------------

    const context = results
      .map((result) => result.text)
      .join("\n\n");

    console.log(
      "Context sent to Ollama:",
      context
    );

    // --------------------------------
    // STEP 3: SEND CONTEXT TO OLLAMA
    // --------------------------------

    const prompt = `
You are a helpful AI assistant for our web development course platform.

Answer the user's question using ONLY the information provided in the context below.

If the answer cannot be found in the context, politely say that you don't have that information and suggest contacting support.

Keep your answer short, clear, and conversational.

Do not repeat the entire context.

Do not mention the retrieval process, vector search, BM25, or RAG to the user.

Context:
${context}

User question:
${message}

Answer:
`;

    const response = await ollama.chat({
      model: "llama3.2",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const answer =
      response.message.content;

    console.log(
      "AI answer:",
      answer
    );

    // --------------------------------
    // STEP 4: SEND FINAL RESPONSE
    // --------------------------------

    res.json({
      success: true,
      question: message,
      answer,
      context,
      sources: results,
    });

  } catch (error) {

    console.error(
      "AI Chat Error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to generate AI response",
      error: error.message,
    });
  }
};

module.exports = {
  chatWithAI,
};