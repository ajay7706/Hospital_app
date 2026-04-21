const Appointment = require("../models/Appointment");
const Hospital = require("../models/Hospital");
const User = require("../models/Users");
const { sendAppointmentEmail, sendWhatsAppNotification } = require("../config/mailer");
const Branch = require("../models/Branch");
const TokenTracker = require("../models/TokenTracker");
const Doctor = require("../models/Doctor");
const mongoose = require("mongoose");


// Book Appointment
exports.bookAppointment = async (req, res) => {
  try {
    const { hospitalId, branchId, date, time, patientName, patientEmail, location, hospitalName, phone, ambulanceRequired, problem, type } = req.body;
    
    // 1. Check for basic requirements
    const hospital = await Hospital.findById(hospitalId);
    if (!hospital) return res.status(404).json({ msg: "Hospital not found" });
    if (hospital.approvalStatus !== "approved") {
      return res.status(403).json({ msg: "Hospital is not approved yet." });
    }

    // 2. USER RESTRICTION: Allow booking again if already approved, or at different hospitals/dates
    const activeBooking = await Appointment.findOne({
      patientId: req.user.id,
      hospitalId,
      date,
      status: { $in: ["Waiting", "pending", "Rescheduled"] }
    });
    if (activeBooking) {
      return res.status(400).json({ msg: "You already have an active appointment at this hospital on this date." });
    }

    let maxQueue = 0;
    let dailyApprovalLimit = 200;
    if (branchId) {
      const branch = await Branch.findById(branchId);
      if (!branch) return res.status(404).json({ msg: "Branch not found" });
      maxQueue = 300; // Force 300 bookings limit per requirement
    } else {
      maxQueue = 300; // Force 300 bookings limit per requirement
    }

    const slotOccupancy = await Appointment.countDocuments({
      hospitalId,
      branchId: branchId || null,
      date,
      time
    });

    if (type !== "Emergency") {
      if (slotOccupancy >= 30) {
        return res.status(400).json({ msg: "This time slot is FULL. Please select another time." });
      }
      if (bookingCount >= maxQueue) {
        return res.status(400).json({ msg: branchId ? "Daily limit full for this branch." : "Daily limit full for hospital." });
      }
    }

    // 4. Calculate OPD Charge
    let finalOpdCharge = hospital.opdCharge || 0;
    if (branchId) {
      const branch = await Branch.findById(branchId);
      if (branch && branch.opdChargeType === "custom") {
        finalOpdCharge = branch.opdCharge;
      }
    }

    // 5. Create Appointment with Token
    const appointment = await Appointment.create({
      hospitalId,
      branchId: branchId || null,
      patientId: req.user.id,
      date: type === "Emergency" ? new Date().toISOString().split('T')[0] : date,
      time: type === "Emergency" ? new Date().toLocaleTimeString() : time,
      patientName,
      patientEmail,
      phone,
      hospitalName,
      location,
      problem: problem || "",
      status: "Waiting",
      type: type || "Normal",
      tokenNumber: type === "Emergency" ? 0 : bookingCount + 1,
      ambulanceRequired: ambulanceRequired || false,
      opdCharge: finalOpdCharge
    });


    // 5. Notifications
    try {
      const branch = branchId ? await Branch.findById(branchId) : null;
      // Fetch Queue Stats
      const tracker = await TokenTracker.findOne({ 
        hospitalId: appointment.hospitalId, 
        branchId: appointment.branchId || null, 
        date: appointment.date 
      });
      const nowServing = tracker ? tracker.currentToken : 1;
      const peopleAhead = Math.max(0, appointment.tokenNumber - nowServing);

      const notificationDetails = {
        ...appointment.toObject(),
        supportEmail: hospital.officialEmail,
        supportPhone: branch ? branch.phone : hospital.contactNumber,
        branchDetails: branch,
        nowServing,
        peopleAhead
      };
      
      const msg = `Hello ${patientName}, your appointment at ${hospitalName} is booked. Your Token: ${appointment.tokenNumber}. Status: WAITING.`;
      
      await sendAppointmentEmail(patientEmail, notificationDetails, false);
      if (phone) await sendWhatsAppNotification(phone, msg);
    } catch (err) { console.error("Notification Error:", err); }

    res.status(201).json({ msg: "Appointment booked successfully", appointment });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};

// Update Appointment Status (With Permission Checks)
exports.updateAppointmentStatus = async (req, res) => {
  try {
    const { status, nextDate } = req.body;
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ msg: "Appointment not found" });

    // PERMISSION CHECK
    if (req.user.role === "hospital") {
      if (appointment.branchId) return res.status(403).json({ msg: "Main hospital can only view branch appointments." });
    } else if (req.user.role === "branch") {
      if (!appointment.branchId || appointment.branchId.toString() !== req.user.branchId?.toString()) {
        return res.status(403).json({ msg: "Access denied to this branch data." });
      }
    } else if (req.user.role === "doctor") {
      // Doctor can only move to consultation, lab, or complete
      const allowedDoctorStatuses = ["In Consultation", "Lab Pending", "Completed"];
      if (!allowedDoctorStatuses.includes(status)) {
        return res.status(403).json({ msg: "Doctors can only change status to In Consultation, Lab Pending, or Completed." });
      }
      
      const doctorProfile = await Doctor.findOne({ userId: req.user.id });
      if (!doctorProfile || doctorProfile.hospitalId.toString() !== appointment.hospitalId.toString()) {
        return res.status(403).json({ msg: "Access denied. This appointment belongs to another hospital." });
      }
    }

    // SMART LOGIC: Confirmed (with capacity check)
    if (status === "Confirmed") {
        const hospital = await Hospital.findById(appointment.hospitalId);
        let maxApprovalQueue = 200;

        const approvedCount = await Appointment.countDocuments({
            hospitalId: appointment.hospitalId,
            branchId: appointment.branchId || null,
            date: appointment.date,
            status: "Confirmed"
        });

        if (approvedCount >= maxApprovalQueue) {
            return res.status(400).json({ msg: "Daily approval limit reached for this date (Limit: 200)." });
        }
        appointment.status = "Confirmed";
        
        // Handle Doctor Assignment if provided
        if (req.body.doctorId) {
          const doctor = await Doctor.findById(req.body.doctorId);
          if (doctor) {
            appointment.assignedDoctorId = doctor._id;
            appointment.assignedDoctorName = doctor.name;
          }
        }
    } 
    // SMART LOGIC: Move to Next Day (Rescheduled)
    else if (status === "Rescheduled") {
      const targetDate = nextDate || new Date(new Date(appointment.date).getTime() + 86400000).toISOString().split('T')[0];
      
      // Check target day capacity
      let maxQueue = 300;

      const nextDayCount = await Appointment.countDocuments({
        hospitalId: appointment.hospitalId,
        branchId: appointment.branchId || null,
        date: targetDate
      });

      if (nextDayCount >= maxQueue) {
        return res.status(400).json({ msg: "Next day is full." });
      }

      appointment.date = targetDate;
      appointment.status = "Rescheduled";
      appointment.tokenNumber = nextDayCount + 1;
    } 
    else if (status === "Not Selected") {
        appointment.status = "Not Selected";
    }
    else {
      appointment.status = status;
    }

    // Handle Token Progression
    if (status === "Completed") {
      await TokenTracker.findOneAndUpdate(
        { 
          hospitalId: appointment.hospitalId, 
          branchId: appointment.branchId || null, 
          date: appointment.date 
        },
        { $inc: { currentToken: 1 } },
        { upsert: true, new: true }
      );
    }

    await appointment.save();


    // Trigger PDF & WhatsApp on Confirm/Reschedule/Complete
    if (["Confirmed", "Rescheduled", "Completed"].includes(appointment.status)) {
      const hospital = await Hospital.findById(appointment.hospitalId);
      const branch = appointment.branchId ? await Branch.findById(appointment.branchId) : null;
      
      // Fetch Queue Stats
      const tracker = await TokenTracker.findOne({ 
        hospitalId: appointment.hospitalId, 
        branchId: appointment.branchId || null, 
        date: appointment.date 
      });
      const nowServing = tracker ? tracker.currentToken : 1;
      const peopleAhead = Math.max(0, appointment.tokenNumber - nowServing);

      const notificationDetails = {
        ...appointment.toObject(),
        supportEmail: hospital?.officialEmail,
        supportPhone: branch ? branch.phone : hospital?.contactNumber,
        branchDetails: branch,
        nowServing,
        peopleAhead
      };

      const branchName = branch ? `(${branch.branchName} Branch)` : '';
      let updateMsg = `Appointment at ${appointment.hospitalName} ${branchName} is ${appointment.status.toUpperCase()}. Date: ${appointment.date}, Token: ${appointment.tokenNumber}.`;

      if (appointment.status === "Rescheduled") {
        notificationDetails.msg = `Your appointment has been rescheduled to ${appointment.date}. Please visit hospital on given date.`;
        updateMsg = notificationDetails.msg;
      } else if (appointment.status === "Completed") {
        const ratingLink = `${process.env.FRONTEND_URL || 'http://localhost:8080'}/rate?appointmentId=${appointment._id}`;
        notificationDetails.msg = `Your consultation is completed. Please rate your experience: ${ratingLink}`;
        updateMsg = notificationDetails.msg;
      }

      try {
        await sendAppointmentEmail(appointment.patientEmail, notificationDetails, appointment.status !== "Completed"); // PDF only for not completed
        if (appointment.phone) await sendWhatsAppNotification(appointment.phone, updateMsg);
      } catch (err) {}
    }

    res.json({ msg: `Status updated to ${status}`, appointment });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};

