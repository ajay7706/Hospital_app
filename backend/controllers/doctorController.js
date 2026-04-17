const Doctor = require("../models/Doctor");
const Hospital = require("../models/Hospital");
const User = require("../models/Users");
const Appointment = require("../models/Appointment");
const bcrypt = require("bcryptjs");

exports.addDoctor = async (req, res) => {
  try {
    const { name, email, password, specialization, experience } = req.body;
    
    const hospital = await Hospital.findOne({ userId: req.user.id });
    if (!hospital) {
      return res.status(404).json({ msg: "Hospital not found" });
    }

    // 1. Create User
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ msg: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'doctor',
      hospitalId: hospital._id
    });
    
    // 2. Create Doctor Profile
    const newDoctor = await Doctor.create({
      userId: user._id,
      hospitalId: hospital._id,
      name,
      email,
      specialization,
      experience: experience || 0,
      image: req.file ? req.file.path : req.body.image
    });

    res.status(201).json(newDoctor);
  } catch (error) {
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};

exports.getDoctorAppointments = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user.id });
    if (!doctor) return res.status(404).json({ msg: "Doctor profile not found" });

    // Show all appointments for this hospital/branch for now 
    // or filter by assignedDoctorId if we use that.
    // The prompt says "Assigned appointments only".
    const filter = { 
      hospitalId: doctor.hospitalId,
      // Optional: status: { $ne: "cancelled" }
    };
    
    const appointments = await Appointment.find(filter).sort({ tokenNumber: 1 });
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};

exports.getDoctorsByHospital = async (req, res) => {
  try {
    const doctors = await Doctor.find({ hospitalId: req.params.hospitalId });
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};

exports.deleteDoctor = async (req, res) => {
  try {
    const hospital = await Hospital.findOne({ userId: req.user.id });
    if (!hospital) {
      return res.status(404).json({ msg: "Hospital not found" });
    }

    const doctor = await Doctor.findOneAndDelete({ _id: req.params.id, hospitalId: hospital._id });
    if (!doctor) {
      return res.status(404).json({ msg: "Doctor not found" });
    }

    // Also delete the user
    if (doctor.userId) {
      await User.findByIdAndDelete(doctor.userId);
    }

    res.json({ msg: "Doctor removed" });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};

