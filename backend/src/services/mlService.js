const axios = require("axios");
const Post = require("../models/Post");
const Follow = require("../models/Follow");
const Comment = require("../models/Comment");

function safeWordCount(value) {
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function digitRatio(value) {
  if (!value) {
    return 0;
  }

  const digits = (value.match(/\d/g) || []).length;
  return Number((digits / value.length).toFixed(2));
}

function calculateProfileCompleteness(user) {
  const signals = [
    Boolean(user.profilePic),
    Boolean(user.fullName?.trim()),
    Boolean(user.bio?.trim()),
    Boolean(user.externalUrl?.trim())
  ];
  const completedSignals = signals.filter(Boolean).length;
  return Number((completedSignals / signals.length).toFixed(2));
}

async function buildUserFeatures(user) {
  const [numberOfPosts, followers, following, recentPosts, recentComments] =
    await Promise.all([
      Post.countDocuments({ userId: user._id }),
      Follow.countDocuments({ followingId: user._id }),
      Follow.countDocuments({ followerId: user._id }),
      Post.countDocuments({
        userId: user._id,
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      }),
      Comment.countDocuments({
        userId: user._id,
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      })
    ]);

  const accountAgeDays = Math.max(
    1,
    Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (24 * 60 * 60 * 1000))
  );
  const followerFollowingRatio =
    following === 0 ? followers : Number((followers / following).toFixed(2));
  const activityLevel = Number(
    Math.min((recentPosts * 2 + recentComments) / 20, 1).toFixed(2)
  );
  const fullName = user.fullName?.trim() || "";
  const username = user.username?.trim() || "";
  const normalizedFullName = fullName.toLowerCase().replace(/\s+/g, "");
  const normalizedUsername = username.toLowerCase();
  const profileCompleteness = calculateProfileCompleteness(user);
  const hasProfilePic = user.profilePic ? 1 : 0;
  const hasExternalUrl = user.externalUrl?.trim() ? 1 : 0;
  const isPrivate = user.isPrivate ? 1 : 0;
  const descriptionLength = user.bio?.trim().length || 0;
  const fullNameWords = fullName ? safeWordCount(fullName) : 0;
  const usernameDigitRatio = digitRatio(username);
  const fullNameDigitRatio = digitRatio(fullName);
  const nameEqualsUsername = Number(
    Boolean(normalizedFullName && normalizedFullName === normalizedUsername)
  );

  return {
    profilePic: hasProfilePic,
    usernameDigitRatio,
    fullNameWords,
    fullNameDigitRatio,
    nameEqualsUsername,
    descriptionLength,
    externalUrl: hasExternalUrl,
    isPrivate,
    numberOfPosts,
    followers,
    following,
    profileCompleteness,
    followerFollowingRatio,
    accountAgeDays,
    activityLevel,
    "profile pic": hasProfilePic,
    "nums/length username": usernameDigitRatio,
    "fullname words": fullNameWords,
    "nums/length fullname": fullNameDigitRatio,
    "name==username": nameEqualsUsername,
    "description length": descriptionLength,
    "external URL": hasExternalUrl,
    private: isPrivate,
    "#posts": numberOfPosts,
    "#followers": followers,
    "#follows": following,
    profile_completeness: profileCompleteness
  };
}

async function scoreUserProfile(user) {
  const payload = await buildUserFeatures(user);

  try {
    const { data } = await axios.post(
      `${process.env.ML_SERVICE_URL || "http://127.0.0.1:8000"}/predict`,
      payload
    );

    return {
      ...payload,
      riskScore: data.riskScore,
      isFake: data.isFake
    };
  } catch (error) {
    console.warn("ML service unavailable, using fallback rule-based score");

    const riskScore = Number(
      Math.min(
        1,
        Math.max(
          0,
          0.35 +
            (payload.numberOfPosts === 0 ? 0.18 : 0) +
            (payload.followerFollowingRatio < 0.15 ? 0.2 : 0) +
            (payload.accountAgeDays < 14 ? 0.12 : 0) -
            payload.activityLevel * 0.15
        )
      ).toFixed(2)
    );

    return {
      ...payload,
      riskScore,
      isFake: riskScore >= 0.62
    };
  }
}

module.exports = { buildUserFeatures, scoreUserProfile };
