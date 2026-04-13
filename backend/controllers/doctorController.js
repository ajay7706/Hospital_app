const Doctor = require("../models/Doctor");
const Hospital = require("../models/Hospital");

exports.addDoctor = async (req, res) => {
  try {
    const hospital = await Hospital.findOne({ userId: req.user.id });
    if (!hospital) {
      return res.status(404).json({ msg: "Hospital not found" });
    }
    
    const newDoctor = await Doctor.create({
      ...req.body,
      hospitalId: hospital._id,
      image: req.file ? req.file.path : req.body.image
    });

    res.status(201).json(newDoctor);
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

    res.json({ msg: "Doctor removed" });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};
