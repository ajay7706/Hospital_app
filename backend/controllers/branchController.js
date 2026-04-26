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
    if (branchCount >= 10) {
      return res.status(400).json({ msg: "Maximum 10 branches allowed" });
    }

    // Safe parsing helper
    const tryParse = (val, fallback) => {
      if (!val) return fallback;
      if (typeof val !== 'string') return val;
      try { 
        const parsed = JSON.parse(val); 
        return parsed === null ? fallback : parsed;
      } catch (e) { 
        console.warn(`Failed to parse field: ${val}`, e.message);
        return fallback; 
      }
    };

    const branchData = {
      ...req.body,
      hospitalId: hospital._id,
      image: req.files && req.files.image ? req.files.image[0].path : req.body.image,
      opdChargeType: req.body.opdChargeType || "hospitalDefault",
      opdCharge: req.body.opdCharge || 0,
      govtSchemes: tryParse(req.body.govtSchemes, []),
      insurance: tryParse(req.body.insurance, { accepted: false, providers: [] }),
      labDetails: tryParse(req.body.labDetails, { enabled: false, labName: '', images: [] }),
      medicalStore: tryParse(req.body.medicalStore, { enabled: false, images: [] }),
      workingDays: tryParse(req.body.workingDays, ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]),
      services: tryParse(req.body.services, [])
    };

    if (req.files) {
      if (req.files.labImages) {
        const paths = req.files.labImages.map(f => f.path);
        branchData.labDetails.images = [...(branchData.labDetails.images || []), ...paths];
      }
      if (req.files.medicalImages) {
        const paths = req.files.medicalImages.map(f => f.path);
        branchData.medicalStore.images = [...(branchData.medicalStore.images || []), ...paths];
      }
    }

    const newBranch = await Branch.create(branchData);
    res.status(201).json(newBranch);
  } catch (error) {
    console.error("Add Branch Error:", error);
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};

exports.updateBranch = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`\n--- Update Branch Request [${id}] ---`);
    console.log(`User: ${req.user.id}, Role: ${req.user.role}`);

    let hospitalId;
    if (req.user.role === 'hospital') {
      const hospital = await Hospital.findOne({ userId: req.user.id });
      if (!hospital) return res.status(404).json({ msg: "Hospital profile not found" });
      hospitalId = hospital._id;
    } else if (req.user.role === 'branch') {
      hospitalId = req.user.hospitalId;
      if (!req.user.branchId || id !== req.user.branchId.toString()) {
        console.error("Authorization failed: Branch ID mismatch.");
        return res.status(403).json({ msg: "Not authorized to update this branch" });
      }
    } else {
      return res.status(403).json({ msg: "Unauthorized role" });
    }

    const branch = await Branch.findOne({ _id: id, hospitalId });
    if (!branch) return res.status(404).json({ msg: "Branch not found or does not belong to your hospital" });

    const updateData = {};

    // 1. Basic Fields
    const allowedFields = [
      'branchName', 'city', 'address', 'state', 'pincode', 'latitude', 'longitude',
      'phone', 'ambulanceAvailable', 'emergency24x7', 'branchCapacity', 
      'opdChargeType', 'opdCharge', 'about', 'openingTime', 'closingTime', 
      'startTime', 'endTime', 'emergencyContactNumber', 'slotTime'
    ];

    allowedFields.forEach(f => {
      if (req.body[f] !== undefined) {
        if (f === 'ambulanceAvailable' || f === 'emergency24x7') {
          updateData[f] = req.body[f] === 'true' || req.body[f] === 'on' || req.body[f] === true;
        } else if (f === 'latitude' || f === 'longitude' || f === 'branchCapacity' || f === 'opdCharge') {
          updateData[f] = Number(req.body[f]);
        } else {
          updateData[f] = req.body[f];
        }
      }
    });

    // 2. Complex Fields
    const tryParse = (val, fallback) => {
      if (!val) return fallback;
      if (typeof val !== 'string') return val;
      try { 
        const parsed = JSON.parse(val); 
        return parsed === null ? fallback : parsed;
      } catch (e) { 
        console.warn(`Failed to parse field during update:`, e.message);
        return fallback; 
      }
    };

    if (req.body.govtSchemes) updateData.govtSchemes = tryParse(req.body.govtSchemes, []);
    if (req.body.insurance) updateData.insurance = tryParse(req.body.insurance, { accepted: false, providers: [] });
    if (req.body.labDetails) updateData.labDetails = tryParse(req.body.labDetails, { enabled: false, labName: '', images: [] });
    if (req.body.medicalStore) updateData.medicalStore = tryParse(req.body.medicalStore, { enabled: false, images: [] });
    if (req.body.services) updateData.services = tryParse(req.body.services, []);
    if (req.body.workingDays) updateData.workingDays = tryParse(req.body.workingDays, []);

    // 3. Image & Gallery Handling
    if (req.body.existingGallery) {
      updateData.gallery = tryParse(req.body.existingGallery, branch.gallery || []);
    }

    if (req.files) {
      if (req.files.image) updateData.image = req.files.image[0].path;
      
      if (req.files.gallery) {
        const newImgs = req.files.gallery.map(f => f.path);
        const existing = updateData.gallery || branch.gallery || [];
        updateData.gallery = [...existing, ...newImgs].slice(0, 12);
      }

      // Merge Lab Images
      if (req.files.labImages || req.body.existingLabImages) {
        const newImgs = req.files.labImages ? req.files.labImages.map(f => f.path) : [];
        const existing = tryParse(req.body.existingLabImages, []);
        
        // Ensure we don't lose the 'enabled' and other fields if we only update images
        if (!updateData.labDetails) {
          updateData.labDetails = branch.labDetails ? JSON.parse(JSON.stringify(branch.labDetails)) : { enabled: false, images: [] };
        }
        updateData.labDetails.images = [...existing, ...newImgs];
      }

      // Merge Medical Images
      if (req.files.medicalImages || req.body.existingMedicalImages) {
        const newImgs = req.files.medicalImages ? req.files.medicalImages.map(f => f.path) : [];
        const existing = tryParse(req.body.existingMedicalImages, []);
        
        if (!updateData.medicalStore) {
          updateData.medicalStore = branch.medicalStore ? JSON.parse(JSON.stringify(branch.medicalStore)) : { enabled: false, images: [] };
        }
        updateData.medicalStore.images = [...existing, ...newImgs];
      }
    }

    console.log("Final updateData keys:", Object.keys(updateData));
    if (updateData.labDetails) console.log("Lab Enabled:", updateData.labDetails.enabled);
    if (updateData.medicalStore) console.log("Medical Enabled:", updateData.medicalStore.enabled);

    const updatedBranch = await Branch.findOneAndUpdate(
      { _id: id, hospitalId },
      { $set: updateData },
      { new: true, runValidators: false }
    );
    
    if (!updatedBranch) throw new Error("Update failed: Branch not found after filter.");
    
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
