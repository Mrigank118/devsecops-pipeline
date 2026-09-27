import passport from "passport";
import { validationResult } from "express-validator";
import { hashPassword } from "../utils/hash.js";
import { findUserByEmail, insertUser } from "./user.js";

// Registration Middleware
const registerUser = async (req, res, next) => {
  const { full_name, email, password } = req.body;

  // Validate user input
  const errors = validationResult(req);

  // Return errors if exists
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((err) => err.msg);
    return res.status(400).json({ error: errorMessages });
  }

  try {
    // Check if user already exists
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res
        .status(400)
        .json({ error: "User already exists! Try another email." });
    }

    // Hash password
    const { salt, hash } = await hashPassword(password);

    // Insert user
    const user = await insertUser(full_name, email, hash, salt);
    if (!user) return res.status(409).json({ error: "An account with that email already exists." });

    // Return success message
    res.status(201).json({ message: "Registration successful" });
  } catch (error) {
    next(error); // Pass error to error-handling middleware
  }
};

// Login Middleware
const loginUser = (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      console.error("Authentication error:", err);
      return res
        .status(500)
        .json({ message: "An error occurred during login." });
    }
    if (!user) {
      // Send the failure message when authentication fails
      return res.status(401).json({ message: info.message });
    }
    req.logIn(user, (err) => {
      if (err) {
        console.error("Login error:", err);
        return res.status(500).json({ message: "Login failed." });
      }

      // Never serialize credential material into an API response.
      return res
        .status(200)
        .json({
          message: "You logged in successfully",
          user: { id: user.id, full_name: user.full_name, email: user.email },
        });
    });
  })(req, res, next);
};

// Check Authentication Middelware
const isAuthenticated = (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "You need to be authenticated" });
  }
  next();
};

// Logout Middelware
const logoutUser = (req, res, next) => {
  req.logOut((err) => {
    if (err) return next(err);
    req.session.destroy((sessionError) => {
      if (sessionError) return next(sessionError);
      res.clearCookie("connect.sid", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      });
      res.status(200).json({ message: "You logged out successfully" });
    });
  });
};

// Get Authentication Status
const getAuthStatus = (req, res) => {
  if (req.isAuthenticated()) {
    res.status(200).json({
      isAuthenticated: true,
      user: {
        id: req.user.id,
        full_name: req.user.full_name,
        email: req.user.email,
      },
    });
  } else {
    res.status(200).json({ isAuthenticated: false });
  }
};

export { registerUser, loginUser, isAuthenticated, logoutUser, getAuthStatus };
