const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const {
  addReview,
  getHospitalReviews,
  getAverageRating,
} = require("../controllers/reviewController");

// Review Routes
router.post("/", protect, addReview);
router.get("/:id", getHospitalReviews);

module.exports = router;
