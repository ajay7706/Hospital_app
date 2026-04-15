const Appointment = require("../models/Appointment");
const Hospital = require("../models/Hospital");
const User = require("../models/Users");
const { sendAppointmentEmail, sendWhatsAppNotification } = require("../config/mailer");

// Book Appointment
exports.bookAppointment = async (req, res) => {
  try {
    const { hospitalId, branchId, date, time, patientName, patientEmail, location, hospitalName, phone, ambulanceRequired, problem } = req.body;
    
    // Check if hospital exists and is approved
    const hospital = await Hospital.findById(hospitalId);
    if (!hospital) {
      return res.status(404).json({ msg: "Hospital not found" });
    }
    if (hospital.approvalStatus !== "approved") {
      return res.status(403).json({ msg: "This hospital is not yet approved and cannot accept appointments." });
    }

    const appointment = await Appointment.create({
      hospitalId,
      branchId: branchId || null,
      patientId: req.user.id,
      date,
      time,
      patientName,
      patientEmail,
      phone,
      hospitalName,
      location,
      problem: problem || "",
      status: "pending",
      ambulanceRequired: ambulanceRequired || false
    });

    // Send confirmation message
    const pendingMsg = `Hello ${patientName}, your appointment at ${hospitalName} for ${date} is currently PENDING approval. We will notify you once confirmed.`;
    
    try {
      await sendAppointmentEmail(patientEmail, {
        ...appointment.toObject(),
        status: "pending",
        msg: pendingMsg
      }, false);
      
      if (phone) {
        await sendWhatsAppNotification(phone, pendingMsg);
      }
    } catch (mailErr) {
      console.error("Notification Error (Pending):", mailErr);
    }

    res.status(201).json({ msg: "Appointment booked successfully", appointment });
  } catch (error) {
    console.error("Booking error:", error);
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
      .populate("branchId", "branchName city location")
      .sort({ createdAt: -1 });
    
    // Calculate statistics
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    const stats = {
      total: appointments.length,
      today: appointments.filter(a => a.date === today).length,
      yesterday: appointments.filter(a => a.date === yesterday).length,
      pending: appointments.filter(a => a.status?.toLowerCase() === 'pending').length,
      approved: appointments.filter(a => a.status?.toLowerCase() === 'approved').length,
      completed: appointments.filter(a => a.status?.toLowerCase() === 'completed').length
    };

    res.json({ appointments, stats });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};

// Update Appointment Status (With Permission Checks)
exports.updateAppointmentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const appointment = await Appointment.findById(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({ msg: "Appointment not found" });
    }

    // PERMISSION CHECK
    if (req.user.role === "hospital") {
      // Main hospital can ONLY approve if there is NO branchId
      if (appointment.branchId) {
        return res.status(403).json({ msg: "Main hospital can only view branch appointments, not approve/complete them." });
      }
    } else if (req.user.role === "branch") {
      // Branch can ONLY approve if it belongs to them
      if (!appointment.branchId || appointment.branchId.toString() !== req.user.branchId?.toString()) {
        return res.status(403).json({ msg: "You can only manage appointments for your own branch." });
      }
    }

    appointment.status = status;
    await appointment.save();

    // Trigger notifications
    if (status === "approved") {
      const approvalMsg = `Your appointment at ${appointment.hospitalName} has been APPROVED for ${appointment.date} at ${appointment.time}.`;
      try {
        await sendAppointmentEmail(appointment.patientEmail, { ...appointment.toObject(), status: "approved" }, true);
        if (appointment.phone) await sendWhatsAppNotification(appointment.phone, approvalMsg);
      } catch (err) {}
    } else if (status === "completed") {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const completionMsg = `Visit to ${appointment.hospitalName} completed. Rate us: ${frontendUrl}/hospital-details?id=${appointment.hospitalId}`;
      try {
        await sendAppointmentEmail(appointment.patientEmail, { ...appointment.toObject(), status: "completed" }, false);
        if (appointment.phone) await sendWhatsAppNotification(appointment.phone, completionMsg);
      } catch (err) {}
    }

    res.json({ msg: `Status updated to ${status}`, appointment });
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
