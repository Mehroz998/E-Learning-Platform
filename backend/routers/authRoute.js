import express from "express";
import {
  register,
  login,
  logout,
  getMe,
  changePassword,
  refreshToken,
} from "../controllers/authController.js";
import { authenticate } from "../middlewares/auth.js";
import upload from "../middlewares/multer.js";
const router = express.Router();

// Register route: /api/auth/register
router.post("/register", upload.single("avatar"), register);

//Login route: /api/auth/login
router.post("/login", login);

//Logout route: /api/auth/logout
router.post("/logout", authenticate, logout);

//Profile Data: /api/auth/getme
router.get("/getme", authenticate, getMe);

//Change Password: /api/auth/change-password
router.put("/change-password", authenticate, changePassword);

// Refresh token endpoint should be public (does not require access token)
router.post("/refresh", refreshToken);

export default router;
