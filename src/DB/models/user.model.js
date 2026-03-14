import { mongoose } from "mongoose";
import { ROLES } from "../../constants/roles.js";
import { MESSAGES } from "../../constants/messages.js";
import { hashPassword } from "../../utils/hash.util.js";
import { REGEX } from "../../utils/regex.util.js";

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      minLength: 2,
      lowercase: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      minLength: 8,
      unique: true,
      match: [REGEX.EMAIL, MESSAGES.VALIDATION.INVALID_EMAIL],
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      match: [REGEX.PASSWORD, MESSAGES.VALIDATION.INVALID_EMAIL],
      required: true,
    },
    avatar: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" },
    },
    roles: {
      type: [String],
      enum: Object.values(ROLES),
      default: [ROLES.USER],
    },
    bio: {
      type: String,
      maxlength: 500,
    },
    phone: { type: String, match: REGEX.PHONE },
    address: String,
    isActive: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: false },
    lastLogin: Date,
    refreshTokens: [
      {
        token: {
          type: String,
          required: true,
        },
        expireAt: {
          type: Date,
          required: true,
        },
      },
    ],
  },
  { timestamps: true }
);

// hash password in the schema before saving
userSchema.pre("save", async function () {
  // check if password modified or not
  if (!this.isModified("password")) return;
  // hash password & save in user
  const result = await hashPassword(this.password);
  this.password = result;
});

const User = mongoose.model.User || mongoose.model("User", userSchema);

export default User;
