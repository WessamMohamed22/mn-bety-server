import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";

import { requestLoggerMW } from "./middlewares/requestLoggerMW.js";
import { errorHandler } from "./errors/errorHandler.js";
import routerHandler from "./routes/index.js";
import { env } from "./config/env.js";

dotenv.config();

const createApp = () => {
  // ======================= create APP:
  const app = express();

  // ======================= Middlewares:
  // app.use(cors());
  app.use(
    cors({
      origin: env.CLIENT_URL,
      credentials: true, //Accept cookies
    })
  );
  app.use(helmet());
  app.post(
    "/api/orders/webhook",
    express.raw({ type: "application/json" }),
    (req, res, next) => {
      // Attach the raw body to the request object so our controller can access it
      req.rawBody = req.body;
      next();
    }
  );
  app.use(express.json());
  app.use(cookieParser());
  app.use(express.urlencoded({ extended: true }));

  // ======================== For Test
  // log each request
  app.use(requestLoggerMW);

  // ======================== SECURE

  // ======================== ROUTE Handler
  routerHandler(app);

  // ======================== ERROR Handler
  // Error handler must be last thing
  app.use(errorHandler);

  return app;
};

export default createApp;
