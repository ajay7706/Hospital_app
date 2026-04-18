const express = require("express");
const router = express.Router();
const { protect, isHospital, isHospitalOrBranch } = require("../middlewares/authMiddleware");
const { upload } = require("../config/cloudinary");
const {
  addBranch,
  getBranchesByHospital,
  getBranchById,
  deleteBranch,
  updateBranch
} = require("../controllers/branchController");

router.post("/add", protect, isHospital, upload.single("image"), addBranch);
router.get("/details/:id", getBranchById);
router.get("/:hospitalId", getBranchesByHospital);
router.put("/:id", protect, isHospitalOrBranch, upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'gallery', maxCount: 10 }
]), updateBranch);
router.delete("/:id", protect, isHospital, deleteBranch);

module.exports = router;