const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const { scoreUserProfile } = require("../services/mlService");

function sanitizeUser(user) {
  return {
    _id: user._id,
    username: user.username,
    email: user.email,
    fullName: user.fullName,
    bio: user.bio,
    externalUrl: user.externalUrl,
    isPrivate: user.isPrivate,
    profilePic: user.profilePic,
    riskScore: user.riskScore,
    isFake: user.isFake,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}

async function registerUser(req, res) {
  const { username, email, password, fullName, bio, externalUrl, isPrivate } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: "Username, email, and password are required" });
  }

  const existingUser = await User.findOne({
    $or: [{ email: email.toLowerCase() }, { username }]
  });

  if (existingUser) {
    return res.status(400).json({ message: "User already exists" });
  }

  const user = await User.create({
    username,
    email: email.toLowerCase(),
    password,
    fullName: fullName || "",
    bio: bio || "",
    externalUrl: externalUrl || "",
    isPrivate: isPrivate === true || isPrivate === "true"
  });

  const { riskScore, isFake } = await scoreUserProfile(user);
  user.riskScore = riskScore;
  user.isFake = isFake;
  await user.save();

  res.status(201).json({
    token: generateToken(user._id),
    user: sanitizeUser(user)
  });
}

async function loginUser(req, res) {
  const { email, password } = req.body;

  const user = await User.findOne({ email: email?.toLowerCase() });

  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  res.json({
    token: generateToken(user._id),
    user: sanitizeUser(user)
  });
}

async function getCurrentUser(req, res) {
  res.json({ user: sanitizeUser(req.user) });
}

module.exports = { registerUser, loginUser, getCurrentUser, sanitizeUser };
