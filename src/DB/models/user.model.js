// import { mongoose } from "mongoose";
// import { ROLES } from "../../constants/roles.js";
// import { MESSAGES } from "../../constants/messages.js";
// import { hashPassword } from "../../utils/hash.util.js";
// import { REGEX } from "../../utils/regex.util.js";

// const userSchema = new mongoose.Schema(
//   {
//     fullName: {
//       type: String,
//       required: true,
//       minLength: 2,
//       lowercase: true,
//       trim: true,
//     },
//     email: {
//       type: String,
//       required: true,
//       minLength: 8,
//       unique: true,
//       match: [REGEX.EMAIL, MESSAGES.VALIDATION.INVALID_EMAIL],
//       lowercase: true,
//       trim: true,
//     },
//     password: {
//       type: String,
//       match: [REGEX.PASSWORD, MESSAGES.VALIDATION.INVALID_EMAIL],
//       required: true,
//     },
//     passwordChangedAt: Date,
//     avatar: {
//       url: { type: String, default: "" },
//       publicId: { type: String, default: "" },
//     },
//     roles: {
//       type: [String],
//       enum: Object.values(ROLES),
//       default: [ROLES.USER],
//     },
//     phone: { type: String, match: REGEX.PHONE },
//     isActive: { type: Boolean, default: true },
//     emailVerified: { type: Boolean, default: false },
//     phoneVerified: { type: Boolean, default: false },
//     lastLogin: Date,
//     refreshTokens: [
//       {
//         token: {
//           type: String,
//           required: true,
//         },
//         expireAt: {
//           type: Date,
//           required: true,
//         },
//       },
//     ],
//   },
//   { timestamps: true }
// );

// // hash password in the schema before saving
// userSchema.pre("save", async function () {
//   // check if password modified or not
//   if (!this.isModified("password")) return;
//   // hash password & save in user
//   const result = await hashPassword(this.password);
//   this.password = result;
// });

// // Track password change time
// userSchema.pre("save", function () {
//   if (!this.isModified("password") || this.isNew) return;
//   // subtract 1s to avoid JWT timing issues !!!
//   this.passwordChangedAt = Date.now() - 1000;
// });

// userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
//   if (this.passwordChangedAt) {
//     // Convert milliseconds to seconds
//     // Because JWT iat is in seconds, not milliseconds
//     // Converts the result into an integer (base 10)
//     const changedTime = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
//     // true = password changed after token was issued
//     return JWTTimestamp < changedTime;
//   }
//   return false;
// };

// const User = mongoose.model.User || mongoose.model("User", userSchema);

// export default User;
import mongoose from "mongoose";
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
      required: true,
    },
    passwordChangedAt: Date,

    avatar: {
      url:      { type: String, default: "" },
      publicId: { type: String, default: "" },
    },

    bio: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },

    location: {
      city:    { type: String, trim: true, default: "" },
      address: { type: String, trim: true, default: "" },
    },

    roles: {
      type: [String],
      enum: Object.values(ROLES),
      default: [ROLES.USER],
    },

    phone: {
      type: String,
      match: REGEX.PHONE,
      default: "",
    },

    isActive:      { type: Boolean, default: true },
    emailVerified: { type: Boolean, default: false },
    phoneVerified: { type: Boolean, default: false },
    lastLogin: Date,

    refreshTokens: [
      {
        token:    { type: String, required: true },
        expireAt: { type: Date,   required: true },
      },
    ],
  },
  { timestamps: true }
);

// ─── Hash password before saving ─────────────────────────────────────────────
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await hashPassword(this.password);
});

// ─── Track password change time ───────────────────────────────────────────────
userSchema.pre("save", function () {
  if (!this.isModified("password") || this.isNew) return;
  this.passwordChangedAt = Date.now() - 1000;
});

// ─── Check if password changed after token issued ────────────────────────────
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTime = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTime;
  }
  return false;
};

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;