// Get Appointments (With role-based filtering)
exports.getHospitalAppointments = async (req, res) => {
  try {
    let filter = {};
    
    if (req.user.role === "hospital") {
      const hospital = await Hospital.findOne({ userId: req.user.id });
      if (!hospital) return res.status(404).json({ msg: "Hospital profile not found" });
      filter.hospitalId = hospital._id;
    } else if (req.user.role === "branch") {
      if (!req.user.branchId) return res.status(400).json({ msg: "Branch ID missing in user token" });
      filter.branchId = req.user.branchId;
    } else {
      return res.status(403).json({ msg: "Access denied" });
    }

    const appointments = await Appointment.find(filter)
      .populate("branchId", "branchName city location phone")
      .sort({ createdAt: -1 });
    
    // Calculate statistics
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    const stats = {
      total: appointments.length,
      today: appointments.filter(a => a.date === today).length,
      yesterday: appointments.filter(a => a.date === yesterday).length,
      waiting: appointments.filter(a => a.status === 'Waiting').length,
      confirmed: appointments.filter(a => a.status === 'Confirmed').length,
      rescheduled: appointments.filter(a => a.status === 'Rescheduled').length,
      emergency: appointments.filter(a => a.type === 'Emergency').length
    };

    res.json({ appointments, stats });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};

// Get Patient Appointments
exports.getPatientAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ patientId: req.user.id }).sort({ createdAt: -1 });
    res.json({ appointments });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};

