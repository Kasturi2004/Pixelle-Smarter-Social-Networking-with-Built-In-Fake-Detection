const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },
    fullName: {
      type: String,
      default: "",
      trim: true
    },
    password: {
      type: String,
      required: true
    },
    bio: {
      type: String,
      default: ""
    },
    externalUrl: {
      type: String,
      default: "",
      trim: true
    },
    isPrivate: {
      type: Boolean,
      default: false
    },
    profilePic: {
      type: String,
      default: ""
    },
    riskScore: {
      type: Number,
      default: 0
    },
    isFake: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

userSchema.pre("save", async function savePassword(next) {
  if (!this.isModified("password")) {
    next();
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = function matchPassword(enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
