import mongoose from "mongoose";

const customerSchema = new mongoose.Schema(
  {
    // ─── ref to User ──────────────────────────────────────
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // one customer profile per user
    },

    // ─── Profile fields ───────────────────────────────────
    bio: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },

    avatar: {
      url:      { type: String, default: "" },
      publicId: { type: String, default: "" },
    },

    location: {
      city:    { type: String, trim: true, default: "" },
      address: { type: String, trim: true, default: "" },
    },
  },
  { timestamps: true }
);

const Customer =
  mongoose.models.Customer || mongoose.model("Customer", customerSchema);

export default Customer;

// ### 🔄 العلاقة بين الاتنين:
// ```
// User (auth)          Customer (profile)
// ──────────           ──────────────────
// _id          ←─────  user: ObjectId
// fullName             fullName
// email                phone
// password             bio
// roles                avatar
// refreshTokens        location: { city, address }
// isActive