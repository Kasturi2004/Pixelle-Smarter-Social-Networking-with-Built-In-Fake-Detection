require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const connectDB = require("../src/config/db");
const User = require("../src/models/User");
const Follow = require("../src/models/Follow");
const { scoreUserProfile } = require("../src/services/mlService");

const DEMO_USERNAME = "mishtykayy";
const DEMO_EMAIL = "mishtykayy.demo@pixelle.app";
const DEMO_PASSWORD = "PixelleDemo123";
const DUMMY_COUNT = 1000;
const FOLLOWER_COUNT = 10;

async function ensureDemoUser() {
  let demoUser = await User.findOne({ username: DEMO_USERNAME });
  let created = false;

  if (!demoUser) {
    demoUser = await User.create({
      username: DEMO_USERNAME,
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      fullName: "Mishty Kaur",
      bio: "Demo account for Pixelle showcase.",
      isPrivate: false
    });
    created = true;
  }

  if (!demoUser.fullName?.trim()) {
    demoUser.fullName = "Mishty Kaur";
  }

  if (!demoUser.bio?.trim()) {
    demoUser.bio = "Demo account for Pixelle showcase.";
  }

  if (!demoUser.email?.trim()) {
    demoUser.email = DEMO_EMAIL;
  }

  await demoUser.save();
  return { demoUser, created };
}

function buildDummyUser(index, hashedPassword) {
  const paddedNumber = String(index + 1).padStart(4, "0");

  return {
    username: `pixelle_dummy_${paddedNumber}`,
    email: `pixelle_dummy_${paddedNumber}@pixelle.app`,
    password: hashedPassword,
    fullName: `Demo User ${paddedNumber}`,
    bio: "",
    isPrivate: false
  };
}

async function ensureDummyUsers() {
  const usernames = Array.from({ length: DUMMY_COUNT }, (_value, index) =>
    buildDummyUser(index, "").username
  );
  const existingUsers = await User.find({ username: { $in: usernames } }).select("_id username");
  const existingUsernames = new Set(existingUsers.map((user) => user.username));
  const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 10);

  const missingUsers = Array.from({ length: DUMMY_COUNT }, (_value, index) =>
    buildDummyUser(index, hashedPassword)
  ).filter((user) => !existingUsernames.has(user.username));

  if (missingUsers.length) {
    await User.insertMany(missingUsers);
  }

  return User.find({ username: { $in: usernames } }).sort({ username: 1 });
}

async function seedFollowGraph(demoUser, dummyUsers) {
  await Follow.deleteMany({
    $or: [{ followerId: demoUser._id }, { followingId: demoUser._id }]
  });

  const followDocuments = [
    ...dummyUsers.map((dummyUser) => ({
      followerId: demoUser._id,
      followingId: dummyUser._id
    })),
    ...dummyUsers.slice(0, FOLLOWER_COUNT).map((dummyUser) => ({
      followerId: dummyUser._id,
      followingId: demoUser._id
    }))
  ];

  await Follow.insertMany(followDocuments, { ordered: false });
}

async function refreshDemoRisk(demoUser) {
  const { riskScore, isFake } = await scoreUserProfile(demoUser);
  demoUser.riskScore = riskScore;
  demoUser.isFake = isFake;
  await demoUser.save();
}

async function main() {
  await connectDB();

  const { demoUser, created } = await ensureDemoUser();
  const dummyUsers = await ensureDummyUsers();

  await seedFollowGraph(demoUser, dummyUsers);
  await refreshDemoRisk(demoUser);

  console.log("");
  console.log("Demo account seeded successfully.");
  console.log(`Username: ${DEMO_USERNAME}`);
  console.log(`Email: ${demoUser.email}`);
  console.log(
    created
      ? `Password: ${DEMO_PASSWORD}`
      : "Password: existing account password preserved"
  );
  console.log(`Following: ${DUMMY_COUNT}`);
  console.log(`Followers: ${FOLLOWER_COUNT}`);
}

main()
  .catch((error) => {
    console.error("Unable to seed demo account", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close();
  });
