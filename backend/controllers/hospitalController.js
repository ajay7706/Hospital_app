const mongoose = require("mongoose");
const Hospital = require("../models/Hospital");
const User = require("../models/Users");
const { sendHospitalApprovalEmail, sendHospitalPendingEmail, sendWhatsAppNotification } = require("../config/mailer");

// Add Hospital (Hospital Setup)
exports.addHospital = async (req, res) => {
  try {
    console.log("Received addHospital request. Body:", req.body); 
    console.log("Uploaded Files:", req.files); 

    const { specialties, services, fullAddress, location, workingDays, appointmentSlots, ...otherHospitalData } = req.body;

    const parsedAddress = typeof fullAddress === 'string' ? JSON.parse(fullAddress) : fullAddress;
    const parsedLocation = typeof location === 'string' ? JSON.parse(location) : location;
    const parsedServices = typeof services === 'string' ? JSON.parse(services) : services;
    const parsedWorkingDays = typeof workingDays === 'string' ? JSON.parse(workingDays) : workingDays;
    const parsedAppointmentSlots = typeof appointmentSlots === 'string' ? JSON.parse(appointmentSlots) : appointmentSlots;

    const hospitalData = { 
      ...otherHospitalData, 
      userId: req.user.id,
      specialties: Array.isArray(specialties) ? specialties : (specialties ? specialties.split(',').map(s => s.trim()) : []),
      services: parsedServices || [],
      fullAddress: parsedAddress,
      location: parsedLocation,
      workingDays: parsedWorkingDays || [],
      appointmentSlots: parsedAppointmentSlots || {},
      approvalStatus: "pending" 
    };

    if (req.files) {
      if (req.files.hospitalLogo) hospitalData.hospitalLogo = req.files.hospitalLogo[0].path;
      if (req.files.navbarIcon) hospitalData.navbarIcon = req.files.navbarIcon[0].path;
      if (req.files.licenseCertificate) hospitalData.licenseCertificate = req.files.licenseCertificate[0].path;
      if (req.files.ownerIdProof) hospitalData.ownerIdProof = req.files.ownerIdProof[0].path;
      if (req.files.gallery) hospitalData.gallery = req.files.gallery.map(file => file.path);
    }
    
    // Fallbacks if provided in body instead of files
    if (!hospitalData.hospitalLogo && req.body.hospitalLogo) hospitalData.hospitalLogo = req.body.hospitalLogo;
    if (!hospitalData.navbarIcon && req.body.navbarIcon) hospitalData.navbarIcon = req.body.navbarIcon;
    if (!hospitalData.licenseCertificate && req.body.licenseCertificate) hospitalData.licenseCertificate = req.body.licenseCertificate;
    if (!hospitalData.ownerIdProof && req.body.ownerIdProof) hospitalData.ownerIdProof = req.body.ownerIdProof;
    if (!hospitalData.gallery && req.body.gallery) hospitalData.gallery = req.body.gallery;

    if (!hospitalData.navbarIcon) hospitalData.navbarIcon = hospitalData.hospitalLogo;

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
    console.error("Add Hospital Error:", error); 
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};

// Get All Hospitals (For Patients - Only Approved and Not Deleted)
exports.getAllHospitals = async (req, res) => {
  try {
    const { search, city, specialty } = req.query;
    let query = { approvalStatus: "approved", isDeleted: false };

    // Advanced search logic
    if (search) {
      const searchRegex = new RegExp(search, "i");
      
      // Get all branches that match the search city/name to include their hospitals
      const matchingBranches = await mongoose.model('Branch').find({
        $or: [
          { branchName: searchRegex },
          { city: searchRegex },
          { address: searchRegex },
          { specialties: searchRegex }
        ]
      }).select('hospitalId');
      
      const branchHospitalIds = matchingBranches.map(b => b.hospitalId);

      query.$or = [
        { hospitalName: searchRegex },
        { city: searchRegex },
        { location: searchRegex },
        { specialties: { $in: [searchRegex] } },
        { _id: { $in: branchHospitalIds } }
      ];
    }

    if (city) {
      const cityRegex = new RegExp(city, "i");
      const branchesInCity = await mongoose.model('Branch').find({ city: cityRegex }).select('hospitalId');
      const hospitalIdsInCity = branchesInCity.map(b => b.hospitalId);
      
      query.$or = [
        { city: cityRegex },
        { _id: { $in: hospitalIdsInCity } }
      ];
    }

    if (specialty) {
      const specRegex = new RegExp(specialty, "i");
      const branchesWithSpec = await mongoose.model('Branch').find({ specialties: specRegex }).select('hospitalId');
      const hospitalIdsWithSpec = branchesWithSpec.map(b => b.hospitalId);

      query.$or = [
        ...(query.$or || []),
        { specialties: { $in: [specRegex] } },
        { _id: { $in: hospitalIdsWithSpec } }
      ];
    }

    const hospitals = await Hospital.find(query).lean();
    
    // Enrich with branch data for search filters
    const enrichedHospitals = await Promise.all(hospitals.map(async (h) => {
      const branches = await mongoose.model('Branch').find({ hospitalId: h._id }).select('city specialties');
      const branchCount = branches.length;
      const branchCities = branches.map(b => b.city);
      const branchSpecialties = branches.map(b => b.specialties && typeof b.specialties === 'string' ? b.specialties.split(',').map(s => s.trim()) : []).flat();
      
      return { ...h, branchCount, branchCities, branchSpecialties };
    }));

    res.json(enrichedHospitals);
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

// Get Hospital by User ID
exports.getHospitalByUserId = async (req, res) => {
  try {
    const hospital = await Hospital.findOne({ userId: req.user.id });
    if (!hospital) {
      return res.status(404).json({ msg: "Hospital not found" });
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
    console.log("Update Hospital Files:", req.files);

    const { specialties, services, fullAddress, location, workingDays, appointmentSlots, gallery, ...otherHospitalData } = req.body;

    let hospital = await Hospital.findOne({ userId: req.user.id });
    if (!hospital) {
      return res.status(404).json({ msg: "Hospital not found" });
    }

    const parsedAddress = fullAddress ? (typeof fullAddress === 'string' ? JSON.parse(fullAddress) : fullAddress) : hospital.fullAddress;
    const parsedLocation = location ? (typeof location === 'string' ? JSON.parse(location) : location) : hospital.location;
    const parsedServices = services ? (typeof services === 'string' ? JSON.parse(services) : services) : hospital.services;
    const parsedWorkingDays = workingDays ? (typeof workingDays === 'string' ? JSON.parse(workingDays) : workingDays) : hospital.workingDays;
    const parsedAppointmentSlots = appointmentSlots ? (typeof appointmentSlots === 'string' ? JSON.parse(appointmentSlots) : appointmentSlots) : hospital.appointmentSlots;

    const updateData = {
      ...otherHospitalData,
      specialties: specialties ? (Array.isArray(specialties) ? specialties : specialties.split(',').map(s => s.trim())) : hospital.specialties,
      services: parsedServices,
      fullAddress: parsedAddress,
      location: parsedLocation,
      workingDays: parsedWorkingDays,
      appointmentSlots: parsedAppointmentSlots,
    };

    if (req.files) {
      if (req.files.hospitalLogo) updateData.hospitalLogo = req.files.hospitalLogo[0].path;
      if (req.files.navbarIcon) updateData.navbarIcon = req.files.navbarIcon[0].path;
      if (req.files.licenseCertificate) updateData.licenseCertificate = req.files.licenseCertificate[0].path;
      if (req.files.ownerIdProof) updateData.ownerIdProof = req.files.ownerIdProof[0].path;
      if (req.files.gallery) {
        // Append new images to existing gallery, up to max 8
        const newImages = req.files.gallery.map(file => file.path);
        const currentGallery = Array.isArray(gallery) ? gallery : (typeof gallery === 'string' ? JSON.parse(gallery) : hospital.gallery);
        updateData.gallery = [...currentGallery, ...newImages].slice(0, 8);
      }
    } else if (gallery) {
       updateData.gallery = Array.isArray(gallery) ? gallery : JSON.parse(gallery);
    }

    if (!hospital.navbarIcon && updateData.hospitalLogo && !updateData.navbarIcon) {
      updateData.navbarIcon = updateData.hospitalLogo;
    }

    hospital = await Hospital.findByIdAndUpdate(hospital._id, updateData, { new: true });
    res.json({ msg: "Hospital profile updated", hospital });
  } catch (error) {
    console.error("Update Hospital Error:", error);
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};

// Delete Hospital (Soft Delete)
exports.deleteHospital = async (req, res) => {
  try {
    const hospital = await Hospital.findById(req.params.id);
    if (!hospital) {
      return res.status(404).json({ msg: "Hospital not found" });
    }

    // Check if active appointments exist
    const activeAppointments = await mongoose.model('Appointment').countDocuments({
      hospitalId: hospital._id,
      status: { $in: ["pending", "approved"] }
    });

    if (activeAppointments > 0) {
      return res.status(400).json({ msg: "Cannot delete hospital with active appointments" });
    }

    hospital.isDeleted = !hospital.isDeleted; // Toggle for soft delete/restore
    await hospital.save();

    res.json({ msg: hospital.isDeleted ? "Hospital soft-deleted" : "Hospital restored", hospital });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};

// Admin: User Management
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ role: { $ne: 'admin' } }).select('-password').lean();
    
    // Enrich with booking count
    const enrichedUsers = await Promise.all(users.map(async (user) => {
      const bookingsCount = await mongoose.model('Appointment').countDocuments({ patientId: user._id });
      return { ...user, bookingsCount };
    }));

    res.json(enrichedUsers);
  } catch (error) {
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};

exports.toggleBlockUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ msg: "User not found" });
    
    user.isBlocked = !user.isBlocked;
    await user.save();
    res.json({ msg: user.isBlocked ? "User blocked" : "User unblocked", user });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};

