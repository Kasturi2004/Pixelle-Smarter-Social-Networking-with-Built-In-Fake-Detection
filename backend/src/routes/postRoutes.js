const express = require("express");
const {
  createPost,
  getFeed,
  getPostsByUser,
  toggleLike,
  addComment
} = require("../controllers/postController");
const { protect } = require("../middleware/auth");
const upload = require("../middleware/upload");

const router = express.Router();

router.get("/feed", protect, getFeed);
router.get("/user/:userId", protect, getPostsByUser);
router.post("/", protect, upload.single("image"), createPost);
router.post("/:postId/like", protect, toggleLike);
router.post("/:postId/comments", protect, addComment);

module.exports = router;

