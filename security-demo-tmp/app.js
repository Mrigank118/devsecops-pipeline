const express = require("express");

const app = express();

app.get("/demo", (req, res) => {
    const input = req.query.input;
    eval(input);
    res.send("demo");
});

module.exports = app;
