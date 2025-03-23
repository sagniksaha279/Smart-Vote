const express = require("express");
const serverless = require("serverless-http");

const app = express();

// Middleware
app.use(express.json());

// Example route
app.get("/test", (req, res) => {
  res.json({ message: "Hello from Netlify Functions!" });
});

// Export as a Netlify Function
module.exports.handler = serverless(app);
