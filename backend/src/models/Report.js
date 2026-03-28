const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    reporterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    reportedUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    reason: {
      type: String,
      required: true,
      trim: true
    },
    details: {
      type: String,
      default: "",
      trim: true
    }
  },
  {
    timestamps: true
  }
);

reportSchema.index({ reporterId: 1, reportedUserId: 1 }, { unique: true });

module.exports = mongoose.model("Report", reportSchema);
