const express = require('express');
const router=express.Router();

const authMiddleware=require("../middleware/authMiddleware.js")
const upload=require("../config/multer.js")
const {analyzeResume, skillGapAnalysis}= require("../controllers/aiController.js")

router.post("/analyze",authMiddleware,upload.single("resume"),analyzeResume);
router.post("/skill-gap",authMiddleware,skillGapAnalysis)
module.exports=router;
