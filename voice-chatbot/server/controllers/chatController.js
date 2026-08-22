//used ollama
const { hybridSearch } = require("../services/vectorService");
const { default: ollama } = require("ollama");
const ChatMeta = require("../models/ChatMeta");
const {
  addMessageToChat,
  searchCurrentChat,
  searchMasterMemory,
  summarizeAndStore
} = require("../services/memoryService");

const MAX_MESSAGES = 80;

const chatWithAI = async (req, res) => {
  try {
    const userId = req.auth.userId;
    let { message, chatId } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: "Message is required" });
    }

    let chatMeta;
    if (chatId) {
      chatMeta = await ChatMeta.findOne({ chatId, userId });
      if (!chatMeta) {
        return res.status(404).json({ success: false, message: "Chat not found" });
      }
      if (chatMeta.messageCount >= MAX_MESSAGES) {
        return res.status(400).json({ 
          success: false, 
          message: "Chat limit reached. Please start a new chat.",
          limitReached: true
        });
      }
    } else {
      chatId = \`chat_\${userId}_\${Date.now()}\`;
      chatMeta = new ChatMeta({
        chatId,
        userId,
        title: message.substring(0, 30) + (message.length > 30 ? "..." : "")
      });
      await chatMeta.save();
    }

    console.log(`User question [${chatId}]:`, message);

    // --------------------------------
    // Retrieve Contexts
    // --------------------------------
    const [globalResults, chatResults, memoryResults] = await Promise.all([
      hybridSearch(message, 3),
      searchCurrentChat(chatId, message, 5),
      searchMasterMemory(message, userId, 2)
    ]);

    const globalContext = globalResults.map(r => r.text).join("\n\n");
    const chatContext = chatResults.join("\n\n");
    const memoryContext = memoryResults.join("\n\n");

    const fullContext = \`
[Global Knowledge]
\${globalContext || 'None'}

[Past Chat Memories]
\${memoryContext || 'None'}

[Recent Context in This Chat]
\${chatContext || 'None'}
\`;

    console.log("Full Context sent to Ollama:", fullContext);

    // --------------------------------
    // SEND CONTEXT TO OLLAMA
    // --------------------------------
    const prompt = \`
You are a helpful AI assistant for our web development course platform.

Answer the user's question using the information provided in the context below. 
The context includes Global Knowledge, summaries of Past Chat Memories, and Recent Context from this specific chat.

If the answer cannot be found in the context, politely say that you don't have that information and suggest contacting support.

Keep your answer short, clear, and conversational. Do not repeat the entire context.
Do not mention the retrieval process, vector search, BM25, or RAG to the user.

Context:
\${fullContext}

User question:
\${message}

Answer:
\`;

    const response = await ollama.chat({
      model: "llama3.2",
      messages: [{ role: "user", content: prompt }],
    });

    const answer = response.message.content;
    console.log("AI answer:", answer);

    // --------------------------------
    // Store Messages in Chroma
    // --------------------------------
    await addMessageToChat(chatId, message, 'user', chatMeta.messageCount);
    await addMessageToChat(chatId, answer, 'ai', chatMeta.messageCount + 1);
    
    chatMeta.messageCount += 2;
    
    // Check if limit reached after adding
    if (chatMeta.messageCount >= MAX_MESSAGES && !chatMeta.isSummarized) {
      chatMeta.isSummarized = true;
      // Trigger async summarization without awaiting
      summarizeAndStore(chatId, userId).catch(console.error);
    }
    await chatMeta.save();

    res.json({
      success: true,
      chatId,
      question: message,
      answer,
      context: fullContext,
      limitReached: chatMeta.messageCount >= MAX_MESSAGES
    });

  } catch (error) {
    console.error("AI Chat Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate AI response",
      error: error.message,
    });
  }
};

module.exports = { chatWithAI };