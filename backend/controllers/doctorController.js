const Doctor = require("../models/Doctor");
const Hospital = require("../models/Hospital");
const User = require("../models/Users");
const Appointment = require("../models/Appointment");
const bcrypt = require("bcryptjs");

exports.addDoctor = async (req, res) => {
  try {
    const { name, email, password, specialization, experience, branchId } = req.body;
    
    let hospitalId;
    let bId = branchId;

    if (req.user.role === 'hospital') {
      const hospital = await Hospital.findOne({ userId: req.user.id });
      if (!hospital) return res.status(404).json({ msg: "Hospital not found" });
      hospitalId = hospital._id;
    } else if (req.user.role === 'branch') {
      hospitalId = req.user.hospitalId;
      bId = req.user.branchId; // Ensure doctor is added to THEIR branch
    } else {
      return res.status(403).json({ msg: "Not authorized" });
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
      hospitalId: hospitalId,
      branchId: bId
    });
    
    // 2. Create Doctor Profile
    const newDoctor = await Doctor.create({
      userId: user._id,
      hospitalId: hospitalId,
      branchId: bId,
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

    // Show ONLY assigned appointments for this specific doctor
    const filter = { 
      assignedDoctorId: doctor._id
    };
    
    const appointments = await Appointment.find(filter).sort({ createdAt: -1 });
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};

exports.getDoctorsByHospital = async (req, res) => {
  try {
    const doctors = await Doctor.find({ hospitalId: req.params.hospitalId, branchId: null });
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};

exports.deleteDoctor = async (req, res) => {
  try {
    let hospitalId;
    if (req.user.role === 'hospital') {
      const hospital = await Hospital.findOne({ userId: req.user.id });
      if (!hospital) return res.status(404).json({ msg: "Hospital not found" });
      hospitalId = hospital._id;
    } else if (req.user.role === 'branch') {
      hospitalId = req.user.hospitalId;
    } else {
      return res.status(403).json({ msg: "Not authorized" });
    }

    const query = { _id: req.params.id, hospitalId: hospitalId };
    if (req.user.role === 'branch') query.branchId = req.user.branchId;

    const doctor = await Doctor.findOneAndDelete(query);
    if (!doctor) {
      return res.status(404).json({ msg: "Doctor not found or you are not authorized" });
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

exports.getBranchDoctors = async (req, res) => {
  try {
    const { branchId, hospitalId } = req.user;
    const query = branchId ? { branchId } : { hospitalId, branchId: null };
    const doctors = await Doctor.find(query);
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ msg: "Server Error", error: error.message });
  }
};

exports.getDoctorsByBranch = async (req, res) => {
  try {
    const doctors = await Doctor.find({ branchId: req.params.branchId });
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ msg: "Server Error", error: error.message });
  }
};

