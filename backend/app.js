const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const { initCronJobs } = require('./services/cronService');

const app = express();
connectDB();
initCronJobs();

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:8080",
  "https://clinoza.in",
  "https://www.clinoza.in",
  "https://hospital-app-rouge.vercel.app"
];

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps or curl requests or Postman)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list OR is a vercel preview/subdomain
    const isAllowed = allowedOrigins.indexOf(origin) !== -1 || 
                     origin.endsWith(".vercel.app") || 
                     origin.includes("localhost");

    if (isAllowed) {
      return callback(null, true);
    } else {
      console.log("Blocked by CORS:", origin);
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

// routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/hospitals", require("./routes/hospitalRoutes"));
app.use("/api/appointments", require("./routes/appointmentRoutes"));
app.use("/api/reviews", require("./routes/reviewRoutes"));
app.use("/api/upload", require("./routes/uploadRoutes"));
app.use("/api/doctors", require("./routes/doctorRoutes"));
app.use("/api/branches", require("./routes/branchRoutes"));
app.use("/api/otp", require("./routes/otpRoutes"));
// 404 handler
app.use((req, res) => {
  res.status(404).json({ msg: `Route ${req.originalUrl} not found` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Error Handler:", err.message);

  // Multer Error Handling
  if (err.message.includes("Invalid file type") || err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      msg: err.message,
      success: false
    });
  }

  res.status(err.status || 500).json({
    msg: "Internal Server Error",
    error: err.message
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}...`);
});