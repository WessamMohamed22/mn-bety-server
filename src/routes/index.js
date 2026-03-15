import authRouter from "../modules/auth/auth.routes.js";
import categoryRouter from "../modules/category/category.routes.js";
import productRouter from "../modules/product/product.routes.js";

// ─── Route Handler
// registers all app routes and handles unknown routes
const routerHandler = (app) => {
  // ─── Health Check
  app.all("/", (req, res) => {
    res.send("hello from mn-bety server.");
  });

  // ─── API Routes
  app.use("/api/auth", authRouter);
  app.use("/api/categories", categoryRouter);
  app.use("/api/products", productRouter);
  

  // ─── Unknown Route Handler
  app.use("/{*any}", (req, res) => {
    res.status(404).json({ message: "this Router is not found!" });
  });
};

export default routerHandler;
