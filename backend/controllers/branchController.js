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
    let hospitalId;
    if (req.user.role === 'hospital') {
      const hospital = await Hospital.findOne({ userId: req.user.id });
      if (!hospital) return res.status(404).json({ msg: "Hospital not found" });
      hospitalId = hospital._id;
    } else if (req.user.role === 'branch') {
      hospitalId = req.user.hospitalId;
      // Ensure branch staff only updates their own branch
      if (req.params.id !== req.user.branchId.toString()) {
        console.error("Branch ID mismatch:", { paramId: req.params.id, userBranchId: req.user.branchId });
        return res.status(403).json({ msg: "Access denied. You can only update your own branch." });
      }
    } else {
      return res.status(403).json({ msg: "Not authorized" });
    }

    const updateData = { ...req.body };

    // Convert checkbox "on"/"true" strings to Booleans for Mongoose
    if (req.body.emergency24x7 !== undefined) {
      updateData.emergency24x7 = req.body.emergency24x7 === 'on' || req.body.emergency24x7 === 'true' || req.body.emergency24x7 === true;
    }
    if (req.body.ambulanceAvailable !== undefined) {
      updateData.ambulanceAvailable = req.body.ambulanceAvailable === 'on' || req.body.ambulanceAvailable === 'true' || req.body.ambulanceAvailable === true;
    }
    
    // Parse JSON strings from FormData
    if (req.body.workingDays) {
      try { updateData.workingDays = JSON.parse(req.body.workingDays); } catch (e) { /* ignore */ }
    }
    
    if (req.body.existingGallery) {
      try { 
        updateData.gallery = JSON.parse(req.body.existingGallery); 
      } catch (e) { /* ignore */ }
    }

    if (req.body.services) {
      try { 
        updateData.services = JSON.parse(req.body.services); 
      } catch (e) { /* ignore */ }
    }

    if (req.body.govtSchemes) {
      try { updateData.govtSchemes = JSON.parse(req.body.govtSchemes); } catch (e) { console.error("Error parsing govtSchemes:", e); delete updateData.govtSchemes; }
    }
    if (req.body.insurance) {
      try { updateData.insurance = JSON.parse(req.body.insurance); } catch (e) { console.error("Error parsing insurance:", e); delete updateData.insurance; }
    }
    if (req.body.labDetails) {
      try { updateData.labDetails = JSON.parse(req.body.labDetails); } catch (e) { console.error("Error parsing labDetails:", e); }
    }
    if (req.body.medicalStore) {
      try { updateData.medicalStore = JSON.parse(req.body.medicalStore); } catch (e) { console.error("Error parsing medicalStore:", e); }
    }
    if (req.body.govtSchemes) {
      try { updateData.govtSchemes = JSON.parse(req.body.govtSchemes); } catch (e) { console.error("Error parsing govtSchemes:", e); }
    }
    if (req.body.insurance) {
      try { updateData.insurance = JSON.parse(req.body.insurance); } catch (e) { console.error("Error parsing insurance:", e); }
    }
    if (req.body.services) {
      try { updateData.services = JSON.parse(req.body.services); } catch (e) { console.error("Error parsing services:", e); }
    }
    if (req.body.specialties) {
      updateData.specialties = req.body.specialties;
    }

    // Handle files from upload.fields
    if (req.files) {
      if (req.files.image) {
        updateData.image = req.files.image[0].path;
      }
      if (req.files.gallery) {
        const newGalleryImages = req.files.gallery.map(f => f.path);
        const currentGallery = updateData.gallery || []; 
        updateData.gallery = [...currentGallery, ...newGalleryImages];
      }
      if (req.files.labImages) {
        const newImages = req.files.labImages.map(f => f.path);
        let currentImages = [];
        try {
          currentImages = req.body.existingLabImages ? JSON.parse(req.body.existingLabImages) : (updateData.labDetails?.images || []);
        } catch (e) { console.error("Error parsing existingLabImages:", e); currentImages = []; }
        updateData.labDetails = { ...(updateData.labDetails || {}), images: [...currentImages, ...newImages] };
      }
      if (req.files.medicalImages) {
        const newImages = req.files.medicalImages.map(f => f.path);
        let currentImages = [];
        try {
          currentImages = req.body.existingMedicalImages ? JSON.parse(req.body.existingMedicalImages) : (updateData.medicalStore?.images || []);
        } catch (e) { console.error("Error parsing existingMedicalImages:", e); currentImages = []; }
        updateData.medicalStore = { ...(updateData.medicalStore || {}), images: [...currentImages, ...newImages] };
      }
    }

    const branch = await Branch.findOne({ _id: req.params.id, hospitalId: hospitalId });
    if (!branch) return res.status(404).json({ msg: "Branch not found" });

    branch.set(updateData);
    const updatedBranch = await branch.save();
    
    res.json(updatedBranch);
  } catch (error) {
    console.error("Update Branch Error:", error);
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
