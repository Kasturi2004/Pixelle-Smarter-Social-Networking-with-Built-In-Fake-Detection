const express = require("express");
const {
  listConversations,
  startConversation,
  getMessages,
  sendMessage
} = require("../controllers/messageController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.get("/conversations", protect, listConversations);
router.post("/start/:userId", protect, startConversation);
router.get("/:conversationId", protect, getMessages);
router.post("/:conversationId", protect, sendMessage);

module.exports = router;

