const express = require("express");
const {
  getMyProfile,
  updateMyProfile,
  getProfileByUsername,
  listUsers
} = require("../controllers/userController");
const { protect } = require("../middleware/auth");
const upload = require("../middleware/upload");

const router = express.Router();

router.get("/", protect, listUsers);
router.get("/me", protect, getMyProfile);
router.put("/me", protect, upload.single("profilePic"), updateMyProfile);
router.get("/:username", protect, getProfileByUsername);

module.exports = router;

