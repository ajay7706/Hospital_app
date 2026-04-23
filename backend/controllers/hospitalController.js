const mongoose = require("mongoose");
const Hospital = require("../models/Hospital");
const User = require("../models/Users");
const { sendHospitalApprovalEmail, sendHospitalPendingEmail, sendWhatsAppNotification } = require("../config/mailer");
const AdminSettings = require("../models/AdminSettings");
const Branch = require("../models/Branch");
const Doctor = require("../models/Doctor");
const Appointment = require("../models/Appointment");
const EmergencyLog = require("../models/EmergencyLog");

// Add Hospital (Hospital Setup)
exports.addHospital = async (req, res) => {
  try {
    console.log("Received addHospital request. Body:", req.body); 
    console.log("Uploaded Files:", req.files); 

    const { specialties, services, fullAddress, location, workingDays, ...otherHospitalData } = req.body;

    let parsedAddress = {};
    let parsedLocation = {};
    let parsedServices = [];
    let parsedWorkingDays = [];

    try { if (fullAddress) parsedAddress = typeof fullAddress === 'string' ? JSON.parse(fullAddress) : fullAddress; } catch (e) { console.error("Error parsing fullAddress:", e); }
    try { if (location) parsedLocation = typeof location === 'string' ? JSON.parse(location) : location; } catch (e) { console.error("Error parsing location:", e); }
    try { if (services) parsedServices = typeof services === 'string' ? JSON.parse(services) : services; } catch (e) { console.error("Error parsing services:", e); }
    try { if (workingDays) parsedWorkingDays = typeof workingDays === 'string' ? JSON.parse(workingDays) : workingDays; } catch (e) { console.error("Error parsing workingDays:", e); }

    const { govtSchemes, insurance, labDetails, medicalStore } = req.body;
    let parsedGovtSchemes = [];
    let parsedInsurance = { accepted: false, providers: [] };
    let parsedLabDetails = { enabled: false, labName: '', images: [] };
    let parsedMedicalStore = { enabled: false, images: [] };

    try { if (govtSchemes) parsedGovtSchemes = typeof govtSchemes === 'string' ? JSON.parse(govtSchemes) : govtSchemes; } catch (e) { console.error("Error parsing govtSchemes:", e); }
    try { if (insurance) parsedInsurance = typeof insurance === 'string' ? JSON.parse(insurance) : insurance; } catch (e) { console.error("Error parsing insurance:", e); }
    try { if (labDetails) parsedLabDetails = typeof labDetails === 'string' ? JSON.parse(labDetails) : labDetails; } catch (e) { console.error("Error parsing labDetails:", e); }
    try { if (medicalStore) parsedMedicalStore = typeof medicalStore === 'string' ? JSON.parse(medicalStore) : medicalStore; } catch (e) { console.error("Error parsing medicalStore:", e); }

    const hospitalData = { 
      ...otherHospitalData, 
      userId: req.user.id,
      specialties: Array.isArray(specialties) ? specialties : (specialties ? specialties.split(',').map(s => s.trim()) : []),
      services: parsedServices || [],
      fullAddress: parsedAddress,
      location: parsedLocation,
      workingDays: parsedWorkingDays || [],
      startTime: otherHospitalData.startTime || '09:00',
      endTime: otherHospitalData.endTime || '18:00',
      latitude: parseFloat(otherHospitalData.latitude || parsedLocation.lat || 0),
      longitude: parseFloat(otherHospitalData.longitude || parsedLocation.lng || 0),
      govtSchemes: parsedGovtSchemes,
      insurance: parsedInsurance,
      labDetails: parsedLabDetails,
      medicalStore: parsedMedicalStore,
      approvalStatus: "pending",
      isVerified: false
    };

    if (req.files) {
      if (req.files.hospitalLogo) hospitalData.hospitalLogo = req.files.hospitalLogo[0].path;
      if (req.files.navbarIcon) hospitalData.navbarIcon = req.files.navbarIcon[0].path;
      if (req.files.licenseCertificate) hospitalData.licenseCertificate = req.files.licenseCertificate[0].path;
      if (req.files.ownerIdProof) hospitalData.ownerIdProof = req.files.ownerIdProof[0].path;
      if (req.files.gstDocument) hospitalData.gstDocument = req.files.gstDocument[0].path;
      if (req.files.gallery) hospitalData.gallery = req.files.gallery.map(file => file.path);
      if (req.files.labImages) hospitalData.labDetails.images = req.files.labImages.map(file => file.path);
      if (req.files.medicalImages) hospitalData.medicalStore.images = req.files.medicalImages.map(file => file.path);
    }
    
    // Fallbacks if provided in body instead of files
    if (!hospitalData.hospitalLogo && req.body.hospitalLogo) hospitalData.hospitalLogo = req.body.hospitalLogo;
    if (!hospitalData.navbarIcon && req.body.navbarIcon) hospitalData.navbarIcon = req.body.navbarIcon;
    if (!hospitalData.licenseCertificate && req.body.licenseCertificate) hospitalData.licenseCertificate = req.body.licenseCertificate;
    if (!hospitalData.ownerIdProof && req.body.ownerIdProof) hospitalData.ownerIdProof = req.body.ownerIdProof;
    if (!hospitalData.gstDocument && req.body.gstDocument) hospitalData.gstDocument = req.body.gstDocument;
    if (!hospitalData.gallery && req.body.gallery) hospitalData.gallery = req.body.gallery;

    if (!hospitalData.navbarIcon) hospitalData.navbarIcon = hospitalData.hospitalLogo;

    const hospital = await Hospital.create(hospitalData);
    await User.findByIdAndUpdate(req.user.id, { hospitalAdded: true });
    
    // Send notifications safely (don't block the response)
    try {
      if (hospital.officialEmail) {
        console.log(`Attempting to send pending email to: ${hospital.officialEmail}`);
        await sendHospitalPendingEmail(hospital.officialEmail, hospital.hospitalName);
      }
      
      if (hospital.contactNumber) {
        const waMessage = `Hello ${hospital.hospitalName}, your registration is UNDER REVIEW. We will notify you once approved within 24 hours. Thank you!`;
        await sendWhatsAppNotification(hospital.contactNumber, waMessage);
      }
    } catch (notifError) {
      console.error("Notification Error (skipping):", notifError.message);
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
      // Clean search query (remove "near me", "in ", "at ")
      const cleanSearch = search.replace(/near me|in\s+|at\s+/gi, '').trim() || search;
      const searchRegex = new RegExp(cleanSearch, "i");
      
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
    if (req.user.role === 'admin') {
      return res.json({
        _id: "admin-system-id",
        hospitalName: "Apna Clinic System",
        name: "Apna Clinic System",
        city: "All Cities",
        userId: req.user.id,
        approvalStatus: "approved",
        specialties: ["All Specialties"],
        isDeleted: false
      });
    }
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

    // Log for debugging (USER can check logs if needed)
    console.log("Updating Hospital Profile. User ID:", req.user.id);

    let hospital = await Hospital.findOne({ userId: req.user.id });
    if (!hospital) {
      return res.status(404).json({ msg: "Hospital not found" });
    }

    const { 
      specialties, services, fullAddress, location, workingDays, gallery,
      govtSchemes, insurance, labDetails, medicalStore,
      existingLabImages, existingMedicalImages,
      ...unhandledData 
    } = req.body;

    // Build update object explicitly to avoid junk data
    const updateData = {};

    // 1. Basic Fields (Strings/Numbers)
    const basicFields = [
      'hospitalName', 'adminName', 'contactNumber', 'officialEmail', 'description', 
      'dailyCapacity', 'openingTime', 'closingTime', 'startTime', 'endTime', 
      'slotTime', 'emergency24x7', 'ambulanceAvailable', 'hospitalLicenseNumber',
      'emergencyContactNumber', 'branchCapacity', 'opdCharge', 'gstNumber',
      'latitude', 'longitude'
    ];
    basicFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    // 2. Parsed JSON Fields
    const safeParse = (data, fallback) => {
      if (!data) return fallback;
      if (typeof data !== 'string') return data;
      try {
        return JSON.parse(data);
      } catch (e) {
        console.error("JSON Parse Error:", e.message, "Data:", data);
        return fallback;
      }
    };

    if (specialties) {
      updateData.specialties = Array.isArray(specialties) ? specialties : specialties.split(',').map((s) => s.trim());
    }
    if (services) updateData.services = safeParse(services, hospital.services || []);
    if (fullAddress) updateData.fullAddress = safeParse(fullAddress, hospital.fullAddress || {});
    if (location) updateData.location = safeParse(location, hospital.location || {});
    if (workingDays) updateData.workingDays = safeParse(workingDays, hospital.workingDays || []);
    if (govtSchemes) updateData.govtSchemes = safeParse(govtSchemes, hospital.govtSchemes || []);
    if (insurance) updateData.insurance = safeParse(insurance, hospital.insurance || { accepted: false, providers: [] });

    // Lab and Medical Store
    let lab = safeParse(labDetails, null);
    if (!lab && hospital.labDetails) {
      try {
        lab = JSON.parse(JSON.stringify(hospital.labDetails));
      } catch (e) { lab = null; }
    }
    updateData.labDetails = lab || { enabled: false, labName: '', images: [] };

    let medical = safeParse(medicalStore, null);
    if (!medical && hospital.medicalStore) {
      try {
        medical = JSON.parse(JSON.stringify(hospital.medicalStore));
      } catch (e) { medical = null; }
    }
    updateData.medicalStore = medical || { enabled: false, images: [] };

    // 3. File Uploads
    if (req.files) {
      if (req.files.hospitalLogo) updateData.hospitalLogo = req.files.hospitalLogo[0].path;
      if (req.files.navbarIcon) updateData.navbarIcon = req.files.navbarIcon[0].path;
      if (req.files.licenseCertificate) updateData.licenseCertificate = req.files.licenseCertificate[0].path;
      if (req.files.ownerIdProof) updateData.ownerIdProof = req.files.ownerIdProof[0].path;
      if (req.files.gstDocument) updateData.gstDocument = req.files.gstDocument[0].path;
      
      if (req.files.gallery) {
        const newImages = req.files.gallery.map((file) => file.path);
        const currentGallery = safeParse(gallery, hospital.gallery || []);
        updateData.gallery = [...currentGallery, ...newImages].slice(0, 8);
      }
      
      if (req.files.labImages) {
        const newImages = req.files.labImages.map((file) => file.path);
        const currentImages = safeParse(existingLabImages, updateData.labDetails?.images || []);
        updateData.labDetails = { ...updateData.labDetails, images: [...currentImages, ...newImages] };
      }
      
      if (req.files.medicalImages) {
        const newImages = req.files.medicalImages.map((file) => file.path);
        const currentImages = safeParse(existingMedicalImages, updateData.medicalStore?.images || []);
        updateData.medicalStore = { ...updateData.medicalStore, images: [...currentImages, ...newImages] };
      }
    } else {
      if (gallery) updateData.gallery = safeParse(gallery, hospital.gallery);
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
    const totalAppointments = await Appointment.countDocuments();
    
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todayEmergencies = await EmergencyLog.countDocuments({ createdAt: { $gte: todayStart, $lte: todayEnd } });

    // Analytics (Weekly Appointment Trends)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const appointmentTrends = await Appointment.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
      { $sort: { "_id": 1 } }
    ]);

    // Analytics (Weekly Emergency Trends)
    const emergencyTrends = await EmergencyLog.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
      { $sort: { "_id": 1 } }
    ]);

    // Recent Activity
    const recentHospitals = await Hospital.find({ isDeleted: false }).sort({ createdAt: -1 }).limit(5);
    const recentAppointments = await Appointment.find().sort({ createdAt: -1 }).limit(5);
    const recentEmergencies = await EmergencyLog.find().populate('hospitalId', 'hospitalName').sort({ createdAt: -1 }).limit(5);

    // Analytics: Top Hospitals by Bookings
    const topHospitals = await Appointment.aggregate([
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

    const totalBranches = await Branch.countDocuments();
    const totalDoctors = await Doctor.countDocuments();
    const totalStaff = await User.countDocuments({ role: "branch" });

    // Newly added hospitals
    const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const hospitalsAddedToday = await Hospital.countDocuments({ createdAt: { $gte: todayStart }, isDeleted: false });
    const hospitalsAddedThisWeek = await Hospital.countDocuments({ createdAt: { $gte: weekStart }, isDeleted: false });

    // Detailed Analytics: Platform Insights
    const platformInsights = {
      hospitals: {
        total: totalHospitals,
        today: hospitalsAddedToday,
        thisWeek: hospitalsAddedThisWeek,
        all: await Hospital.find({ isDeleted: false }).select('hospitalName createdAt city').sort({ createdAt: -1 })
      },
      branches: {
        total: totalBranches,
        perHospital: await Branch.aggregate([
          { $group: { _id: "$hospitalId", count: { $sum: 1 } } }
        ])
      },
      doctors: {
        total: totalDoctors,
        perHospital: await Doctor.aggregate([
          { $group: { _id: "$hospitalId", count: { $sum: 1 } } }
        ]),
        perBranch: await Doctor.aggregate([
          { $group: { _id: "$branchId", count: { $sum: 1 } } }
        ])
      },
      staff: {
        total: totalStaff,
        perHospital: await User.aggregate([
          { $match: { role: "branch" } },
          { $group: { _id: "$hospitalId", count: { $sum: 1 } } }
        ]),
        perBranch: await User.aggregate([
          { $match: { role: "branch" } },
          { $group: { _id: "$branchId", count: { $sum: 1 } } }
        ])
      },
      appointments: {
        total: totalAppointments,
        today: await Appointment.countDocuments({ createdAt: { $gte: todayStart } }),
        pending: await Appointment.countDocuments({ status: "Waiting" }),
        completed: await Appointment.countDocuments({ status: "Completed" })
      }
    };

    res.json({
      totalHospitals,
      pendingHospitals,
      totalUsers,
      totalAppointments,
      todayEmergencies,
      totalBranches,
      totalDoctors,
      totalStaff,
      appointmentTrends,
      emergencyTrends,
      recentHospitals,
      recentAppointments,
      recentEmergencies,
      topHospitals,
      activeCities,
      platformInsights
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

// Admin Settings Controllers
exports.getAdminSettings = async (req, res) => {
  try {
    let settings = await AdminSettings.findOne();
    if (!settings) {
      settings = await AdminSettings.create({});
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};

exports.updateAdminSettings = async (req, res) => {
  try {
    let settings = await AdminSettings.findOneAndUpdate(
      {},
      { $set: { ...req.body, updatedAt: Date.now() } },
      { new: true, upsert: true, runValidators: true }
    );
    res.json({ msg: "Settings updated successfully", settings });
  } catch (error) {
    console.error("Update Admin Settings Error:", error);
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};

exports.getHospitalBranchesDetail = async (req, res) => {
  try {
    const hospitalId = req.params.id;
    const branches = await Branch.find({ hospitalId });
    
    const detailedBranches = await Promise.all(branches.map(async (b) => {
      const doctorsCount = await Doctor.countDocuments({ branchId: b._id });
      const staffCount = await User.countDocuments({ branchId: b._id, role: "branch" });
      return {
        ...b.toObject(),
        doctorsCount,
        staffCount
      };
    }));

    res.json(detailedBranches);
  } catch (error) {
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};

