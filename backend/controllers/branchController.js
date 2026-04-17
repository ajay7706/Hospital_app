const Branch = require("../models/Branch");
const Hospital = require("../models/Hospital");

exports.addBranch = async (req, res) => {
  try {
    const hospital = await Hospital.findOne({ userId: req.user.id });
    if (!hospital) {
      return res.status(404).json({ msg: "Hospital not found" });
    }

    if (hospital.approvalStatus !== "approved") {
      return res.status(403).json({ msg: "Only approved hospitals can add branches" });
    }

    const branchCount = await Branch.countDocuments({ hospitalId: hospital._id });
    if (branchCount >= 4) {
      return res.status(400).json({ msg: "Maximum 4 branches allowed" });
    }

    const newBranch = await Branch.create({
      ...req.body,
      hospitalId: hospital._id,
      image: req.file ? req.file.path : req.body.image,
      opdChargeType: req.body.opdChargeType || "hospitalDefault",
      opdCharge: req.body.opdCharge || 0
    });

    res.status(201).json(newBranch);
  } catch (error) {
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};

exports.updateBranch = async (req, res) => {
  try {
    const hospital = await Hospital.findOne({ userId: req.user.id });
    if (!hospital) return res.status(404).json({ msg: "Hospital not found" });

    const updateData = { ...req.body };
    if (req.file) updateData.image = req.file.path;

    const branch = await Branch.findOneAndUpdate(
      { _id: req.params.id, hospitalId: hospital._id },
      updateData,
      { new: true }
    );
    
    if (!branch) return res.status(404).json({ msg: "Branch not found" });
    res.json(branch);
  } catch (error) {
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};

exports.getBranchesByHospital = async (req, res) => {
  try {
    const branches = await Branch.find({ hospitalId: req.params.hospitalId });
    res.json(branches);
  } catch (error) {
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};

exports.deleteBranch = async (req, res) => {
  try {
    const hospital = await Hospital.findOne({ userId: req.user.id });
    if (!hospital) {
      return res.status(404).json({ msg: "Hospital not found" });
    }

    const branch = await Branch.findOneAndDelete({ _id: req.params.id, hospitalId: hospital._id });
    if (!branch) {
      return res.status(404).json({ msg: "Branch not found" });
    }

    res.json({ msg: "Branch removed" });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};
