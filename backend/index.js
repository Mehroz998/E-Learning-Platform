import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoute from "./routers/authRoute.js";
import courseRoute from "./routers/coursesRoute.js";
import { cloudinaryConfig } from "./utils/cloudinary.js";
import categoriesRoute from "./routers/categoriesRoute.js";
import sectionsRoute from "./routers/sectionsRoute.js";
import lessonsRoute from "./routers/lessonsRoute.js";
import quizzesRoute from "./routers/quizzesRoute.js";
import assignmentRoute from "./routers/assignmentRoute.js";
import reviewsRoute from "./routers/reviewsRoute.js";
import progressRoute from "./routers/progressRoute.js";
import dashboardRoute from "./routers/dashboardRoute.js";
import errorMiddleware from "./middlewares/errorMiddleware.js";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";

//Load Environment Variables
dotenv.config();

//Initialize App
const app = express();

// Rate limiter Function (Relaxed for development)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 1000, // Increased limit for development (100 requests per 15min was triggering easily during dev)
  standardHeaders: "draft-8",
  legacyHeaders: false,
  // Note: In production, reduce this to 100-200 and consider applying only to sensitive routes
});

//Middleware
app.use(express.json());
app.use(
  cors({
    origin: "*",
  })
);
app.use(express.urlencoded({ extended: true }));

cloudinaryConfig();

//Third Party Middleware
app.use(helmet());
app.use(limiter);

//Routes MiddleWare
//Authentication Route
app.use("/api/auth", authRoute);
//Courses Route
app.use("/api/courses", courseRoute);

app.use("/api/categories", categoriesRoute);

app.use("/api/sections", sectionsRoute);

app.use("/api/lessons", lessonsRoute);

app.use("/api/quizzes", quizzesRoute);

app.use("/api/assignments", assignmentRoute);

app.use("/api/reviews", reviewsRoute);

app.use("/api/enrollments", progressRoute); // Mapped to /api/enrollments to match project.txt spec for progress

app.use("/api/dashboard", dashboardRoute);

// Global Error Handler
app.use(errorMiddleware);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

//Start Server
app.listen(3000, () => {
  console.log("Server started on port 3000");
});

//Gracefully Shutdown Server
process.on("SIGINT", () => {
  console.log("Server shutdown Gracefully");
  process.exit(0);
});
