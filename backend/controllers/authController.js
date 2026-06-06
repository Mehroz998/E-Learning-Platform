import bcrypt from "bcrypt";
import pool from "../database/db.js";
import AppError from "../utils/AppError.js";
import {
  generateAccessToken,
  generateRefreshToken,
  revokeRefreshToken,
  storeRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt.js";
import { uploadProfile } from "../utils/cloudinary.js";
import { sanitizeInput } from "../utils/sanitization.js";
import { validateEmail } from "../utils/sanitization.js";

// Register
export const register = async (req, res, next) => {
  try {
    const { name, email, password, confirmPassword, role, bio } = sanitizeInput(
      req.body
    );

    let avatar = req.body.avatar;
    if (req.file) {
      avatar = await uploadProfile(req.file.path);
    }

    // Check user enter all the fields
    if (!name || !email || !password || !confirmPassword) {
      return next(new AppError("All fields are required", 400));
    }

    // Check if email already exists
    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );
    if (existingUser.rows.length > 0) {
      return next(new AppError("Email already registered", 409));
    }

    //Name only contain letter
    if (!/^[A-Za-z\s]+$/.test(name.trim())) {
      return next(new AppError("Name must only contain letters", 400));
    }

    //Check Email Format is valid or not
    if (!validateEmail(email)) {
      return next(new AppError("Invalid email format", 400));
    }

    // Check if password and confirm password are the same
    if (password !== confirmPassword) {
      return next(new AppError("Passwords do not match", 400));
    }

    //Hash Password
    const hashedPassword = await bcrypt.hash(password, 10);

    //create user
    const result = await pool.query(
      `
            INSERT INTO users (name, email, password, avatar, role, bio) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, email, role, avatar, bio, created_at
        `,
      [name, email, hashedPassword, avatar, role, bio]
    );

    const user = result.rows[0];

    res.status(201).json({
      success: true,
      message: "User created successfully",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        bio: user.bio,
        createdAt: user.created_at,
      },
    });
  } catch (error) {
    console.error("Registration Error:", error);
    next(error);
  }
};

//Login
export const login = async (req, res, next) => {
  try {
    const { email, password } = sanitizeInput(req.body);
    // Check both fields
    if (!email || !password) {
      return next(new AppError("All fields are required", 400));
    }

    // Check user exists or not by email
    const result = await pool.query(`SELECT * FROM users WHERE email=$1`, [
      email,
    ]);

    // if user not exists
    if (result.rows.length === 0) {
      return next(new AppError("Invalid Credentials", 401));
    }

    const user = result.rows[0];
    //Check user is active or not
    if (!user.is_active) {
      return next(new AppError("Account is deactivated", 401));
    }

    // if user exist check password using bcrypt
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    // check password true or not
    if (!isPasswordMatch) {
      return next(new AppError("Invalid Credentials", 401));
    }

    // JWT Token
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    //Store refresh token
    await storeRefreshToken(user.id, refreshToken);

    // res and store token in cookie
    res.status(200).json({
      success: true,
      message: "Login Successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    });
  } catch (err) {
    console.error("Login Error:", err);
    next(err);
  }
};

//logout User
export const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken || refreshToken == "") {
      throw new AppError("Required Token");
    }
    await revokeRefreshToken(refreshToken);

    res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (err) {
    console.log("Error Occured while Logout", err);
    res.json({
      success: false,
      message: "Failed to logout",
      error: err,
    });
  }
};

// Get My Data
export const getMe = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT id, name, email, role, avatar, is_active, created_at
             FROM users WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = result.rows[0];

    return res.status(200).json({
      success: true,
      message: "Profile Data",
      data: user,
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: "Both passwords are required" });
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ message: "New password must be at least 6 characters" });
    }

    // Get user from DB
    const result = await pool.query("SELECT * FROM users WHERE id = $1", [
      userId,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const dbPassword = result.rows[0].password;

    // Check old password
    const isMatch = await bcrypt.compare(oldPassword, dbPassword);

    if (!isMatch) {
      return res.status(400).json({ message: "Old password is incorrect" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await pool.query(
      `UPDATE users
             SET password = $1, updated_at = CURRENT_TIMESTAMP
             WHERE id = $2`,
      [hashedPassword, userId]
    );

    return res.json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("Error changing password:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

//Refresh Acces Token
export const refreshToken = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new AppError("Refresh token is required", 400);
  }

  // Check if token is valid in database
  const isValid = await isRefreshTokenValid(refreshToken);
  if (!isValid) {
    throw new AppError("Invalid or expired refresh token", 401);
  }

  // Verify token
  const decoded = verifyRefreshToken(refreshToken);

  // Get user
  const result = await pool.query(
    "SELECT id, name, email, role FROM users WHERE id = $1",
    [decoded.id]
  );

  if (result.rows.length === 0) {
    throw new AppError("User not found", 404);
  }

  const user = result.rows[0];

  //Revoke old refresh token
  await revokeRefreshToken(refreshToken);

  //Generate new tokens
  const newAccessToken = generateAccessToken(user);
  const newRefreshToken = generateRefreshToken(user);

  // Store new refresh token
  await storeRefreshToken(user.id, newRefreshToken);

  res.json({
    success: true,
    message: "Token refreshed successfully",
    data: {
      tokens: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
    },
  });
};
