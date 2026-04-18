const Review = require("../models/Review");
const Appointment = require("../models/Appointment");

// Add Review
exports.addReview = async (req, res) => {
  try {
    const { hospitalId, rating, comment, patientName } = req.body;

    // Rule: Only patients with COMPLETED appointment can review
    const appointment = await Appointment.findOne({
      patientId: req.user.id,
      hospitalId,
      status: { $regex: /^completed$/i }
    });

    if (!appointment) {
      return res.status(403).json({ msg: "You can only review after a completed appointment" });
    }

    // Rule: Only ONE review per hospital per patient
    const existingReview = await Review.findOne({ patientId: req.user.id, hospitalId });
    if (existingReview) {
      return res.status(400).json({ msg: "You have already reviewed this hospital" });
    }

    const review = await Review.create({
      patientId: req.user.id,
      hospitalId,
      rating,
      comment,
      patientName: patientName || req.user.name || "Anonymous"
    });

    res.status(201).json({ msg: "Review added successfully", review });
  } catch (error) {
    console.error("Add Review Error:", error);
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};

// Get All Reviews for a Hospital (with stats)
exports.getHospitalReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ hospitalId: req.params.id }).sort({ createdAt: -1 });
    
    if (reviews.length === 0) {
      return res.json({ reviews: [], averageRating: 0, totalReviews: 0 });
    }

    const totalRating = reviews.reduce((acc, r) => acc + (r.rating || 0), 0);
    const averageRating = (totalRating / reviews.length).toFixed(1);

    res.json({ 
      reviews, 
      averageRating: parseFloat(averageRating), 
      totalReviews: reviews.length 
    });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};
