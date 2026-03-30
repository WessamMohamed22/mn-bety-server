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
      // unique: true,
      match: [REGEX.EMAIL, MESSAGES.VALIDATION.INVALID_EMAIL],
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      match: [REGEX.PASSWORD, MESSAGES.VALIDATION.INVALID_EMAIL],
      required: true,
    },
    passwordChangedAt: Date,
    phone: { type: String, match: REGEX.PHONE },
    phoneVerified: { type: Boolean, default: false },
    emailVerified: { type: Boolean, default: false },
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
    emailVerificationToken: {
      token: {
        type: String,
        default: null,
      },
      expireAt: {
        type: Date,
        default: null,
      },
    },
    passwordResetToken: {
      token: {
        type: String,
        default: null,
      },
      expireAt: {
        type: Date,
        default: null,
      },
    },
    roles: {
      type: [String],
      enum: Object.values(ROLES),
      default: [ROLES.CUSTOMER],
    },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    deletedAt:  { type: Date,    default: null  },
    lastLogin: Date,
  },
  { timestamps: true }
);

userSchema.index(
  { email: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);

// hash password in the schema before saving
userSchema.pre("save", async function () {
  // check if password modified or not
  if (!this.isModified("password")) return;
  // hash password & save in user
  const result = await hashPassword(this.password);
  this.password = result;
});

// Track password change time
userSchema.pre("save", function () {
  if (!this.isModified("password") || this.isNew) return;
  // subtract 1s to avoid JWT timing issues !!!
  this.passwordChangedAt = Date.now() - 1000;
});

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    // Convert milliseconds to seconds
    // Because JWT iat is in seconds, not milliseconds
    // Converts the result into an integer (base 10)
    const changedTime = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    // true = password changed after token was issued
    return JWTTimestamp < changedTime;
  }
  return false;
};

const User = mongoose.model.User || mongoose.model("User", userSchema);

export default User;
