const { ChromaClient } = require("chromadb");
const { generateEmbedding } = require("./embeddingService");
const { default: ollama } = require("ollama");

const client = new ChromaClient({
  host: "localhost",
  port: 8000,
  ssl: false,
});

const MASTER_MEMORY_COLLECTION = "master_memory";

const getMasterMemoryCollection = async () => {
  return await client.getOrCreateCollection({
    name: MASTER_MEMORY_COLLECTION,
    embeddingFunction: null,
  });
};

const getChatCollection = async (chatId) => {
  return await client.getOrCreateCollection({
    name: chatId,
    embeddingFunction: null,
  });
};

const addMessageToChat = async (chatId, text, sender, messageIndex) => {
  const collection = await getChatCollection(chatId);
  const embedding = await generateEmbedding(text);
  
  await collection.add({
    ids: [`msg_${messageIndex}`],
    embeddings: [embedding],
    metadatas: [{ sender, timestamp: new Date().toISOString() }],
    documents: [text],
  });
};

const getChatMessages = async (chatId) => {
  try {
    const collection = await getChatCollection(chatId);
    const results = await collection.get();
    
    // Sort by id (msg_0, msg_1, etc.)
    const messages = results.documents.map((doc, index) => ({
      id: results.ids[index],
      text: doc,
      sender: results.metadatas[index].sender,
    }));
    
    return messages.sort((a, b) => {
      const idxA = parseInt(a.id.split('_')[1]);
      const idxB = parseInt(b.id.split('_')[1]);
      return idxA - idxB;
    });
  } catch (error) {
    console.error("Error fetching chat messages:", error);
    return [];
  }
};

const searchCurrentChat = async (chatId, query, topK = 5) => {
  try {
    const collection = await getChatCollection(chatId);
    const count = await collection.count();
    if (count === 0) return [];

    const queryEmbedding = await generateEmbedding(query);
    const results = await collection.query({
      queryEmbeddings: [queryEmbedding],
      nResults: Math.min(topK, count),
    });

    return results.documents[0] || [];
  } catch (error) {
    console.error("Error searching current chat:", error);
    return [];
  }
};

const summarizeAndStore = async (chatId, userId) => {
  try {
    const messages = await getChatMessages(chatId);
    if (messages.length === 0) return;

    const chatText = messages.map(m => `${m.sender.toUpperCase()}: ${m.text}`).join("\n");
    
    const prompt = `Summarize the following chat conversation into a concise paragraph that captures the main topics discussed, user preferences, and any important conclusions. This summary will be used as memory for future conversations.\n\nConversation:\n${chatText}\n\nSummary:`;
    
    const response = await ollama.chat({
      model: "llama3.2",
      messages: [{ role: "user", content: prompt }],
    });
    
    const summary = response.message.content;
    const masterCollection = await getMasterMemoryCollection();
    const embedding = await generateEmbedding(summary);
    
    await masterCollection.add({
      ids: [`summary_${chatId}`],
      embeddings: [embedding],
      metadatas: [{ source_chat: chatId, userId, timestamp: new Date().toISOString() }],
      documents: [summary],
    });
    
    console.log(`Stored summary for chat ${chatId} in master memory.`);
    return summary;
  } catch (error) {
    console.error("Error summarizing chat:", error);
  }
};

const searchMasterMemory = async (query, userId, topK = 3) => {
  try {
    const collection = await getMasterMemoryCollection();
    const count = await collection.count();
    if (count === 0) return [];

    const queryEmbedding = await generateEmbedding(query);
    const results = await collection.query({
      queryEmbeddings: [queryEmbedding],
      nResults: Math.min(topK, count),
      where: { userId }
    });

    return results.documents[0] || [];
  } catch (error) {
    console.error("Error searching master memory:", error);
    return [];
  }
};

module.exports = {
  addMessageToChat,
  getChatMessages,
  searchCurrentChat,
  summarizeAndStore,
  searchMasterMemory
};
