const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const { clerkMiddleware } = require("@clerk/express");
dotenv.config();

const chatRoutes = require("./routes/chatRoutes");
const connectDB = require("./config/db");

// Connect to MongoDB
connectDB();

const app = express();

app.use(cors());
app.use(express.json());


app.use((req, res, next) => {
  console.log(
    "AUTHORIZATION HEADER:",
    req.headers.authorization
      ? "Bearer token received"
      : "NO AUTHORIZATION HEADER"
  );
  
  next();
});

app.use(clerkMiddleware());

app.use((req, res, next) => {
  console.log("========== CLERK DEBUG ==========");
  console.log("Authorization Header:", req.headers.authorization ? "PRESENT" : "MISSING");
  console.log("User ID:", req.auth?.userId || "NOT AUTHENTICATED");
  next();
});


app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Voice Chatbot Server is running",
  });
});

app.use("/api/chat", chatRoutes);

app.use((err, req, res, next) => {
  if (err.message === 'Unauthenticated' || err.status === 401) {
    return res.status(401).json({ success: false, message: 'Unauthenticated' });
  }
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal Server Error' });
});
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});