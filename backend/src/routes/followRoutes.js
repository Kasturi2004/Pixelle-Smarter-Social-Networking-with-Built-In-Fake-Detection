const express = require("express");
const { toggleFollow, listFollowers, listFollowing } = require("../controllers/followController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.get("/:username/followers", protect, listFollowers);
router.get("/:username/following", protect, listFollowing);
router.post("/:userId", protect, toggleFollow);

module.exports = router;
