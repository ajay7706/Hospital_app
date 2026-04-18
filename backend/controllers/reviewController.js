const Review = require("../models/Review");
const Appointment = require("../models/Appointment");

// Add Review
exports.addReview = async (req, res) => {
  try {
    const { appointmentId, rating, reviewText, patientName } = req.body;

    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({ msg: "Appointment not found" });
    }

    if (appointment.patientId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ msg: "Not authorized" });
    }

    if (appointment.status.toLowerCase() !== "completed") {
      return res.status(400).json({ msg: "Can only rate completed appointments" });
    }

    if (appointment.isRated) {
      return res.status(400).json({ msg: "You have already rated this appointment" });
    }

    const review = await Review.create({
      appointmentId,
      patientId: req.user.id,
      hospitalId: appointment.hospitalId,
      branchId: appointment.branchId,
      rating,
      reviewText,
      patientName: patientName || req.user.name || "Anonymous"
    });

    appointment.isRated = true;
    await appointment.save();

    res.status(201).json({ msg: "Review added successfully", review });
  } catch (error) {
    console.error("Add Review Error:", error);
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};

// Get All Reviews for a Hospital (with stats)
exports.getHospitalReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ hospitalId: req.params.id }).populate('appointmentId').sort({ createdAt: -1 });
    
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
