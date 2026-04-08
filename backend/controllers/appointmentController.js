const Appointment = require("../models/Appointment");
const Hospital = require("../models/Hospital");
const User = require("../models/Users");
const { sendAppointmentEmail, sendWhatsAppNotification } = require("../config/mailer");

// Book Appointment
exports.bookAppointment = async (req, res) => {
  try {
    const { hospitalId, date, time, patientName, patientEmail, location, hospitalName, phone, ambulanceRequired } = req.body;
    
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
      hospitalName,
      location,
      status: "pending",
      ambulanceRequired: ambulanceRequired || false
    });

    // Send confirmation message (TEXT ONLY - No PDF for pending)
    const pendingMsg = `Hello ${patientName}, your appointment at ${hospitalName} for ${date} is currently PENDING approval. We will notify you once confirmed. Ambulance Required: ${ambulanceRequired ? 'Yes' : 'No'}.`;
    
    try {
      await sendAppointmentEmail(patientEmail, {
        ...appointment.toObject(),
        status: "pending",
        msg: pendingMsg
      }, false); // Pass false to indicate no PDF
      
      if (phone) {
        await sendWhatsAppNotification(phone, pendingMsg);
      }
    } catch (mailErr) {
      console.error("Email/WhatsApp Notification Error (Pending):", mailErr);
    }

    res.status(201).json({ msg: "Appointment booked successfully", appointment });
  } catch (error) {
    console.error("Booking error:", error);
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};

// Get Appointments for a Hospital
exports.getHospitalAppointments = async (req, res) => {
  try {
    const hospital = await Hospital.findOne({ userId: req.user.id });
    if (!hospital) {
      return res.status(404).json({ msg: "Hospital profile not found" });
    }
    const appointments = await Appointment.find({ hospitalId: hospital._id }).sort({ createdAt: -1 });
    
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

// Get Appointments for a Patient
exports.getPatientAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ patientId: req.user.id }).sort({ createdAt: -1 });
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};

// Update Appointment Status
exports.updateAppointmentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const appointment = await Appointment.findById(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({ msg: "Appointment not found" });
    }

    appointment.status = status;
    await appointment.save();

    // Trigger notifications based on status
    if (status === "approved") {
      const approvalMsg = `Congratulations! Your appointment at ${appointment.hospitalName} has been APPROVED for ${appointment.date} at ${appointment.time}. Please find the details in the attached PDF.`;
      
      try {
        // Send Email with PDF
        await sendAppointmentEmail(appointment.patientEmail, {
          ...appointment.toObject(),
          status: "approved"
        }, true); // Pass true for PDF
        
        if (appointment.phone) {
          await sendWhatsAppNotification(appointment.phone, approvalMsg);
        }
      } catch (mailErr) {
        console.error("Notification Error (Approved):", mailErr);
      }
    } else if (status === "completed") {
      const frontendUrl = process.env.FRONTEND_URL || 'https://hospital-app-rouge.vercel.app';
      const completionMsg = `Your visit to ${appointment.hospitalName} is marked as completed. Please take a moment to rate and review your experience: ${frontendUrl}/hospital-details?id=${appointment.hospitalId}`;
      
      try {
        await sendAppointmentEmail(appointment.patientEmail, {
          ...appointment.toObject(),
          status: "completed",
          msg: completionMsg
        }, false);
        
        if (appointment.phone) {
          await sendWhatsAppNotification(appointment.phone, completionMsg);
        }
      } catch (mailErr) {
        console.error("Notification Error (Completed):", mailErr);
      }
    }

    res.json({ msg: `Appointment status updated to ${status}`, appointment });
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

// Update Appointment Status
exports.updateAppointmentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const appointment = await Appointment.findById(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({ msg: "Appointment not found" });
    }

    appointment.status = status;
    await appointment.save();

    // Trigger notifications based on status
    if (status === "approved") {
      const approvalMsg = `Congratulations! Your appointment at ${appointment.hospitalName} has been APPROVED for ${appointment.date} at ${appointment.time}. Please find the details in the attached PDF.`;
      
      try {
        // Send Email with PDF
        await sendAppointmentEmail(appointment.patientEmail, {
          ...appointment.toObject(),
          status: "approved"
        }, true); // Pass true for PDF
        
        if (appointment.phone) {
          await sendWhatsAppNotification(appointment.phone, approvalMsg);
        }
      } catch (mailErr) {
        console.error("Notification Error (Approved):", mailErr);
      }
    } else if (status === "completed") {
      const completionMsg = `Your visit to ${appointment.hospitalName} is marked as completed. Please take a moment to rate and review your experience: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/hospital-details?id=${appointment.hospitalId}`;
      
      try {
        await sendAppointmentEmail(appointment.patientEmail, {
          ...appointment.toObject(),
          status: "completed",
          msg: completionMsg
        }, false);
        
        if (appointment.phone) {
          await sendWhatsAppNotification(appointment.phone, completionMsg);
        }
      } catch (mailErr) {
        console.error("Notification Error (Completed):", mailErr);
      }
    }

    res.json({ msg: `Appointment status updated to ${status}`, appointment });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};
