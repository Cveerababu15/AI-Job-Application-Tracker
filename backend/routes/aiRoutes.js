const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware.js");
const upload = require("../config/multer.js");
const { analyzeResume, skillGapAnalysis } = require("../controllers/aiController.js");

function handleUpload(req, res, next) {
  upload.single("resume")(req, res, (err) => {
    if (err) {
      const message =
        err.code === "LIMIT_FILE_SIZE"
          ? "PDF is too large. Maximum size is 8 MB."
          : err.message || "File upload failed.";
      return res.status(400).json({ message });
    }
    next();
  });
}

router.post("/analyze", authMiddleware, handleUpload, analyzeResume);
router.post("/skill-gap", authMiddleware, skillGapAnalysis);

module.exports = router;
