const express = require("express");
const { submitReport } = require("../controllers/reportController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.post("/:userId", protect, submitReport);

module.exports = router;
