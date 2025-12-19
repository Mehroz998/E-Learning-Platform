import { verifyAccessToken } from "../utils/jwt.js";
import AppError from "../utils/AppError.js";
import pool from "../database/db.js";

export const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AppError("No token provided, Please login.", 401);
    }

    const token = authHeader.split(" ")[1];

    // Verify token
    const decoded = verifyAccessToken(token);

    // Check if user still exists and is active
    const result = await pool.query(
      "SELECT id, name, email, role, is_active FROM users WHERE id = $1",
      [decoded.id]
    );

    if (result.rows.length === 0) {
      throw new AppError("User no longer exists", 401);
    }

    const user = result.rows[0];

    if (!user.is_active) {
      throw new AppError("User account is deactivated", 401);
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return next(new AppError("Invalid token", 401));
    }
    if (error.name === "TokenExpiredError") {
      return next(new AppError("Token expired, Please login again", 401));
    }
    next(error);
  }
};

//Allow only specific roles
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError("Authentication required", 404));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(`Access denied. Required role: ${roles.join(" or ")}`)
      );
    }

    next();
  };
};

export const isAdmin = (req, res, next) => {
  if (req.user.role === "admin") {
    return next();
  }

  const resourceUserId = req.params.userId || req.body.user_id;

  if (req.user.id.toString() !== resourceUserId?.toString()) {
    return next(new AppError("You can only access your own resources"));
  }

  next();
};
