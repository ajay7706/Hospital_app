const Appointment = require("../models/Appointment");
const Hospital = require("../models/Hospital");
const User = require("../models/Users");
const { sendAppointmentEmail, sendWhatsAppNotification } = require("../config/mailer");
const Branch = require("../models/Branch");

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

    // 2. USER RESTRICTION: One active booking per user
    const activeBooking = await Appointment.findOne({
      patientId: req.user.id,
      status: { $in: ["Waiting", "Confirmed", "Rescheduled", "pending", "approved"] }
    });
    if (activeBooking) {
      return res.status(400).json({ msg: "You already have an active appointment." });
    }

    // 3. SEPARATE QUEUE SYSTEM: Check capacity
    let maxQueue = 0;
    if (branchId) {
      const branch = await Branch.findById(branchId);
      if (!branch) return res.status(404).json({ msg: "Branch not found" });
      maxQueue = (branch.branchCapacity || 50) * 1.5;
    } else {
      maxQueue = (hospital.dailyCapacity || 100) * 1.5;
    }

    const bookingCount = await Appointment.countDocuments({
      hospitalId,
      branchId: branchId || null,
      date
    });

    if (type !== "Emergency" && bookingCount >= maxQueue) {
      return res.status(400).json({ msg: branchId ? "Slot full for this branch on selected date." : "Slot full for hospital on selected date." });
    }

    // 4. Create Appointment with Token
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
      ambulanceRequired: ambulanceRequired || false
    });

    // 5. Notifications
    try {
      const branch = branchId ? await Branch.findById(branchId) : null;
      const notificationDetails = {
        ...appointment.toObject(),
        supportEmail: hospital.officialEmail,
        supportPhone: branch ? branch.phone : hospital.contactNumber,
        branchDetails: branch
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
    }

    // SMART LOGIC: Move to Next Day
    if (status === "Rescheduled") {
      const targetDate = nextDate || new Date(new Date(appointment.date).getTime() + 86400000).toISOString().split('T')[0];
      
      // Check target day capacity
      let maxQueue = 0;
      if (appointment.branchId) {
        const branch = await Branch.findById(appointment.branchId);
        maxQueue = (branch.branchCapacity || 50) * 1.5;
      } else {
        const hospital = await Hospital.findById(appointment.hospitalId);
        maxQueue = (hospital.dailyCapacity || 100) * 1.5;
      }

      const nextDayCount = await Appointment.countDocuments({
        hospitalId: appointment.hospitalId,
        branchId: appointment.branchId || null,
        date: targetDate
      });

      if (nextDayCount >= maxQueue) {
        return res.status(400).json({ msg: "Next day slot is already full." });
      }

      appointment.date = targetDate;
      appointment.status = "Rescheduled";
      appointment.tokenNumber = nextDayCount + 1;
    } else {
      appointment.status = status;
    }

    await appointment.save();

    // Trigger PDF & WhatsApp on Confirm/Reschedule
    if (["Confirmed", "Rescheduled"].includes(appointment.status)) {
      const hospital = await Hospital.findById(appointment.hospitalId);
      const branch = appointment.branchId ? await Branch.findById(appointment.branchId) : null;
      
      const notificationDetails = {
        ...appointment.toObject(),
        supportEmail: hospital?.officialEmail,
        supportPhone: branch ? branch.phone : hospital?.contactNumber,
        branchDetails: branch
      };

      const branchName = branch ? `(${branch.branchName} Branch)` : '';
      const updateMsg = `Appointment at ${appointment.hospitalName} ${branchName} is ${appointment.status.toUpperCase()}. Date: ${appointment.date}, Token: ${appointment.tokenNumber}.`;

      try {
        await sendAppointmentEmail(appointment.patientEmail, notificationDetails, true);
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
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};
