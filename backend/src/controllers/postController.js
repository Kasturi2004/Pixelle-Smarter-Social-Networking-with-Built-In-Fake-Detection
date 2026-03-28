const mongoose = require("mongoose");
const Post = require("../models/Post");
const Comment = require("../models/Comment");
const Follow = require("../models/Follow");

async function createPost(req, res) {
  if (!req.file) {
    return res.status(400).json({ message: "Image is required" });
  }

  const post = await Post.create({
    userId: req.user._id,
    image: `/uploads/${req.file.filename}`,
    caption: req.body.caption || ""
  });

  const populatedPost = await Post.findById(post._id).populate(
    "userId",
    "username fullName profilePic isFake riskScore"
  );

  res.status(201).json({ post: populatedPost });
}

async function getFeed(req, res) {
  const follows = await Follow.find({ followerId: req.user._id }).select("followingId");
  const followedUserIds = follows.map((follow) => follow.followingId);
  const idsForFeed = [req.user._id, ...followedUserIds];

  const posts = await Post.find({ userId: { $in: idsForFeed } })
    .sort({ createdAt: -1 })
    .populate("userId", "username fullName profilePic isFake riskScore");

  const postsWithComments = await Promise.all(
    posts.map(async (post) => {
      const comments = await Comment.find({ postId: post._id })
        .sort({ createdAt: 1 })
        .populate("userId", "username profilePic");

      return {
        ...post.toObject(),
        comments
      };
    })
  );

  res.json({ posts: postsWithComments });
}

async function getPostsByUser(req, res) {
  if (!mongoose.Types.ObjectId.isValid(req.params.userId)) {
    return res.status(400).json({ message: "Invalid user id" });
  }

  const posts = await Post.find({ userId: req.params.userId })
    .sort({ createdAt: -1 })
    .populate("userId", "username fullName profilePic isFake riskScore");

  res.json({ posts });
}

async function toggleLike(req, res) {
  if (!mongoose.Types.ObjectId.isValid(req.params.postId)) {
    return res.status(400).json({ message: "Invalid post id" });
  }

  const post = await Post.findById(req.params.postId);

  if (!post) {
    return res.status(404).json({ message: "Post not found" });
  }

  const alreadyLiked = post.likes.some((likeId) => String(likeId) === String(req.user._id));

  if (alreadyLiked) {
    post.likes = post.likes.filter((likeId) => String(likeId) !== String(req.user._id));
  } else {
    post.likes.push(req.user._id);
  }

  await post.save();

  res.json({
    liked: !alreadyLiked,
    likesCount: post.likes.length
  });
}

async function addComment(req, res) {
  const { text } = req.body;

  if (!text?.trim()) {
    return res.status(400).json({ message: "Comment text is required" });
  }

  if (!mongoose.Types.ObjectId.isValid(req.params.postId)) {
    return res.status(400).json({ message: "Invalid post id" });
  }

  const post = await Post.findById(req.params.postId);

  if (!post) {
    return res.status(404).json({ message: "Post not found" });
  }

  const comment = await Comment.create({
    userId: req.user._id,
    postId: post._id,
    text: text.trim()
  });

  const populatedComment = await Comment.findById(comment._id).populate(
    "userId",
    "username profilePic"
  );

  res.status(201).json({ comment: populatedComment });
}

module.exports = { createPost, getFeed, getPostsByUser, toggleLike, addComment };
