const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const {
  addReview,
  getReviews,
  getBranchReviews,
} = require("../controllers/reviewController");

// Review Routes
router.post("/", protect, addReview);
router.post("/add", protect, addReview); // Compatibility with some frontend calls
router.get("/:id", getReviews); // Generic route for both hospital and branch
router.get("/hospital/:id", getReviews);
router.get("/branch/:id", getBranchReviews);

module.exports = router;
