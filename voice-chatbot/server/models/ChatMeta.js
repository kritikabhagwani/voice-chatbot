const mongoose = require("mongoose");

const chatMetaSchema = new mongoose.Schema(
  {
    chatId: {
      type: String,
      required: true,
      unique: true,
    },
    userId: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      default: "New Chat",
    },
    messageCount: {
      type: Number,
      default: 0,
    },
    isSummarized: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ChatMeta", chatMetaSchema);
