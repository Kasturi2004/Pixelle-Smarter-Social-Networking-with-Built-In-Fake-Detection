const mongoose = require("mongoose");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const User = require("../models/User");

function isParticipant(conversation, userId) {
  return conversation.participants.some(
    (participantId) => String(participantId) === String(userId)
  );
}

async function populateConversation(conversationId, currentUserId) {
  const conversation = await Conversation.findById(conversationId)
    .populate("participants", "username fullName profilePic isFake riskScore")
    .populate({
      path: "lastMessage",
      populate: {
        path: "senderId",
        select: "username fullName profilePic"
      }
    });

  if (!conversation) {
    return null;
  }

  const otherParticipant = conversation.participants.find(
    (participant) => String(participant._id) !== String(currentUserId)
  );

  return {
    ...conversation.toObject(),
    otherParticipant
  };
}

async function listConversations(req, res) {
  const conversations = await Conversation.find({
    participants: req.user._id
  }).sort({ lastMessageAt: -1 });

  const populatedConversations = await Promise.all(
    conversations.map((conversation) => populateConversation(conversation._id, req.user._id))
  );

  res.json({ conversations: populatedConversations.filter(Boolean) });
}

async function startConversation(req, res) {
  const { userId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: "Invalid user id" });
  }

  if (String(userId) === String(req.user._id)) {
    return res.status(400).json({ message: "You cannot message yourself" });
  }

  const targetUser = await User.findById(userId).select("_id");

  if (!targetUser) {
    return res.status(404).json({ message: "Target user not found" });
  }

  let conversation = await Conversation.findOne({
    participants: { $all: [req.user._id, userId] }
  });

  if (!conversation) {
    conversation = await Conversation.create({
      participants: [req.user._id, userId],
      lastMessageAt: new Date()
    });
  }

  const populatedConversation = await populateConversation(conversation._id, req.user._id);

  res.status(201).json({ conversation: populatedConversation });
}

async function getMessages(req, res) {
  const { conversationId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(conversationId)) {
    return res.status(400).json({ message: "Invalid conversation id" });
  }

  const conversation = await Conversation.findById(conversationId);

  if (!conversation) {
    return res.status(404).json({ message: "Conversation not found" });
  }

  if (!isParticipant(conversation, req.user._id)) {
    return res.status(403).json({ message: "You do not have access to this conversation" });
  }

  const messages = await Message.find({ conversationId })
    .sort({ createdAt: 1 })
    .populate("senderId", "username fullName profilePic");

  const populatedConversation = await populateConversation(conversation._id, req.user._id);

  res.json({ conversation: populatedConversation, messages });
}

async function sendMessage(req, res) {
  const { conversationId } = req.params;
  const { text } = req.body;

  if (!text?.trim()) {
    return res.status(400).json({ message: "Message text is required" });
  }

  if (!mongoose.Types.ObjectId.isValid(conversationId)) {
    return res.status(400).json({ message: "Invalid conversation id" });
  }

  const conversation = await Conversation.findById(conversationId);

  if (!conversation) {
    return res.status(404).json({ message: "Conversation not found" });
  }

  if (!isParticipant(conversation, req.user._id)) {
    return res.status(403).json({ message: "You do not have access to this conversation" });
  }

  const message = await Message.create({
    conversationId,
    senderId: req.user._id,
    text: text.trim()
  });

  conversation.lastMessage = message._id;
  conversation.lastMessageAt = new Date();
  await conversation.save();

  const populatedMessage = await Message.findById(message._id).populate(
    "senderId",
    "username fullName profilePic"
  );

  const populatedConversation = await populateConversation(conversation._id, req.user._id);

  res.status(201).json({
    message: populatedMessage,
    conversation: populatedConversation
  });
}

module.exports = {
  listConversations,
  startConversation,
  getMessages,
  sendMessage
};

