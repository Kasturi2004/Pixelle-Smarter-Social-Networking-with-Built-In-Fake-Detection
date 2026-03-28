const mongoose = require("mongoose");
const Follow = require("../models/Follow");
const User = require("../models/User");

async function enrichConnections(currentUserId, users) {
  const currentFollowing = await Follow.find({
    followerId: currentUserId,
    followingId: { $in: users.map((person) => person._id) }
  }).select("followingId");

  const followingLookup = new Set(
    currentFollowing.map((relationship) => String(relationship.followingId))
  );

  return users.map((person) => ({
    _id: person._id,
    username: person.username,
    fullName: person.fullName,
    profilePic: person.profilePic,
    isFake: person.isFake,
    riskScore: person.riskScore,
    isFollowing: followingLookup.has(String(person._id))
  }));
}

async function toggleFollow(req, res) {
  const { userId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: "Invalid user id" });
  }

  if (userId === String(req.user._id)) {
    return res.status(400).json({ message: "You cannot follow yourself" });
  }

  const targetUser = await User.findById(userId).select("_id");

  if (!targetUser) {
    return res.status(404).json({ message: "Target user not found" });
  }

  const existingFollow = await Follow.findOne({
    followerId: req.user._id,
    followingId: userId
  });

  if (existingFollow) {
    await existingFollow.deleteOne();
    return res.json({ following: false, message: "User unfollowed" });
  }

  await Follow.create({
    followerId: req.user._id,
    followingId: userId
  });

  res.json({ following: true, message: "User followed" });
}

async function listFollowers(req, res) {
  const targetUser = await User.findOne({ username: req.params.username }).select("_id");

  if (!targetUser) {
    return res.status(404).json({ message: "User not found" });
  }

  const relationships = await Follow.find({ followingId: targetUser._id })
    .sort({ createdAt: -1 })
    .populate("followerId", "username fullName profilePic isFake riskScore");

  const followers = relationships
    .map((relationship) => relationship.followerId)
    .filter(Boolean);

  const enrichedFollowers = await enrichConnections(req.user._id, followers);

  res.json({ users: enrichedFollowers });
}

async function listFollowing(req, res) {
  const targetUser = await User.findOne({ username: req.params.username }).select("_id");

  if (!targetUser) {
    return res.status(404).json({ message: "User not found" });
  }

  const relationships = await Follow.find({ followerId: targetUser._id })
    .sort({ createdAt: -1 })
    .populate("followingId", "username fullName profilePic isFake riskScore");

  const following = relationships
    .map((relationship) => relationship.followingId)
    .filter(Boolean);

  const enrichedFollowing = await enrichConnections(req.user._id, following);

  res.json({ users: enrichedFollowing });
}

module.exports = { toggleFollow, listFollowers, listFollowing };
