import jwt from "jsonwebtoken";
import pool from "../database/db.js";

export const generateAccessToken = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

export const generateRefreshToken = (user) => {
  const payload = {
    id: user.id,
    tokenVersion: Date.now(),
  };

  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
  });
};

export const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw error;
  }
};

export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch (error) {
    throw error;
  }
};

export const storeRefreshToken = async (userId, token) => {
  const decoded = jwt.decode(token);
  const expiresAt = new Date(decoded.exp * 1000);

  await pool.query(
    "INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)",
    [userId, token, expiresAt]
  );
};

export const revokeRefreshToken = async (token) => {
  await pool.query(
    "UPDATE refresh_tokens SET revoked = true WHERE token = $1",
    [token]
  );
};

export const isRefreshTokenValid = async (token) => {
  const result = await pool.query(
    "SELECT * FROM refresh_tokens WHERE token = $1 AND revoked = false AND expires_at > NOW()",
    [token]
  );
  return result.rows.length > 0;
};

export const cleanUpExpiredRefreshTokens = async () => {
  await pool.query(
    "DELETE FROM refresh_tokens WHERE expires_at < NOW() OR revoked = true"
  );
};
