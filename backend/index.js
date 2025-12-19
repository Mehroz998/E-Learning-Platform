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

// Rate limiter Function
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
  standardHeaders: "draft-8", // draft-6: `RateLimit-*` headers; draft-7 & draft-8: combined `RateLimit` header
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
  ipv6Subnet: 56, // Set to 60 or 64 to be less aggressive, or 52 or 48 to be more aggressive
  // store: ... , // Redis, Memcached, etc. See below.
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
