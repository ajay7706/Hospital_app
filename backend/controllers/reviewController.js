const Review = require("../models/Review");
const Appointment = require("../models/Appointment");

// Add Review
exports.addReview = async (req, res) => {
  try {
    const { hospitalId, rating, comment } = req.body;

    const appointment = await Appointment.findOne({
      patientId: req.user.id,
      hospitalId,
      status: "completed",
    });

    if (!appointment) {
      return res.status(403).json({ msg: "You can only review after a completed appointment" });
    }

    // Constraint: 1 rating per patient
    const existingRating = await Review.findOne({ patientId: req.user.id, hospitalId, rating: { $exists: true } });
    if (existingRating && rating) {
      return res.status(400).json({ msg: "You have already rated this hospital" });
    }

    // Constraint: Max 2 reviews per patient
    const reviewCount = await Review.countDocuments({ patientId: req.user.id, hospitalId });
    if (reviewCount >= 2) {
      return res.status(400).json({ msg: "You can write a maximum of 2 reviews for a hospital" });
    }

    const review = await Review.create({
      patientId: req.user.id,
      hospitalId,
      rating,
      comment,
    });

    res.status(201).json({ msg: "Review added successfully", review });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};

// Get All Reviews for a Hospital
exports.getHospitalReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ hospitalId: req.params.id });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};

// Get Average Rating for a Hospital
exports.getAverageRating = async (req, res) => {
  try {
    const reviews = await Review.find({ hospitalId: req.params.id });
    if (reviews.length === 0) {
      return res.json({ averageRating: 0 });
    }

    const totalRating = reviews.reduce((acc, review) => acc + review.rating, 0);
    const averageRating = totalRating / reviews.length;

    res.json({ averageRating });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};
