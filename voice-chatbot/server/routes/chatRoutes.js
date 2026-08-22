const express = require("express");
const { chatWithAI } = require("../controllers/chatController");
const ChatMeta = require("../models/ChatMeta");
const { getChatMessages } = require("../services/memoryService");
const { ClerkExpressRequireAuth } = require('@clerk/clerk-sdk-node');

const router = express.Router();

router.post("/", ClerkExpressRequireAuth(), chatWithAI);

// Get all chats
router.get("/", ClerkExpressRequireAuth(), async (req, res) => {
  try {
    const chats = await ChatMeta.find({ userId: req.auth.userId }).sort({ updatedAt: -1 });
    res.json({ success: true, chats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get messages for a specific chat
router.get("/:chatId", ClerkExpressRequireAuth(), async (req, res) => {
  try {
    const { chatId } = req.params;
    const chatMeta = await ChatMeta.findOne({ chatId, userId: req.auth.userId });
    if (!chatMeta) {
      return res.status(404).json({ success: false, message: "Chat not found" });
    }
    const messages = await getChatMessages(chatId);
    res.json({ success: true, chat: chatMeta, messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;