import express from "express";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { body, validationResult } from "express-validator";
import { verifyPassword } from "../utils/hash.js";
import { inputValidation } from "../utils/validateInput.js";
import { findUserByEmail, findUserById } from "../controllers/user.js";
import {
  loginUser,
  logoutUser,
  registerUser,
  getAuthStatus,
} from "../controllers/auth.js";

export const authRouter = express.Router();

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await findUserById(id);
    return done(null, user);
  } catch (err) {
    console.error("Deserialization Error:", err);
    done(err);
  }
});

// Config LocalStrategy
passport.use(
  new LocalStrategy(
    { usernameField: "email" },
    async (email, password, done) => {
      try {
        const user = await findUserByEmail(email);
        if (!user || !user.hash_password || !user.salt)
          return done(null, false, { message: "Incorrect email or password." });

        const match = await verifyPassword(
          password,
          user.hash_password,
          user.salt
        );
        if (!match)
          return done(null, false, { message: "Incorrect email or password." });

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

authRouter.post("/register", inputValidation, registerUser);
authRouter.post("/login", [
  body("email").isEmail().withMessage("Enter a valid email address."),
  body("password").isString().isLength({ min: 1, max: 1024 }).withMessage("Password is required."),
], (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: "Invalid login input" });
  return loginUser(req, res, next);
});
authRouter.post("/logout", logoutUser);
authRouter.get("/status", getAuthStatus);
