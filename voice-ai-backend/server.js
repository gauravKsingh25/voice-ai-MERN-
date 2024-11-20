require("dotenv").config();
const express = require("express");
const cors = require("cors");
const aiRoutes = require("./routes/ai");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware setup
app.use(cors());
app.use(express.json());

// Routes for AI-related requests
app.use("/api/ai", aiRoutes);

// Health check route
app.get("/", (req, res) => {
  res.send("Server is running and healthy.");
});

// Error handling for unhandled requests
app.use((err, req, res, next) => {
  console.error("Oops, something went wrong:", err);
  res
    .status(500)
    .json({ error: "Internal server error", details: err.message });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