// Admin: Appointment Management
exports.getAllAppointments = async (req, res) => {
  try {
    const appointments = await mongoose.model('Appointment').find().sort({ createdAt: -1 });
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};

exports.cancelAppointmentOverride = async (req, res) => {
  try {
    const appointment = await mongoose.model('Appointment').findById(req.params.id);
    if (!appointment) return res.status(404).json({ msg: "Appointment not found" });
    
    appointment.status = "cancelled";
    await appointment.save();
    res.json({ msg: "Appointment cancelled by admin override", appointment });
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

// Admin: Review Management
exports.getAllReviews = async (req, res) => {
  try {
    const reviews = await mongoose.model('Review').find().populate('hospitalId', 'hospitalName');
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};

exports.deleteReview = async (req, res) => {
  try {
    await mongoose.model('Review').findByIdAndDelete(req.params.id);
    res.json({ msg: "Review deleted successfully" });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};

// Admin Dashboard Stats (Updated)
exports.getAdminStats = async (req, res) => {
  try {
    const totalHospitals = await Hospital.countDocuments({ isDeleted: false });
    const pendingHospitals = await Hospital.countDocuments({ approvalStatus: "pending", isDeleted: false });
    const totalUsers = await User.countDocuments({ role: { $ne: 'admin' } });
    const totalAppointments = await mongoose.model('Appointment').countDocuments();
    
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todayEmergencies = await mongoose.model('EmergencyLog').countDocuments({ createdAt: { $gte: todayStart, $lte: todayEnd } });

    // Analytics (Weekly Appointment Trends)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const appointmentTrends = await mongoose.model('Appointment').aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
      { $sort: { "_id": 1 } }
    ]);

    // Analytics (Weekly Emergency Trends)
    const emergencyTrends = await mongoose.model('EmergencyLog').aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
      { $sort: { "_id": 1 } }
    ]);

    // Recent Activity
    const recentHospitals = await Hospital.find({ isDeleted: false }).sort({ createdAt: -1 }).limit(5);
    const recentAppointments = await mongoose.model('Appointment').find().sort({ createdAt: -1 }).limit(5);
    const recentEmergencies = await mongoose.model('EmergencyLog').find().populate('hospitalId', 'hospitalName').sort({ createdAt: -1 }).limit(5);

    // Analytics: Top Hospitals by Bookings
    const topHospitals = await mongoose.model('Appointment').aggregate([
      { $group: { _id: "$hospitalName", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    // Analytics: Most Active Cities
    const activeCities = await Hospital.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: "$city", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    res.json({
      totalHospitals,
      pendingHospitals,
      totalUsers,
      totalAppointments,
      todayEmergencies,
      appointmentTrends,
      emergencyTrends,
      recentHospitals,
      recentAppointments,
      recentEmergencies,
      topHospitals,
      activeCities
    });
  } catch (error) {
    console.error("Admin Stats Error:", error);
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
