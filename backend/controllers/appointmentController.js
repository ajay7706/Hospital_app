const Appointment = require("../models/Appointment");
const Hospital = require("../models/Hospital");
const { sendAppointmentEmail } = require("../config/mailer");

// Book Appointment
exports.bookAppointment = async (req, res) => {
  try {
    const { hospitalId, date, time, patientName, patientEmail, location, hospitalName, phone } = req.body;
    
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
      patientId: req.user.id,
      date,
      time,
      patientName,
      patientEmail,
      phone,
      status: "pending"
    });

    // Initial booking confirmation email REMOVED as per request
    // We only send when status changes from hospital dashboard

    res.status(201).json({ msg: "Appointment booked successfully", appointment });
  } catch (error) {
    console.error("Booking error:", error);
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};

// Get Patient Appointments
exports.getPatientAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ patientId: req.user.id });
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};

// Get Hospital Appointments
exports.getHospitalAppointments = async (req, res) => {
  try {
    const hospital = await Hospital.findOne({ userId: req.user.id });
    if (!hospital) {
      return res.status(404).json({ msg: "Hospital not found" });
    }
    const appointments = await Appointment.find({ hospitalId: hospital._id });
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};

// Update Appointment Status
exports.updateAppointmentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const appointment = await Appointment.findById(req.params.id).populate("hospitalId");
    
    if (!appointment) {
      return res.status(404).json({ msg: "Appointment not found" });
    }

    // Verify ownership
    const hospital = await Hospital.findOne({ userId: req.user.id });
    if (!hospital || appointment.hospitalId._id.toString() !== hospital._id.toString()) {
      return res.status(401).json({ msg: "Not authorized to update this appointment" });
    }

    appointment.status = status;
    await appointment.save();

    const hospitalDetails = {
      hospitalName: hospital.hospitalName,
      location: hospital.city,
      patientName: appointment.patientName,
      patientEmail: appointment.patientEmail,
      date: appointment.date,
      time: appointment.time,
      phone: appointment.phone,
      status: status
    };

    if (status === "approved") {
      await sendAppointmentEmail(appointment.patientEmail, hospitalDetails);
    } else if (status === "completed") {
      await sendAppointmentEmail(appointment.patientEmail, hospitalDetails);
      await sendWhatsAppNotification(appointment.phone, hospitalDetails);
    }

    res.json({ msg: `Appointment status updated to ${status}`, appointment });
  } catch (error) {
    console.error("Status update error:", error);
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};
