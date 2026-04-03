const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const {
  addReview,
  getHospitalReviews,
  getAverageRating,
} = require("../controllers/reviewController");

// Review Routes
router.post("/add", protect, addReview);
router.get("/:id", getHospitalReviews);
router.get("/average/:id", getAverageRating);

module.exports = router;