// Check Availability
exports.checkAvailability = async (req, res) => {
  try {
    const { hospitalId, branchId, date } = req.query;
    if (!hospitalId || !date) {
      return res.status(400).json({ msg: "Hospital ID and Date are required" });
    }

    const bookingCount = await Appointment.countDocuments({
      hospitalId,
      branchId: branchId === 'null' ? null : (branchId || null),
      date
    });

    res.json({ count: bookingCount });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};
// Get Now Serving Token
exports.getNowServing = async (req, res) => {
  try {
    const { hospitalId, branchId, date } = req.query;
    const tracker = await TokenTracker.findOne({ 
      hospitalId, 
      branchId: branchId === 'null' ? null : (branchId || null), 
      date 
    });
    res.json({ currentToken: tracker ? tracker.currentToken : 1 });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};

// Track Appointment
exports.trackAppointment = async (req, res) => {
  try {
    const { token, phone, tokenNumber } = req.query;
    let appointment;
    
    if (tokenNumber && phone) {
      // Precise search by Token Number + Phone
      const searchPhone = phone.startsWith('+91') ? phone : `+91${phone}`;
      appointment = await Appointment.findOne({ 
        tokenNumber: parseInt(tokenNumber), 
        phone: searchPhone 
      }).sort({ createdAt: -1 }).populate("hospitalId branchId");
    } else if (token) {
      // Legacy/Alternative: Track by ID (token string)
      if (mongoose.Types.ObjectId.isValid(token)) {
        appointment = await Appointment.findById(token).populate("hospitalId branchId");
      }
    } else if (phone) {
      // Find latest appointment by phone
      const searchPhone = phone.startsWith('+91') ? phone : `+91${phone}`;
      appointment = await Appointment.findOne({ phone: searchPhone })
        .sort({ createdAt: -1 })
        .populate("hospitalId branchId");
    }

    if (!appointment) {
      return res.status(404).json({ message: "No appointment found with given details" });
    }

    const tracker = await TokenTracker.findOne({
      hospitalId: appointment.hospitalId,
      branchId: appointment.branchId || null,
      date: appointment.date
    });

    const nowServing = tracker ? tracker.currentToken : 1;
    const peopleAhead = Math.max(0, appointment.tokenNumber - nowServing);

    // Build the specific response requested
    const response = {
      patientName: appointment.patientName,
      phone: appointment.phone,
      status: appointment.status,
      doctorName: appointment.assignedDoctorName || "To be assigned",
      hospitalName: appointment.hospitalName,
      branchName: appointment.branchId?.branchName || "Main",
      opdFee: appointment.opdFee || 0,
      appointmentDate: appointment.date,
      time: appointment.time,
      problem: appointment.problem,
      paymentStatus: appointment.paymentStatus || "Pending",
      nowServing,
      peopleAhead
    };

    res.json({
      appointment: response,
      rawAppointment: appointment // kept for legacy if needed
    });
  } catch (error) {
    console.error("Track Appointment Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
// Get Slot Occupancy
exports.getSlotOccupancy = async (req, res) => {
  try {
    const { hospitalId, branchId, date } = req.query;
    if (!hospitalId || !date) {
      return res.status(400).json({ msg: "Hospital ID and Date are required" });
    }

    const appointments = await Appointment.find({
      hospitalId,
      branchId: branchId === 'null' ? null : (branchId || null),
      date
    }, 'time');

    const occupancy = {};
    appointments.forEach(apt => {
      occupancy[apt.time] = (occupancy[apt.time] || 0) + 1;
    });

    res.json({ occupancy });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};
