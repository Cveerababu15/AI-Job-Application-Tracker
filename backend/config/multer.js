const multer = require("multer");

// Store PDFs in memory — works on serverless/deployed environments without a disk uploads folder
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    const isPdf =
      file.mimetype === "application/pdf" ||
      file.originalname?.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      return cb(new Error("Only PDF files are allowed."));
    }
    cb(null, true);
  },
});

module.exports = upload;
