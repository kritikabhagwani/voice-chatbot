const express = require("express");

const { chatWithAI } = require("../controllers/chatController");
const ChatMeta = require("../models/ChatMeta");
const { getChatMessages } = require("../services/memoryService");
const { getAuth } = require("@clerk/express");

const router = express.Router();

const requireAuth = (req, res, next) => {
  const auth = getAuth(req);

  console.log("========== CLERK AUTH ==========");
  console.log("isAuthenticated:", auth.isAuthenticated);
  console.log("userId:", auth.userId);
  console.log("sessionId:", auth.sessionId);
  console.log("================================");

  if (!auth.isAuthenticated) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }

  next();
};

router.post("/", requireAuth, chatWithAI);

router.get("/", requireAuth, async (req, res) => {
  try {
    const { userId } = getAuth(req);

    const chats = await ChatMeta.find({ userId }).sort({
      updatedAt: -1,
    });

    res.json({
      success: true,
      chats,
    });
  } catch (error) {
    console.error("Error fetching chats:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

router.get("/:chatId", requireAuth, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { userId } = getAuth(req);

    const chatMeta = await ChatMeta.findOne({
      chatId,
      userId,
    });

    if (!chatMeta) {
      return res.status(404).json({
        success: false,
        message: "Chat not found",
      });
    }

    const messages = await getChatMessages(chatId);

    res.json({
      success: true,
      chat: chatMeta,
      messages,
    });
  } catch (error) {
    console.error("Error loading chat:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;