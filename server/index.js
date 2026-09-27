import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import passport from "passport";
import { Strategy as GitHubStrategy } from "passport-github2";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { pool } from "./models/index.js";
import stripeLib from "stripe";
import crypto from "crypto";

// Controllers
import { isAuthenticated } from "./controllers/auth.js";
import { findUserByEmail, insertUser } from "./controllers/user.js";

// Routes
import { authRouter } from "./routes/auth.route.js";
import { userRouter } from "./routes/user.route.js";
import { productRouter } from "./routes/product.route.js";
import { cartRouter } from "./routes/cart.route.js";
import { orderRouter } from "./routes/order.route.js";
import { createCheckoutSession, getCheckoutStatus, handleStripeWebhook } from "./controllers/checkout.js";

// Express Config
dotenv.config();
const app = express();
app.disable("x-powered-by");
const PORT = process.env.PORT || 3000;
const stripe = process.env.STRIPE_SECRET ? stripeLib(process.env.STRIPE_SECRET) : null;
const FRONT_DOMAIN =
  process.env.FRONT_DOMAIN || "http://localhost:3001";
const FRONT_ORIGIN = new URL(FRONT_DOMAIN).origin;
const hasGitHubOAuth = Boolean(process.env.GITHUB_CLIENT && process.env.GITHUB_SECRET);
if (!process.env.SESSION_SECRET && process.env.NODE_ENV === "production") {
  throw new Error("SESSION_SECRET must be configured in production");
}
if (process.env.NODE_ENV === "production" && !process.env.DB_URL) {
  throw new Error("DB_URL must be configured in production");
}
if (process.env.NODE_ENV === "production" && !process.env.FRONT_DOMAIN) {
  throw new Error("FRONT_DOMAIN must be configured in production");
}
if (process.env.NODE_ENV === "production" && hasGitHubOAuth &&
    !process.env.GITHUB_CALLBACK_URL && !process.env.SERVER_URL) {
  throw new Error("Set GITHUB_CALLBACK_URL or SERVER_URL when GitHub OAuth is enabled");
}

// Dynamically set the origin based on the environment
const corsOptions = {
  origin: FRONT_ORIGIN,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.set("trust proxy", 1); // Trust first proxy

// API responses are dynamic and should not be cached. This restrictive policy
// also applies to Express-generated errors and not-found responses.
app.use((_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'none'; base-uri 'none'; object-src 'none'; frame-ancestors 'none'; form-action 'none'"
  );
  next();
});

// Apply CORS configuration
app.use(cors(corsOptions));

// For preflight requests
app.options("*", cors(corsOptions));

// Store sessions in PostgreSQL
const pgSession = connectPgSimple(session);

// Session configuration
app.use(
  session({
    store: new pgSession({
      pool, // Connect to PostgreSQL
      createTableIfMissing: true, // Automatically create the session table
    }),
    secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString("hex"),
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Use HTTPS in production
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());
app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), handleStripeWebhook(stripe));
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: true, limit: "100kb" }));

// GitHub Authentication 2.0 Strategy
// Config GitHubStrategy
if (hasGitHubOAuth) passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT,
      clientSecret: process.env.GITHUB_SECRET,
      callbackURL: process.env.GITHUB_CALLBACK_URL || `${new URL(process.env.SERVER_URL || "http://localhost:3000").origin}/auth/github/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user already exists
        const email = profile.emails?.find((entry) => entry.primary && entry.verified)?.value;
        if (!email) return done(new Error("GitHub did not provide a verified email"));
        let user = await findUserByEmail(email);

        if (!user) {
          // Insert new GitHub user without password and salt
          user = await insertUser(profile.displayName || profile.username, email);
        }
        done(null, user);
      } catch (error) {
        done(error);
      }
    }
  )
);

// Allow referrer info for HTTPS→HTTPS requests
app.use((req, res, next) => {
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  if (process.env.NODE_ENV === "production") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  next();
});

// Reject browser form/fetch requests from other origins on state-changing API routes.
app.use("/api", (req, res, next) => {
  if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
    const origin = req.get("origin");
    if (origin && origin !== FRONT_ORIGIN) {
      return res.status(403).json({ message: "Cross-origin request rejected" });
    }
  }
  next();
});

// testing user api + user authentication
app.get("/", (req, res) => {
  const authorization = req.isAuthenticated()
    ? "Authenticated"
    : "Not Authenticated";
  res.status(200).json({ authentication: `Hello, you are ${authorization}` });
});

// GitHub endpoints
app.get(
  "/auth/github",
  (req, res, next) => hasGitHubOAuth
    ? passport.authenticate("github", { scope: ["user:email"] })(req, res, next)
    : res.status(503).send("GitHub sign-in is not configured")
);

app.get(
  "/auth/github/callback",
  (req, res, next) => hasGitHubOAuth
    ? passport.authenticate("github", { failureRedirect: `${FRONT_DOMAIN}/login` })(req, res, next)
    : res.status(503).send("GitHub sign-in is not configured"),
  (req, res) => {
    // Successful authentication, redirect to frontend home page
    res.redirect(`${FRONT_DOMAIN}/?status=success`);
  }
);

// APIs endpoint
app.use("/api/auth", authRouter);
app.use("/api/users", isAuthenticated, userRouter);
app.use("/api/products", productRouter);
app.use("/api/cart", isAuthenticated, cartRouter);
app.use("/api/orders", isAuthenticated, orderRouter);
app.post("/api/cart/checkout", isAuthenticated, createCheckoutSession(stripe));
app.get("/api/cart/checkout-status/:session_id", isAuthenticated, getCheckoutStatus);

// Return API-style 404s so unmatched paths retain the security headers above.
app.use((req, res) => {
  res.status(404).json({ message: "Not found" });
});

// Error handling
app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }
  console.error(err.stack);
  res.status(500).send("Something went wrong. We're working on fixing it.");
});

// Listening to app
app.listen(PORT, () => {
  console.log(`Server is running: http://localhost:${PORT}`);
});
