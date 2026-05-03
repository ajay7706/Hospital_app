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

    // 2. Generate Custom ID: HSP-YYYYMMDD-RAND
    const datePart = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const randPart = Math.floor(1000 + Math.random() * 9000);
    const customId = `HSP-${datePart}-${randPart}`;

    // 3. USER RESTRICTION: Allow booking again if already approved, or at different hospitals/dates
    const activeBooking = await Appointment.findOne({
      patientId: req.user.id,
      hospitalId,
      date,
      status: { $in: ["Waiting", "pending", "Rescheduled"] }
    });
    if (activeBooking) {
      return res.status(400).json({ msg: "You already have an active appointment at this hospital on this date." });
    }

    let maxQueue = 300;
    const bookingCount = await Appointment.countDocuments({
      hospitalId,
      branchId: branchId || null,
      date
    });

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

    // 4. Calculate OPD Charge and get Branch details
    let finalOpdCharge = hospital.opdCharge || 0;
    let branchDetails = null;
    if (branchId) {
      branchDetails = await Branch.findById(branchId);
      if (branchDetails && branchDetails.opdChargeType === "custom") {
        finalOpdCharge = branchDetails.opdCharge;
      }
    }

    // 5. Create Appointment
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
      location: branchDetails ? branchDetails.address : location,
      problem: problem || "",
      status: "Waiting",
      type: type || "Normal",
      tokenNumber: type === "Emergency" ? 0 : bookingCount + 1,
      ambulanceRequired: ambulanceRequired || false,
      opdCharge: finalOpdCharge,
      customId: customId
    });

    // 6. Notifications (Immediate WhatsApp Only)
    try {
      const { sendBookingConfirmationWhatsApp } = require("../config/mailer");
      
      const notificationDetails = {
        ...appointment.toObject(),
        supportPhone: branchDetails ? branchDetails.phone : hospital.contactNumber,
        branchName: branchDetails ? branchDetails.branchName : 'Main'
      };
      
      await sendBookingConfirmationWhatsApp(notificationDetails);
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
    const appointment = await Appointment.findById(req.params.id).populate("hospitalId branchId");
    if (!appointment) return res.status(404).json({ msg: "Appointment not found" });

    // PERMISSION CHECK
    if (req.user.role === "hospital") {
      if (appointment.branchId) return res.status(403).json({ msg: "Main hospital can only view branch appointments." });
    } else if (req.user.role === "branch") {
      if (!appointment.branchId || appointment.branchId._id.toString() !== req.user.branchId?.toString()) {
        return res.status(403).json({ msg: "Access denied to this branch data." });
      }
    } else if (req.user.role === "doctor") {
      const allowedDoctorStatuses = ["In Consultation", "Lab Pending", "Completed"];
      if (!allowedDoctorStatuses.includes(status)) {
        return res.status(403).json({ msg: "Doctors can only change status to In Consultation, Lab Pending, or Completed." });
      }
      const doctorProfile = await Doctor.findOne({ userId: req.user.id });
      if (!doctorProfile || doctorProfile.hospitalId.toString() !== appointment.hospitalId._id.toString()) {
        return res.status(403).json({ msg: "Access denied. This appointment belongs to another hospital." });
      }
    }

    // Status logic
    if (status === "Confirmed") {
        const approvedCount = await Appointment.countDocuments({
            hospitalId: appointment.hospitalId._id,
            branchId: appointment.branchId?._id || null,
            date: appointment.date,
            status: "Confirmed"
        });

        if (approvedCount >= 200) {
            return res.status(400).json({ msg: "Daily approval limit reached for this date (Limit: 200)." });
        }
        appointment.status = "Confirmed";
        
        if (req.body.doctorId) {
          const doctor = await Doctor.findById(req.body.doctorId);
          if (doctor) {
            appointment.assignedDoctorId = doctor._id;
            appointment.assignedDoctorName = doctor.name;
          }
        }
    } 
    else if (status === "Rescheduled") {
      const targetDate = nextDate || new Date(new Date(appointment.date).getTime() + 86400000).toISOString().split('T')[0];
      const nextDayCount = await Appointment.countDocuments({
        hospitalId: appointment.hospitalId._id,
        branchId: appointment.branchId?._id || null,
        date: targetDate
      });

      if (nextDayCount >= 300) return res.status(400).json({ msg: "Next day is full." });

      appointment.date = targetDate;
      appointment.status = "Rescheduled";
      appointment.tokenNumber = nextDayCount + 1;
    } 
    else {
      appointment.status = status;
    }

    if (status === "Completed") {
      await TokenTracker.findOneAndUpdate(
        { 
          hospitalId: appointment.hospitalId._id, 
          branchId: appointment.branchId?._id || null, 
          date: appointment.date 
        },
        { $inc: { currentToken: 1 } },
        { upsert: true, new: true }
      );
    }

    await appointment.save();

    // Trigger Notifications on Confirm/Reschedule
    if (["Confirmed", "Rescheduled"].includes(appointment.status)) {
      const tracker = await TokenTracker.findOne({ 
        hospitalId: appointment.hospitalId._id, 
        branchId: appointment.branchId?._id || null, 
        date: appointment.date 
      });
      const nowServing = tracker ? tracker.currentToken : 1;
      const peopleAhead = Math.max(0, appointment.tokenNumber - nowServing);

      const notificationDetails = {
        ...appointment.toObject(),
        supportEmail: appointment.hospitalId?.officialEmail,
        supportPhone: appointment.branchId ? appointment.branchId.phone : appointment.hospitalId?.contactNumber,
        branchName: appointment.branchId ? appointment.branchId.branchName : 'Main',
        nowServing,
        peopleAhead
      };

      try {
        const { sendAppointmentEmail } = require("../config/mailer");
        // For confirmed: Send Email + PDF + WhatsApp
        // For rescheduled: Send Email + PDF
        await sendAppointmentEmail(appointment.patientEmail, notificationDetails, true, status === "Confirmed");
      } catch (err) { console.error("Update Notification Error:", err); }
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
    const { id } = req.params;
    let appointment;
    
    if (id || token) {
      const searchId = id || token;
      // Search by Custom ID first
      appointment = await Appointment.findOne({ customId: searchId }).populate("hospitalId branchId");
      
      // Fallback to MongoDB ID
      if (!appointment && mongoose.Types.ObjectId.isValid(searchId)) {
        appointment = await Appointment.findById(searchId).populate("hospitalId branchId");
      }
    } 
    
    if (!appointment && tokenNumber && phone) {
      const searchPhone = phone.startsWith('+91') ? phone : `+91${phone}`;
      appointment = await Appointment.findOne({ 
        tokenNumber: parseInt(tokenNumber), 
        phone: searchPhone 
      }).sort({ createdAt: -1 }).populate("hospitalId branchId");
    } else if (!appointment && phone) {
      const searchPhone = phone.startsWith('+91') ? phone : `+91${phone}`;
      appointment = await Appointment.findOne({ phone: searchPhone })
        .sort({ createdAt: -1 })
        .populate("hospitalId branchId");
    }

    if (!appointment) {
      return res.status(404).json({ message: "No appointment found with given details" });
    }

    const tracker = await TokenTracker.findOne({
      hospitalId: appointment.hospitalId?._id || appointment.hospitalId,
      branchId: appointment.branchId?._id || null,
      date: appointment.date
    });

    const nowServing = tracker ? tracker.currentToken : 1;
    const peopleAhead = Math.max(0, appointment.tokenNumber - nowServing);

    const response = {
      _id: appointment._id,
      customId: appointment.customId,
      patientName: appointment.patientName,
      phone: appointment.phone,
      status: appointment.status,
      doctorName: appointment.assignedDoctorName || "To be assigned",
      hospitalName: appointment.hospitalName,
      branchName: appointment.branchId?.branchName || "Main",
      opdFee: appointment.opdCharge || 0,
      appointmentDate: appointment.date,
      time: appointment.time,
      problem: appointment.problem,
      paymentStatus: appointment.paymentStatus || "Pending",
      nowServing,
      peopleAhead,
      tokenNumber: appointment.tokenNumber
    };

    res.json({
      appointment: response
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
