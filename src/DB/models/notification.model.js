import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    // The user (Customer or Seller) who should receive this notification
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    title: { 
      type: String, 
      required: true 
    },
    message: { 
      type: String, 
      required: true 
    },
    // Useful if you want to click the notification and go to the specific order
    relatedId: { 
      type: mongoose.Schema.Types.ObjectId, 
      refPath: "onModel" // dynamically reference either Order, Product, etc.
    },
    onModel: {
      type: String,
      enum: ["Order", "Product"], // Add more later if needed
    },
    type: { 
      type: String, 
      enum: ["order_status", "order_cancelled", "system", "alert"], 
      default: "system" 
    },
    isRead: { 
      type: Boolean, 
      default: false 
    },
  },
  { timestamps: true }
);

export default mongoose.model("Notification", notificationSchema);