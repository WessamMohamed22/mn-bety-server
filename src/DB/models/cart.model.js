import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
  
    quantity: {
      type: Number,                  //     user
      default: 1,                    //       |
      min: 1,                        //       |____cart
    },                               //              | 
                                     //              |______items[]
  },                                 //                        |
  { _id: false }                     //                        |______product
);
const cartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,      // (1) user ===> (1) cart 
    },

    items: [cartItemSchema],
  },
  { timestamps: true }
);

const Cart = mongoose.models.Cart || mongoose.model("Cart", cartSchema);

export default Cart;