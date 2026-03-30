import authRouter from "../modules/auth/auth.routes.js";
import adminRouter from "../modules/admin/admin.routes.js";
import categoryRouter from "../modules/category/category.routes.js";
import productRouter from "../modules/product/product.routes.js";
import cartRouter from "../modules/cart/cart.routes.js";
import wishlistRouter from "../modules/wishlist/wishlist.routes.js";
import reviewRouter, { productReviewRouter } from "../modules/review/review.routes.js";
import customerRouter from "../modules/customer/customer.routes.js";
import sellerRouter from "../modules/seller/seller.routes.js";
import orderRouter from "../modules/order/order.routes.js";
import notificationRouter from "../modules/notification/notification.routes.js";

// ─── Route Handler

// registers all app routes and handles unknown routes
const routerHandler = (app) => {
  // ─── Health Check
  app.all("/", (req, res) => {
    res.send("hello from mn-bety server.");
  });

  // ─── API Routes
  app.use("/api/auth", authRouter);
  app.use("/api/admin", adminRouter);
  app.use("/api/sellers", sellerRouter);
  app.use("/api/customers", customerRouter);
  app.use("/api/categories", categoryRouter);
  app.use("/api/products", productRouter);
  app.use("/api/cart", cartRouter);
  app.use("/api/wishlist", wishlistRouter);
  app.use("/api/products/:productId/reviews", productReviewRouter);
  app.use("/api/reviews", reviewRouter);
  app.use("/api/orders", orderRouter);
  app.use("/api/notifications", notificationRouter);
  // ─── Unknown Route Handler
  app.use("/{*any}", (req, res) => {
    res.status(404).json({ message: "this Router is not found!" });
  });
};

export default routerHandler;
