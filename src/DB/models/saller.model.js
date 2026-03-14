import mongoose from "mongoose";

const sellerSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 1000,
    },

    logo: {
      url: {
        type: String,      
        default: "",
      },
      publicId: {  
        type: String,
        default: "",
      },
    },

    isApproved: {
      type: Boolean,
      default: false,
    },

    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    totalSales: {
      type: Number,
      default: 0,
    },

    location: {
      country: { type: String, trim: true },
      city: { type: String, trim: true },
      address: { type: String, trim: true },
    },

    bankInfo: {
      bankName: { type: String, trim: true },
      accountName: { type: String, trim: true },
      accountNumber: { type: String, trim: true },
      iban: { type: String, trim: true },
    },
  },
  { timestamps: true }
);

const Seller =
  mongoose.models.Seller || mongoose.model("Seller", sellerSchema);

export default Seller;