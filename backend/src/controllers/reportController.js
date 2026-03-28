const mongoose = require("mongoose");
const Report = require("../models/Report");
const User = require("../models/User");

async function submitReport(req, res) {
  const { userId } = req.params;
  const { reason, details } = req.body;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: "Invalid user id" });
  }

  if (String(userId) === String(req.user._id)) {
    return res.status(400).json({ message: "You cannot report your own account" });
  }

  if (!reason?.trim()) {
    return res.status(400).json({ message: "Please choose a reason for the report" });
  }

  const targetUser = await User.findById(userId).select("_id");

  if (!targetUser) {
    return res.status(404).json({ message: "User not found" });
  }

  const existingReport = await Report.findOne({
    reporterId: req.user._id,
    reportedUserId: userId
  });

  if (existingReport) {
    existingReport.reason = reason.trim();
    existingReport.details = details?.trim() || "";
    await existingReport.save();

    return res.json({
      message: "Your report was updated successfully",
      report: existingReport
    });
  }

  const report = await Report.create({
    reporterId: req.user._id,
    reportedUserId: userId,
    reason: reason.trim(),
    details: details?.trim() || ""
  });

  res.status(201).json({
    message: "Account reported successfully",
    report
  });
}

module.exports = {
  submitReport
};
