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
    const newBranch = new Branch({
      ...req.body,
      hospitalId: hospital._id,
      image: req.files && req.files.image ? req.files.image[0].path : req.body.image,
      opdChargeType: req.body.opdChargeType || "hospitalDefault",
      opdCharge: req.body.opdCharge || 0,
      govtSchemes: [],
      insurance: { accepted: false, providers: [] },
      labDetails: { enabled: false, labName: '', images: [] },
      medicalStore: { enabled: false, images: [] }
    });

    try { if (req.body.govtSchemes) newBranch.govtSchemes = JSON.parse(req.body.govtSchemes); } catch (e) { console.error("Error parsing govtSchemes:", e); }
    try { if (req.body.insurance) newBranch.insurance = JSON.parse(req.body.insurance); } catch (e) { console.error("Error parsing insurance:", e); }
    try { if (req.body.labDetails) newBranch.labDetails = JSON.parse(req.body.labDetails); } catch (e) { console.error("Error parsing labDetails:", e); }
    try { if (req.body.medicalStore) newBranch.medicalStore = JSON.parse(req.body.medicalStore); } catch (e) { console.error("Error parsing medicalStore:", e); }

    if (req.files) {
      if (req.files.labImages) newBranch.labDetails.images = req.files.labImages.map(f => f.path);
      if (req.files.medicalImages) newBranch.medicalStore.images = req.files.medicalImages.map(f => f.path);
      await newBranch.save();
    }

    res.status(201).json(newBranch);
  } catch (error) {
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};

exports.updateBranch = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Update request for branch ${id} by user ${req.user.id} (${req.user.role})`);

    let hospitalId;
    if (req.user.role === 'hospital') {
      const hospital = await Hospital.findOne({ userId: req.user.id });
      if (!hospital) return res.status(404).json({ msg: "Hospital profile not found" });
      hospitalId = hospital._id;
    } else if (req.user.role === 'branch') {
      hospitalId = req.user.hospitalId;
      if (!req.user.branchId || id !== req.user.branchId.toString()) {
        console.error("Authorization failed: Branch ID mismatch or missing.");
        return res.status(403).json({ msg: "Not authorized to update this branch" });
      }
    } else {
      return res.status(403).json({ msg: "Unauthorized role" });
    }

    const branch = await Branch.findOne({ _id: id, hospitalId });
    if (!branch) return res.status(404).json({ msg: "Branch not found or does not belong to your hospital" });

    const updateData = { ...req.body };

    // Helper to safely parse JSON or return original/default
    const tryParse = (val, fallback) => {
      if (!val) return fallback;
      if (typeof val !== 'string') return val;
      try { return JSON.parse(val); } catch (e) { 
        console.error("JSON Parse Error:", e.message, "Value:", val);
        return fallback; 
      }
    };

    // Parse complex fields
    if (req.body.govtSchemes) updateData.govtSchemes = tryParse(req.body.govtSchemes, []);
    if (req.body.insurance) updateData.insurance = tryParse(req.body.insurance, { accepted: false, providers: [] });
    if (req.body.labDetails) updateData.labDetails = tryParse(req.body.labDetails, { enabled: false, labName: '', images: [] });
    if (req.body.medicalStore) updateData.medicalStore = tryParse(req.body.medicalStore, { enabled: false, images: [] });
    if (req.body.services) updateData.services = tryParse(req.body.services, []);
    if (req.body.workingDays) updateData.workingDays = tryParse(req.body.workingDays, []);

    // Handle Booleans from FormData
    const toBool = (val) => val === 'true' || val === 'on' || val === true;
    if (req.body.emergency24x7 !== undefined) updateData.emergency24x7 = toBool(req.body.emergency24x7);
    if (req.body.ambulanceAvailable !== undefined) updateData.ambulanceAvailable = toBool(req.body.ambulanceAvailable);

    // Handle Image Gallery
    if (req.body.existingGallery) {
      updateData.gallery = tryParse(req.body.existingGallery, branch.gallery || []);
    }

    // Handle File Uploads
    if (req.files) {
      if (req.files.image) {
        updateData.image = req.files.image[0].path;
      }
      
      if (req.files.gallery) {
        const newImgs = req.files.gallery.map(f => f.path);
        updateData.gallery = [...(updateData.gallery || branch.gallery || []), ...newImgs];
      }

      if (req.files.labImages) {
        const newImgs = req.files.labImages.map(f => f.path);
        const existing = tryParse(req.body.existingLabImages, updateData.labDetails?.images || branch.labDetails?.images || []);
        if (!updateData.labDetails) updateData.labDetails = branch.labDetails ? JSON.parse(JSON.stringify(branch.labDetails)) : { enabled: false, images: [] };
        updateData.labDetails.images = [...existing, ...newImgs];
      }

      if (req.files.medicalImages) {
        const newImgs = req.files.medicalImages.map(f => f.path);
        const existing = tryParse(req.body.existingMedicalImages, updateData.medicalStore?.images || branch.medicalStore?.images || []);
        if (!updateData.medicalStore) updateData.medicalStore = branch.medicalStore ? JSON.parse(JSON.stringify(branch.medicalStore)) : { enabled: false, images: [] };
        updateData.medicalStore.images = [...existing, ...newImgs];
      }
    }

    // Update and Save
    branch.set(updateData);
    const updatedBranch = await branch.save();
    
    console.log(`Branch ${id} updated successfully`);
    res.json(updatedBranch);

  } catch (error) {
    console.error("Update Branch Error:", error);
    res.status(500).json({ 
      msg: "Internal Server Error", 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
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

exports.getBranchById = async (req, res) => {
  try {
    const branch = await Branch.findById(req.params.id).populate("hospitalId");
    if (!branch) return res.status(404).json({ msg: "Branch not found" });
    res.json(branch);
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
