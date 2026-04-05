const Hospital = require("../models/Hospital");
const User = require("../models/Users");
const { sendHospitalApprovalEmail, sendHospitalPendingEmail, sendWhatsAppNotification } = require("../config/mailer");

// Add Hospital (Hospital Setup)
exports.addHospital = async (req, res) => {
  try {
    console.log("Received addHospital request. Body:", req.body); 
    console.log("Uploaded File:", req.file); // Log the uploaded file for debugging

    const { specialties, services, ...otherHospitalData } = req.body;

    const hospitalData = { 
      ...otherHospitalData, 
      userId: req.user.id,
      hospitalLogo: req.file ? req.file.path : null, // Save Cloudinary URL
      specialties: Array.isArray(specialties) ? specialties : (specialties ? specialties.split(',').map(s => s.trim()) : []),
      services: services || [],
      approvalStatus: "pending" 
    };
    
    const hospital = await Hospital.create(hospitalData);
    await User.findByIdAndUpdate(req.user.id, { hospitalAdded: true });
    
    // Send email to hospital owner that registration is pending
    if (hospital.officialEmail) {
      console.log(`Attempting to send pending email to: ${hospital.officialEmail}`);
      await sendHospitalPendingEmail(hospital.officialEmail, hospital.hospitalName);
    } else {
      console.log("No official email found for hospital, skipping pending email.");
    }

    // Send WhatsApp notification for pending status
    if (hospital.contactNumber) {
      const waMessage = `Hello ${hospital.hospitalName}, your registration is UNDER REVIEW. We will notify you once approved within 24 hours. Thank you!`;
      await sendWhatsAppNotification(hospital.contactNumber, waMessage);
    }

    res.status(201).json({ 
      msg: "Your hospital is under review. It will be approved within 24 hours.", 
      hospital 
    });
  } catch (error) {
    console.error("Add Hospital Error:", error); // More detailed error logging
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};

// Get All Hospitals (For Patients - Only Approved)
exports.getAllHospitals = async (req, res) => {
  try {
    const { search, city, specialty } = req.query;
    let query = { approvalStatus: "approved" }; // Only show approved hospitals

    if (search) {
      query.hospitalName = { $regex: search, $options: "i" };
    }
    if (city) {
      query.city = city;
    }
    if (specialty) {
      query.specialties = { $in: [specialty] };
    }

    const hospitals = await Hospital.find(query);
    res.json(hospitals);
  } catch (error) {
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};

// Get Hospital by ID
exports.getHospitalById = async (req, res) => {
  try {
    const hospital = await Hospital.findById(req.params.id);
    if (!hospital) {
      return res.status(404).json({ msg: "Hospital not found" });
    }
    
    // If not approved and user is not admin, don't show it
    if (hospital.approvalStatus !== "approved") {
      // Allow the hospital owner to see their own hospital even if pending
      if (req.user && (req.user.role === "admin" || req.user.id === hospital.userId.toString())) {
        return res.json(hospital);
      }
      return res.status(403).json({ msg: "This hospital is not yet approved." });
    }

    res.json(hospital);
  } catch (error) {
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};

// Update Hospital Profile
exports.updateHospitalProfile = async (req, res) => {
  try {
    console.log("Update Hospital Body:", req.body);
    console.log("Update Hospital File:", req.file);

    const { specialties, services, ...otherHospitalData } = req.body;

    let hospital = await Hospital.findOne({ userId: req.user.id });
    if (!hospital) {
      return res.status(404).json({ msg: "Hospital not found" });
    }

    const updateData = {
      ...otherHospitalData,
      specialties: Array.isArray(specialties) ? specialties : (specialties ? specialties.split(',').map(s => s.trim()) : []),
      services: services || [],
    };

    // Update logo only if a new file is uploaded
    if (req.file) {
      updateData.hospitalLogo = req.file.path;
    }

    hospital = await Hospital.findByIdAndUpdate(hospital._id, updateData, { new: true });
    res.json({ msg: "Hospital profile updated", hospital });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};

// Delete Hospital
exports.deleteHospital = async (req, res) => {
  try {
    const hospital = await Hospital.findById(req.params.id);
    if (!hospital) {
      return res.status(404).json({ msg: "Hospital not found" });
    }
    await hospital.remove();
    res.json({ msg: "Hospital removed" });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};

// Admin: Get All Hospitals (Pending + Approved + Rejected)
exports.getAdminAllHospitals = async (req, res) => {
  try {
    const hospitals = await Hospital.find();
    res.json(hospitals);
  } catch (error) {
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};

// Admin: Get Only Pending Hospitals
exports.getPendingHospitals = async (req, res) => {
  try {
    const hospitals = await Hospital.find({ approvalStatus: "pending" });
    res.json(hospitals);
  } catch (error) {
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};

// Admin: Approve Hospital
exports.approveHospital = async (req, res) => {
  try {
    console.log(`Attempting to approve hospital ID: ${req.params.id}`);
    const hospital = await Hospital.findByIdAndUpdate(
      req.params.id,
      { approvalStatus: "approved" },
      { new: true }
    );
    if (!hospital) {
      console.log(`Hospital with ID ${req.params.id} not found.`);
      return res.status(404).json({ msg: "Hospital not found" });
    }

    // Send email notification to hospital owner
    if (hospital.officialEmail) {
      console.log(`Sending approval email to: ${hospital.officialEmail}`);
      await sendHospitalApprovalEmail(hospital.officialEmail, hospital.hospitalName, "approved");
    } else {
      console.log("No official email for hospital, skipping approval email.");
    }

    // Send WhatsApp notification for approval
    if (hospital.contactNumber) {
      const waMessage = `Congratulations! Your hospital "${hospital.hospitalName}" has been APPROVED. You can now manage your dashboard.`;
      await sendWhatsAppNotification(hospital.contactNumber, waMessage);
    }

    res.json({ msg: "Your hospital has been approved successfully.", hospital });
  } catch (error) {
    console.error("Approve Hospital Error:", error);
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};

// Admin: Reject Hospital
exports.rejectHospital = async (req, res) => {
  try {
    console.log(`Attempting to reject hospital ID: ${req.params.id}`);
    const hospital = await Hospital.findByIdAndUpdate(
      req.params.id,
      { approvalStatus: "rejected" },
      { new: true }
    );
    if (!hospital) {
      console.log(`Hospital with ID ${req.params.id} not found.`);
      return res.status(404).json({ msg: "Hospital not found" });
    }

    // Send email notification to hospital owner
    if (hospital.officialEmail) {
      console.log(`Sending rejection email to: ${hospital.officialEmail}`);
      await sendHospitalApprovalEmail(hospital.officialEmail, hospital.hospitalName, "rejected");
    } else {
      console.log("No official email for hospital, skipping rejection email.");
    }

    // Send WhatsApp notification for rejection
    if (hospital.contactNumber) {
      const waMessage = `Hello ${hospital.hospitalName}, your registration status has been updated to REJECTED. Please contact support for more details.`;
      await sendWhatsAppNotification(hospital.contactNumber, waMessage);
    }

    res.json({ msg: "Hospital has been rejected.", hospital });
  } catch (error) {
    console.error("Reject Hospital Error:", error);
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};
