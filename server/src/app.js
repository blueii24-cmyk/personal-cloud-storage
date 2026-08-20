import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import routes from "./routes/index.js";
import { notFoundHandler, errorHandler } from "./middleware/errorHandler.js";

// This file builds the Express app but does NOT start listening.
// Separating "build the app" from "start the server" makes it possible
// to import `app` in automated tests later without opening a real port.

const app = express();

// credentials: true + an explicit origin (not "*") is required for the
// browser to send/receive our httpOnly auth cookie cross-origin, once
// the frontend (Vite, a different port) exists.
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());

app.use("/api", routes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
