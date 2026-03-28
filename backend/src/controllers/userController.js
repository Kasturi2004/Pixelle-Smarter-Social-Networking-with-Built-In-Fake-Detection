const User = require("../models/User");
const Post = require("../models/Post");
const Follow = require("../models/Follow");
const Comment = require("../models/Comment");
const Report = require("../models/Report");
const { scoreUserProfile } = require("../services/mlService");
const { sanitizeUser } = require("./authController");

async function buildProfileResponse(viewerId, user) {
  const [postsCount, followersCount, followingCount, isFollowing, hasReported] = await Promise.all([
    Post.countDocuments({ userId: user._id }),
    Follow.countDocuments({ followingId: user._id }),
    Follow.countDocuments({ followerId: user._id }),
    viewerId
      ? Follow.exists({ followerId: viewerId, followingId: user._id })
      : Promise.resolve(false),
    viewerId
      ? Report.exists({ reporterId: viewerId, reportedUserId: user._id })
      : Promise.resolve(false)
  ]);

  return {
    ...sanitizeUser(user),
    stats: {
      posts: postsCount,
      followers: followersCount,
      following: followingCount
    },
    isFollowing: Boolean(isFollowing),
    hasReported: Boolean(hasReported)
  };
}

async function getMyProfile(req, res) {
  const profile = await buildProfileResponse(req.user._id, req.user);
  res.json({ user: profile });
}

async function updateMyProfile(req, res) {
  const { username, bio, fullName, externalUrl, isPrivate } = req.body;
  const user = await User.findById(req.user._id);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  if (username && username !== user.username) {
    const usernameTaken = await User.findOne({ username, _id: { $ne: user._id } });

    if (usernameTaken) {
      return res.status(400).json({ message: "Username is already taken" });
    }

    user.username = username;
  }

  if (typeof bio === "string") {
    user.bio = bio;
  }

  if (typeof fullName === "string") {
    user.fullName = fullName;
  }

  if (typeof externalUrl === "string") {
    user.externalUrl = externalUrl;
  }

  if (typeof isPrivate !== "undefined") {
    user.isPrivate = isPrivate === true || isPrivate === "true";
  }

  if (req.file) {
    user.profilePic = `/uploads/${req.file.filename}`;
  }

  await user.save();

  const { riskScore, isFake } = await scoreUserProfile(user);
  user.riskScore = riskScore;
  user.isFake = isFake;
  await user.save();

  const profile = await buildProfileResponse(req.user._id, user);
  res.json({ user: profile });
}

async function getProfileByUsername(req, res) {
  const user = await User.findOne({ username: req.params.username }).select("-password");

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const profile = await buildProfileResponse(req.user?._id, user);
  const posts = await Post.find({ userId: user._id })
    .sort({ createdAt: -1 })
    .populate("userId", "username fullName profilePic isFake riskScore");

  const postsWithComments = await Promise.all(
    posts.map(async (post) => {
      const comments = await Comment.find({ postId: post._id })
        .sort({ createdAt: 1 })
        .populate("userId", "username fullName profilePic");

      return {
        ...post.toObject(),
        comments
      };
    })
  );

  res.json({ user: profile, posts: postsWithComments });
}

async function listUsers(req, res) {
  const users = await User.find({
    _id: { $ne: req.user._id },
    username: { $not: /^pixelle_dummy_/ }
  })
    .select("-password")
    .sort({ createdAt: -1 })
    .limit(20);

  const enrichedUsers = await Promise.all(
    users.map((user) => buildProfileResponse(req.user._id, user))
  );

  res.json({ users: enrichedUsers });
}

module.exports = { getMyProfile, updateMyProfile, getProfileByUsername, listUsers };
