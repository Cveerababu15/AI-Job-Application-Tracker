const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware.js");
const { addJob, getJobs, updateJob, deleteJob, getDashboardStats } = require("../controllers/jobController.js");

router.post("/add", authMiddleware, addJob);
router.get("/all", authMiddleware, getJobs);
router.put("/update/:id", authMiddleware, updateJob);
router.delete("/delete/:id", authMiddleware, deleteJob);
router.get("/dashboard", authMiddleware, getDashboardStats);

module.exports = router;
