const mongoose = require("mongoose");

const resumeSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    resumeText: String,
    jobDescription: { type: String, default: "" },
    atsScore: { type: Number, default: 0 },
    missingSkills: [String],
    skillsToAdd: [String],
    summary: { type: String, default: "" },
    keyChanges: { type: String, default: "" },
    suggestions: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("ResumeAnalysis", resumeSchema);
