import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";

dotenv.config();

const createApp = () => {
  // ======================= create APP:
  const app = express();

  // ======================= Middlewares:
  app.use(cors());
  app.use(helmet());
  app.use(express.json());
  app.use(cookieParser());
  app.use(express.urlencoded({ extended: true }));

  // ======================== For Test
  // log each request

  // ======================== SECURE

  // ======================== ROUTE Handler

  // ======================== ERROR Handler
  // Error handler must be last thing

  return app;
};

export default createApp;
