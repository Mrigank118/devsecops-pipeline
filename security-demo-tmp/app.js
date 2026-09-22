// ============================================================
// INTENTIONAL SAST SECURITY TEST
// ============================================================
//
// Demonstrates execution of user-controlled input.
//
// This code is intentionally insecure and exists only for
// security-tool demonstration purposes.
//
// ============================================================

const express = require("express");

const app = express();

app.get("/demo", (req, res) => {

    const userInput = req.query.input;

    // INTENTIONAL VULNERABILITY:
    // User-controlled data is passed directly to eval().
    eval(userInput);

    res.send("Security demonstration");
});

module.exports = app;
