const express = require("express");
const router = express.Router();
const { protect, isHospital } = require("../middlewares/authMiddleware");
const { upload } = require("../config/cloudinary");
const {
  addBranch,
  getBranchesByHospital,
  deleteBranch
} = require("../controllers/branchController");

router.post("/add", protect, isHospital, upload.single("image"), addBranch);
router.get("/:hospitalId", getBranchesByHospital);
router.delete("/:id", protect, isHospital, deleteBranch);

module.exports = router;